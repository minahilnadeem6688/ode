"""
ode API. Served by Vercel next to the app, so every route lives under /api.

  GET   /api/health                                  what is switched on
  POST  /api/leads                                   a café asking for ode (website form)
  GET   /api/cafes/{cafe}                            café, pantry and what is out of stock
  POST  /api/cafes/{cafe}/craft                      write an ode (streams each stage as it finishes)
  GET   /api/creations/{id}                          one ode, as the customer sees it
  POST  /api/creations/{id}/rating                   how it felt
  POST  /api/cafes/{cafe}/orders                     order an ode
  GET   /api/orders/{id}                             the customer's order status
  GET   /api/cafes/{cafe}/board            staff     orders in progress, with full recipes
  PATCH /api/cafes/{cafe}/orders/{id}      staff     move an order along
  PUT   /api/cafes/{cafe}/stock/{item}     staff     mark an ingredient in or out
  GET   /api/cafes/{cafe}/stats            staff     the dashboard: orders, ratings, what people feel
  GET   /api/cafes/{cafe}/menu             staff     the café's drinks, mode, coverage and suggestions
  PUT   /api/cafes/{cafe}/menu/mode        staff     approved (serve only approved drinks) or open
  POST  /api/cafes/{cafe}/menu/recipes     staff     add a drink (approved straight away)
  PATCH /api/cafes/{cafe}/menu/recipes/{id} staff    edit, approve, switch off
  DELETE /api/cafes/{cafe}/menu/recipes/{id} staff   remove
  POST  /api/cafes/{cafe}/menu/suggest     staff     ode suggests new drinks from the pantry
  POST  /api/cafes/{cafe}/menu/preview     staff     which drink a guest with this mood would get
  GET   /api/leads                         admin     cafés that asked for a pilot

  POST  /api/auth/signup                             customer account: name, email, password
  POST  /api/auth/login                              customer sign in
  POST  /api/auth/team                               café team sign in with the café key
  GET   /api/me                            customer  profile, saved odes and order history
  PUT   /api/me/saved/{id}                 customer  save an ode (DELETE to unsave)

Customers and the café team sign in separately (see _ode/auth.py). Staff routes take the team's
session (Authorization: Bearer) or the café key itself in the X-Ode-Staff header.
"""
import json
import os
import queue
import sys
import threading
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import List, Literal, Optional

sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Header, HTTPException, Request  # noqa: E402
from fastapi.responses import StreamingResponse  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from _ode import auth, house, pipeline, rules  # noqa: E402
from _ode.llm import model  # noqa: E402
from _ode.pantry import DIETS, FLAVOURS, MOODS, SIZES, customer_view, get_cafe  # noqa: E402
from _ode.store import new_id, store  # noqa: E402

app = FastAPI(title="ode", docs_url=None, redoc_url=None, openapi_url=None)

DAILY_MODEL_LIMIT = int(os.environ.get("ODE_DAILY_MODEL_LIMIT", "400"))  # per café, keeps the model bill predictable
PER_VISITOR = (8, 600)  # at most 8 odes per visitor per 10 minutes


class CraftIn(BaseModel):
    text: str = Field("", max_length=400)
    moods: List[Literal[tuple(MOODS)]] = Field(default_factory=list, max_length=3)
    temp: Optional[Literal["hot", "cold", "room"]] = None
    sweetness: int = Field(5, ge=0, le=10)
    flavours: List[Literal[tuple(FLAVOURS)]] = Field(default_factory=list, max_length=4)
    diet: List[Literal[tuple(DIETS)]] = Field(default_factory=list)
    notes: str = Field("", max_length=140)


class OrderIn(BaseModel):
    creationId: str = Field(max_length=40)
    size: Literal[tuple(SIZES)] = "regular"


class RatingIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    chips: List[str] = Field(default_factory=list, max_length=6)


class StatusIn(BaseModel):
    status: Literal["making", "ready", "collected"]


class LeadIn(BaseModel):
    cafe_name: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=60)
    city: str = Field(min_length=2, max_length=40)
    contact: str = Field(min_length=5, max_length=80)  # phone or email, whichever they prefer
    message: str = Field("", max_length=600)
    website: str = Field("", max_length=0)  # left empty by people; bots fill it in


class StockIn(BaseModel):
    out: bool


class SignupIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=8, max_length=200)


class LoginIn(BaseModel):
    email: str = Field(max_length=200)
    password: str = Field(max_length=200)


