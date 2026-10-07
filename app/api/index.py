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

Staff routes need the café key in the X-Ode-Staff header (ODE_STAFF_KEY).
"""
import hmac
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

from _ode import pipeline  # noqa: E402
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


def cafe_or_404(cafe_id):
    c = get_cafe(cafe_id)
    if not c:
        raise HTTPException(404, "café not found")
    return c


def staff(key):
    expected = os.environ.get("ODE_STAFF_KEY")
    if not expected:
        if store().kind == "memory":
            return  # local runs without a database are open
        raise HTTPException(503, "set ODE_STAFF_KEY to use the barista board")
    if not key or not hmac.compare_digest(key.encode(), expected.encode()):
        raise HTTPException(401, "wrong café key")


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
    out = s.stock_out(cafe_id)
    seed = json.dumps(inp, sort_keys=True) + str(int(time.time() // 60))  # same words, same minute, same drink

    q = queue.Queue()

    def work():
        try:
            creation = pipeline.make(c["cafe"], c["pantry"], out, inp, seed, use_model, lambda n: q.put({"stage": n}))
            creation = {"id": new_id(), "createdAt": int(time.time() * 1000), **creation}
            s.save_creation(creation)
            q.put({"creation": customer_view(creation)})
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


@app.post("/api/cafes/{cafe_id}/orders")
def place(cafe_id: str, body: OrderIn):
    cafe_or_404(cafe_id)
    s = store()
    cr = s.get_creation(body.creationId)
    if not cr or cr["cafe"] != cafe_id:
        raise HTTPException(404, "this ode was not found")
    # the price comes from the saved creation, never from the phone
    o = s.place(cafe_id, cr["id"], body.size, cr["price"] + SIZES[body.size])
    return {**o, "creation": customer_view(cr)}


@app.get("/api/orders/{oid}")
def order(oid: str):
    s = store()
    o = s.get_order(oid)
    if not o:
        raise HTTPException(404, "order not found")
    return {**o, "creation": customer_view(s.get_creation(o["creationId"]))}


@app.get("/api/cafes/{cafe_id}/board")
def board(cafe_id: str, x_ode_staff: Optional[str] = Header(None)):
    cafe_or_404(cafe_id)
    staff(x_ode_staff)
    s = store()
    orders = s.board(cafe_id)
    full = {}
    for o in orders:
        if o["creationId"] not in full:
            cr = s.get_creation(o["creationId"])
            full[o["creationId"]] = {k: v for k, v in cr.items() if k != "source"}
    return {"orders": [{**o, "creation": full[o["creationId"]]} for o in orders], "out": s.stock_out(cafe_id)}


@app.patch("/api/cafes/{cafe_id}/orders/{oid}")
def advance(cafe_id: str, oid: str, body: StatusIn, x_ode_staff: Optional[str] = Header(None)):
    cafe_or_404(cafe_id)
    staff(x_ode_staff)
    o = store().advance(cafe_id, oid, body.status)
    if not o:
        raise HTTPException(409, "this order has already moved on")
    return o


@app.put("/api/cafes/{cafe_id}/stock/{item}")
def set_stock(cafe_id: str, item: str, body: StockIn, x_ode_staff: Optional[str] = Header(None)):
    c = cafe_or_404(cafe_id)
    staff(x_ode_staff)
    if item not in {i["id"] for i in c["pantry"]}:
        raise HTTPException(404, "not in this pantry")
    store().set_stock(cafe_id, item, body.out)
    return {"out": store().stock_out(cafe_id)}