class RecipeIn(BaseModel):
    name: str = Field(min_length=2, max_length=40)
    ingredients: List[str] = Field(min_length=1, max_length=6)
    temperature: Literal["hot", "cold", "room"]
    moods: List[Literal[tuple(MOODS)]] = Field(default_factory=list, max_length=4)
    price: Optional[int] = Field(None, ge=100, le=10000)
    steps: List[str] = Field(default_factory=list, max_length=6)


class RecipePatch(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=40)
    ingredients: Optional[List[str]] = Field(None, min_length=1, max_length=6)
    temperature: Optional[Literal["hot", "cold", "room"]] = None
    moods: Optional[List[Literal[tuple(MOODS)]]] = Field(None, max_length=4)
    price: Optional[int] = Field(None, ge=0, le=10000)  # 0 goes back to the automatic price
    steps: Optional[List[str]] = Field(None, max_length=6)
    status: Optional[Literal["approved", "suggested", "off"]] = None


class ModeIn(BaseModel):
    mode: Literal["approved", "open"]


class TeamIn(BaseModel):
    cafe: str = Field(max_length=40)
    key: str = Field(max_length=200)


def cafe_mode(c, cafe_id):
    return store().get_mode(cafe_id) or c["cafe"].get("mode", "open")


def cafe_or_404(cafe_id):
    c = get_cafe(cafe_id)
    if not c:
        raise HTTPException(404, "café not found")
    return c


def staff(cafe_id, key=None, authorization=None, admin=False):
    """The café team: a signed-in team session, or the café key itself."""
    claims = auth.bearer(authorization)
    if claims and claims.get("role") == "staff" and (claims.get("admin") or not admin) and (admin or claims.get("cafe") == cafe_id):
        return claims
    if not os.environ.get("ODE_STAFF_KEY"):
        if store().kind == "memory":
            return {"role": "staff", "cafe": cafe_id, "admin": True}  # local runs without a database are open
        raise HTTPException(503, "set ODE_STAFF_KEY to use the café tools")
    if key and auth.key_matches(key, "ODE_STAFF_KEY") and not admin:
        return {"role": "staff", "cafe": cafe_id}
    raise HTTPException(401, "please sign in as the café team")


def customer(authorization, required=True):
    claims = auth.bearer(authorization)
    if claims and claims.get("role") == "customer":
        u = store().user_by_id(claims["sub"])
        if u:
            return u
    if required:
        raise HTTPException(401, "please sign in")
    return None


def public_user(u):
    return {"id": u["id"], "name": u["name"], "email": u["email"], "createdAt": u["createdAt"]}


_tries = defaultdict(deque)


def door(request, limit=10, window=600):
    """Slows down password guessing: a few attempts per visitor per ten minutes."""
    who = request.headers.get("x-forwarded-for", request.client.host if request.client else "?").split(",")[0].strip()
    q, now = _tries[who], time.monotonic()
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(429, "too many attempts. try again in a few minutes")
    q.append(now)


_visits = defaultdict(deque)


def slow_down(request):
    who = request.headers.get("x-forwarded-for", request.client.host if request.client else "?").split(",")[0].strip()
    q, now = _visits[who], time.monotonic()
    while q and now - q[0] > PER_VISITOR[1]:
        q.popleft()
    if len(q) >= PER_VISITOR[0]:
        raise HTTPException(429, "that is a lot of odes. try again in a few minutes")
    q.append(now)


@app.get("/api/health")
def health():
    m = model()
    return {"ok": True, "model": m.name if m else None, "store": store().kind}


@app.post("/api/leads")
def lead(body: LeadIn, request: Request):
    """A café asking for ode from the website."""
    slow_down(request)
    store().add_lead({k: v.strip() for k, v in body.model_dump(exclude={"website"}).items()})
    return {"ok": True}


@app.get("/api/cafes/{cafe_id}")
def cafe(cafe_id: str):
    c = cafe_or_404(cafe_id)
    pantry = [{k: v for k, v in i.items() if k != "cost"} for i in c["pantry"]]
    return {"cafe": {k: v for k, v in c["cafe"].items() if k != "margin"}, "pantry": pantry, "out": store().stock_out(cafe_id)}


@app.post("/api/cafes/{cafe_id}/craft")
def craft(cafe_id: str, body: CraftIn, request: Request):
    """Streams one JSON object per line: {"stage": n} as each stage finishes, then {"creation": ...}."""
    c = cafe_or_404(cafe_id)
    slow_down(request)
    s = store()
    inp = body.model_dump()
    use_model = s.crafts_today(cafe_id) < DAILY_MODEL_LIMIT
    mode = cafe_mode(c, cafe_id)
    recipes = house.menu(s, cafe_id) if mode == "approved" else None
    out = s.stock_out(cafe_id)
    seed = json.dumps(inp, sort_keys=True) + str(int(time.time() // 60))  # same words, same minute, same drink

    q = queue.Queue()

    def work():
        try:
            creation = pipeline.make(c["cafe"], c["pantry"], out, inp, seed, use_model, lambda n: q.put({"stage": n}), recipes, mode)
            creation = {"id": new_id(), "createdAt": int(time.time() * 1000), **creation}
            s.save_creation(creation)
            q.put({"creation": customer_view(creation)})
        except house.NothingFits:
            q.put({"error": "nothing on today's menu fits those choices. try loosening one, or ask at the counter"})
        except Exception:
            q.put({"error": "could not write this one. try again"})

    def stream():
        threading.Thread(target=work, daemon=True).start()
        while True:
            msg = q.get(timeout=55)
            yield json.dumps(msg) + "\n"
            if "stage" not in msg:
                return

    return StreamingResponse(stream(), media_type="application/x-ndjson", headers={"cache-control": "no-store"})


@app.get("/api/creations/{cid}")
def creation(cid: str):
    cr = store().get_creation(cid)
    if not cr:
        raise HTTPException(404, "not found")
    return customer_view(cr)


@app.post("/api/creations/{cid}/rating")
def rate(cid: str, body: RatingIn):
    chips = [x[:40] for x in body.chips]
    if not store().rate(cid, body.rating, chips):
        raise HTTPException(404, "not found")
    return {"ok": True}


def _private(o):
    return {k: v for k, v in o.items() if k != "userId"}


@app.post("/api/cafes/{cafe_id}/orders")
def place(cafe_id: str, body: OrderIn, authorization: Optional[str] = Header(None)):
    cafe_or_404(cafe_id)
    s = store()
    cr = s.get_creation(body.creationId)
    if not cr or cr["cafe"] != cafe_id:
        raise HTTPException(404, "this ode was not found")
    who = customer(authorization, required=False)  # signed-in customers get it in their history
    # the price comes from the saved creation, never from the phone
    o = s.place(cafe_id, cr["id"], body.size, cr["price"] + SIZES[body.size], who["id"] if who else None)
    return {**_private(o), "creation": customer_view(cr)}


@app.get("/api/orders/{oid}")
def order(oid: str):
    s = store()
    o = s.get_order(oid)
    if not o:
        raise HTTPException(404, "order not found")
    return {**_private(o), "creation": customer_view(s.get_creation(o["creationId"]))}


@app.get("/api/cafes/{cafe_id}/board")
def board(cafe_id: str, x_ode_staff: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    cafe_or_404(cafe_id)
    staff(cafe_id, x_ode_staff, authorization)
    s = store()
    orders = s.board(cafe_id)
    full = {}
    for o in orders:
        if o["creationId"] not in full:
            cr = s.get_creation(o["creationId"])
            full[o["creationId"]] = {k: v for k, v in cr.items() if k != "source"}
    return {"orders": [{**_private(o), "creation": full[o["creationId"]]} for o in orders], "out": s.stock_out(cafe_id)}


@app.patch("/api/cafes/{cafe_id}/orders/{oid}")
def advance(cafe_id: str, oid: str, body: StatusIn, x_ode_staff: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    cafe_or_404(cafe_id)
    staff(cafe_id, x_ode_staff, authorization)
    o = store().advance(cafe_id, oid, body.status)
    if not o:
        raise HTTPException(409, "this order has already moved on")
    return _private(o)


@app.put("/api/cafes/{cafe_id}/stock/{item}")
def set_stock(cafe_id: str, item: str, body: StockIn, x_ode_staff: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    c = cafe_or_404(cafe_id)
    staff(cafe_id, x_ode_staff, authorization)
    if item not in {i["id"] for i in c["pantry"]}:
        raise HTTPException(404, "not in this pantry")
    store().set_stock(cafe_id, item, body.out)
    return {"out": store().stock_out(cafe_id)}



@app.get("/api/cafes/{cafe_id}/stats")
def stats(cafe_id: str, x_ode_staff: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    cafe_or_404(cafe_id)
    staff(cafe_id, x_ode_staff, authorization)
    return store().stats(cafe_id)


# The café's menu ------------------------------------------------------------------------------

def check_recipe_in(c, ingredients, temperature, steps):
    by_id = {i["id"]: i for i in c["pantry"]}
    if len(set(ingredients)) != len(ingredients):
        raise HTTPException(422, "an ingredient is listed twice")
    for iid in ingredients:
        if iid not in by_id:
            raise HTTPException(422, f"{iid} is not in your pantry")
        if temperature not in by_id[iid]["temps"]:
            raise HTTPException(422, f"{by_id[iid]['name']} cannot be served {'iced' if temperature == 'cold' else temperature}")
    if any(len(x) > 160 for x in steps or []):
        raise HTTPException(422, "keep each step under 160 characters")


def menu_view(c, cafe_id):
    s = store()
    recipes, out = house.menu(s, cafe_id), s.stock_out(cafe_id)
    return {
        "mode": cafe_mode(c, cafe_id),
        "recipes": [house.view(c["cafe"], r, c["pantry"], out) for r in recipes],
        "coverage": house.coverage(recipes, c["pantry"], out),
        "moods": MOODS,
    }


@app.get("/api/cafes/{cafe_id}/menu")
def get_menu(cafe_id: str, x_ode_staff: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    c = cafe_or_404(cafe_id)
    staff(cafe_id, x_ode_staff, authorization)
    return menu_view(c, cafe_id)


@app.put("/api/cafes/{cafe_id}/menu/mode")
def set_mode(cafe_id: str, body: ModeIn, x_ode_staff: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    c = cafe_or_404(cafe_id)
    staff(cafe_id, x_ode_staff, authorization)
    if body.mode == "approved" and not any(r["status"] == "approved" for r in house.menu(store(), cafe_id)):
        raise HTTPException(422, "approve at least one drink first")
    store().set_mode(cafe_id, body.mode)
    return menu_view(c, cafe_id)


@app.post("/api/cafes/{cafe_id}/menu/recipes")
def add_recipe(cafe_id: str, body: RecipeIn, x_ode_staff: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    c = cafe_or_404(cafe_id)
    staff(cafe_id, x_ode_staff, authorization)
    check_recipe_in(c, body.ingredients, body.temperature, body.steps)
    r = body.model_dump()
    r["name"] = r["name"].strip()
    r["moods"] = r["moods"] or house.auto_moods(body.ingredients, body.temperature, c["pantry"])
    r["steps"] = [x.strip() for x in r["steps"] if x.strip()]
    house.menu(store(), cafe_id)  # plant the starter menu first, so this drink is added to it
    saved = store().add_recipe(cafe_id, {**r, "status": "approved", "source": "house"})
    return house.view(c["cafe"], saved, c["pantry"], store().stock_out(cafe_id))


@app.patch("/api/cafes/{cafe_id}/menu/recipes/{rid}")
def edit_recipe(cafe_id: str, rid: str, body: RecipePatch, x_ode_staff: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    c = cafe_or_404(cafe_id)
    staff(cafe_id, x_ode_staff, authorization)
    s = store()
    cur = next((r for r in house.menu(s, cafe_id) if r["id"] == rid), None)
    if not cur:
        raise HTTPException(404, "that drink is not on your menu")
    fields = body.model_dump(exclude_none=True)
    if "price" in fields and fields["price"] == 0:
        fields["price"] = None
    check_recipe_in(c, fields.get("ingredients", cur["ingredients"]), fields.get("temperature", cur["temperature"]), fields.get("steps"))
    if fields.get("status") == "approved":
        fields["why"] = None
    if cur["status"] == "approved" and fields.get("status") in ("off", "suggested") and cafe_mode(c, cafe_id) == "approved":
        left = [r for r in house.menu(s, cafe_id) if r["status"] == "approved" and r["id"] != rid]
        if not left:
            raise HTTPException(422, "this is the last approved drink. approve another one first")
    r = s.update_recipe(cafe_id, rid, fields)
    return house.view(c["cafe"], r, c["pantry"], s.stock_out(cafe_id))


@app.delete("/api/cafes/{cafe_id}/menu/recipes/{rid}")
def remove_recipe(cafe_id: str, rid: str, x_ode_staff: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    c = cafe_or_404(cafe_id)
    staff(cafe_id, x_ode_staff, authorization)
    s = store()
    menu = house.menu(s, cafe_id)
    cur = next((r for r in menu if r["id"] == rid), None)
    if not cur:
        raise HTTPException(404, "that drink is not on your menu")
    if cur["status"] == "approved" and cafe_mode(c, cafe_id) == "approved" and sum(r["status"] == "approved" for r in menu) == 1:
        raise HTTPException(422, "this is the last approved drink. approve another one first")
    s.delete_recipe(cafe_id, rid)
    return {"ok": True}


@app.post("/api/cafes/{cafe_id}/menu/suggest")
def suggest(cafe_id: str, x_ode_staff: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    c = cafe_or_404(cafe_id)
    staff(cafe_id, x_ode_staff, authorization)
    s = store()
    menu = house.menu(s, cafe_id)
    # earlier suggestions the owner did not act on make way for fresh ones
    for r in menu:
        if r["status"] == "suggested":
            s.delete_recipe(cafe_id, r["id"])
    kept = [r for r in menu if r["status"] != "suggested"]
    for r in house.suggest(c["cafe"], c["pantry"], kept, s.stock_out(cafe_id), seed=str(time.time())):
        s.add_recipe(cafe_id, r)
    return menu_view(c, cafe_id)


def because(mood, r, fams):
    """Why a drink fits, in words an owner can read: "suits nostalgic", "spicy and caramel notes"."""
    out = [f"suits {mood['primary']}"] if mood["primary"] in (r.get("moods") or []) else []
    notes = [f for f in mood["families"] if f in fams][:2]
    if notes:
        out.append(" and ".join(notes) + " notes")
    return out


@app.post("/api/cafes/{cafe_id}/menu/preview")
def preview(cafe_id: str, body: CraftIn, x_ode_staff: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    """The drinks a guest with this mood would get, best first, without making anything."""
    c = cafe_or_404(cafe_id)
    staff(cafe_id, x_ode_staff, authorization)
    s = store()
    inp = body.model_dump()
    mood = rules.read_mood(inp)
    out = s.stock_out(cafe_id)
    try:
        rows = house.choose(house.menu(s, cafe_id), c["pantry"], mood, out, json.dumps(inp, sort_keys=True), bool(inp.get("temp")))
    except house.NothingFits:
        return {"mood": mood, "picks": []}
    picks = []
    for sc, r, made in rows[:3]:
        fams = {f for i in made["ingredients"] for f in i["families"]}
        picks.append({
            "id": r["id"], "name": r["name"], "temperature": r["temperature"],
            "price": house.price_for(c["cafe"], r, made), "swaps": made["swaps"],
            "because": because(mood, r, fams),
        })
    return {"mood": mood, "picks": picks}


@app.get("/api/leads")
def leads(authorization: Optional[str] = Header(None)):
    staff(None, authorization=authorization, admin=True)
    return {"leads": store().list_leads()}


# Accounts

@app.post("/api/auth/signup")
def signup(body: SignupIn, request: Request):
    door(request)
    email = auth.clean_email(body.email)
    if not auth.EMAIL.match(email):
        raise HTTPException(422, "that email does not look right")
    u = store().create_user(email, body.name.strip(), auth.hash_password(body.password))
    if not u:
        raise HTTPException(409, "there is already an account with this email. try signing in")
    return {"token": auth.customer_token(u["id"]), "user": public_user(u)}


@app.post("/api/auth/login")
def login(body: LoginIn, request: Request):
    door(request)
    u = store().user_by_email(auth.clean_email(body.email))
    if not u or not auth.check_password(body.password, u["pw_hash"]):
        raise HTTPException(401, "that email and password do not match")
    return {"token": auth.customer_token(u["id"]), "user": public_user(u)}


@app.post("/api/auth/team")
def team(body: TeamIn, request: Request):
    door(request)
    c = cafe_or_404(body.cafe.strip().lower())
    if not os.environ.get("ODE_STAFF_KEY") and store().kind == "memory":
        ok, admin = True, True  # local runs
    else:
        admin = auth.key_matches(body.key, "ODE_ADMIN_KEY") or (not os.environ.get("ODE_ADMIN_KEY") and auth.key_matches(body.key, "ODE_STAFF_KEY"))
        ok = admin or auth.key_matches(body.key, "ODE_STAFF_KEY")
    if not ok:
        raise HTTPException(401, "that café key is not right")
    cafe_id = c["cafe"]["id"]
    return {"token": auth.staff_token(cafe_id, admin), "cafe": {"id": cafe_id, "name": c["cafe"]["name"]}, "admin": admin}


@app.get("/api/me")
def me(authorization: Optional[str] = Header(None)):
    u = customer(authorization)
    s = store()
    orders = []
    for o in s.orders_for(u["id"]):
        cr = s.get_creation(o["creationId"])
        orders.append({**_private(o), "creation": customer_view(cr) if cr else None})
    return {"user": public_user(u), "saved": [customer_view(c) for c in s.saved(u["id"])], "orders": orders}


@app.put("/api/me/saved/{cid}")
def save(cid: str, authorization: Optional[str] = Header(None)):
    u = customer(authorization)
    if not store().get_creation(cid):
        raise HTTPException(404, "not found")
    store().save_ode(u["id"], cid, True)
    return {"ok": True}


@app.delete("/api/me/saved/{cid}")
def unsave(cid: str, authorization: Optional[str] = Header(None)):
    u = customer(authorization)
    store().save_ode(u["id"], cid, False)
    return {"ok": True}
