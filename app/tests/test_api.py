"""
API tests. A scripted model stands in for the real one, so every path (accepted, retried,
fallen back) runs without a key. Set TEST_DATABASE_URL to run the same tests on Postgres.

  pip install -r requirements.txt pytest httpx && pytest tests
"""
import json
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "api"))

import index  # noqa: E402
from _ode import llm, store  # noqa: E402


class Scripted:
    """Answers each schema from a queue; records every message it was sent."""

    name = "scripted"

    def __init__(self, **answers):
        self.answers = {k: list(v) for k, v in answers.items()}
        self.sent = []
        self.flag = False

    def structured(self, instructions, message, schema, max_tokens=500):
        self.sent.append((schema.__name__, message))
        queue = self.answers.get(schema.__name__)
        if not queue:
            raise llm.ModelError("nothing scripted")
        return schema(**queue.pop(0))

    def flagged(self, text):
        return self.flag


MOOD = {"primary": "cozy", "secondary": None, "temperature": "hot", "families": ["spicy", "chocolate"], "asked": [], "keywords": ["rain", "window"]}
RECIPE = {"ingredients": ["black_tea", "cinnamon", "cardamom", "milk"], "steps": ["Brew the black tea strong.", "Add cinnamon and cardamom.", "Steam the whole milk and pour over."]}
LINES = {"name": "Rain on Glass", "lines": ["the window fogs a little,", "and so do you."]}


@pytest.fixture
def api():
    if os.environ.get("TEST_DATABASE_URL"):
        s = store.Postgres(os.environ["TEST_DATABASE_URL"])
        with s.conn() as c:
            c.execute("truncate orders, creations, stock_out")
    else:
        s = store.Memory()
    store.set_store(s)
    llm.set_model(None)
    index._visits.clear()
    os.environ["ODE_STAFF_KEY"] = "test-key"
    yield TestClient(index.app, headers={"x-ode-staff": "test-key"})
    llm.set_model(None)


def craft(api, **body):
    r = api.post("/api/cafes/demo/craft", json=body)
    assert r.status_code == 200, r.text
    lines = [json.loads(x) for x in r.text.strip().split("\n")]
    assert [x["stage"] for x in lines[:-1]] == [1, 2, 3, 4]
    assert "creation" in lines[-1], lines[-1]
    return lines[-1]["creation"]


def full(cid):
    return store.store().get_creation(cid)


def test_health_without_a_model(api):
    assert api.get("/api/health").json() == {"ok": True, "model": None, "store": store.store().kind}


def test_rules_engine_makes_a_drink_without_a_model(api):
    c = craft(api, text="rainy evening, missing home", moods=["nostalgic"])
    assert c["name"] and len(c["lines"]) == 2
    assert c["recipe"]["temperature"] == "hot"
    assert 490 <= c["price"] <= 1200 and c["price"] % 50 == 40
    assert full(c["id"])["source"] == {"mood": "rules", "recipe": "rules", "lines": "rules"}


def test_customer_never_sees_portions_costs_or_steps(api):
    c = craft(api, text="lazy sunday")
    assert "steps" not in c["recipe"] and "source" not in c
    for i in c["recipe"]["ingredients"]:
        assert "unit" not in i and "cost" not in i
    pantry = api.get("/api/cafes/demo").json()["pantry"]
    assert all("cost" not in i for i in pantry)


def test_model_answers_are_used_when_they_pass(api):
    m = Scripted(MoodRead=[MOOD], Recipe=[RECIPE], Lines=[LINES])
    llm.set_model(m)
    c = craft(api, text="rain on the window")
    assert c["name"] == "Rain on Glass"
    assert [i["id"] for i in c["recipe"]["ingredients"]] == RECIPE["ingredients"]
    assert c["recipe"]["method"] == "steam"
    saved = full(c["id"])
    assert saved["source"] == {"mood": "model", "recipe": "model", "lines": "model"}
    assert saved["recipe"]["steps"] == RECIPE["steps"]
    # portions come from the pantry, not the model
    assert {i["id"]: i["unit"] for i in saved["recipe"]["ingredients"]}["milk"] == "180 ml"
    # price from the pantry costs: (25 + 10 + 15 + 40) × 3.2 = 288, so the 490 floor
    assert c["price"] == 490


def test_customer_taps_win_over_the_model(api):
    llm.set_model(Scripted(MoodRead=[MOOD], Recipe=[], Lines=[]))
    c = craft(api, text="rain", moods=["playful"], temp="cold", flavours=["citrus"])
    mood = full(c["id"])["mood"]
    assert mood["primary"] == "playful" and mood["temperature"] == "cold" and "citrus" in mood["asked"]
    assert c["recipe"]["temperature"] == "cold"


def test_rejected_recipe_is_retried_with_reasons(api):
    bad = {"ingredients": ["black_tea", "espresso", "milk", "oat_milk"], "steps": ["Pull 2 shots of espresso."]}
    m = Scripted(MoodRead=[MOOD], Recipe=[bad, RECIPE], Lines=[LINES])
    llm.set_model(m)
    c = craft(api, text="rain")
    assert [i["id"] for i in c["recipe"]["ingredients"]] == RECIPE["ingredients"]
    retry = [msg for name, msg in m.sent if name == "Recipe"][1]
    assert "exactly one base" in retry and "at most one milk" in retry and "amounts" in retry


def test_recipe_falls_back_to_rules_after_two_failures(api):
    clash = {"ingredients": ["hibiscus", "cocoa"], "steps": ["Brew the hibiscus.", "Add the lemon."]}
    llm.set_model(Scripted(MoodRead=[MOOD], Recipe=[clash, clash], Lines=[LINES]))
    c = craft(api, text="rain")
    assert full(c["id"])["source"]["recipe"] == "rules"
    assert c["name"] == "Rain on Glass"


def test_model_can_only_choose_from_allowed_pantry(api):
    m = Scripted(MoodRead=[MOOD], Recipe=[], Lines=[])
    llm.set_model(m)
    api.put("/api/cafes/demo/stock/cinnamon", json={"out": True})
    craft(api, text="rain", diet=["vegan", "caffeine"])
    menu = [msg for name, msg in m.sent if name == "Recipe"][0]
    for gone in ("milk", "honey", "caramel", "black_tea", "espresso", "cinnamon"):
        assert f'"id": "{gone}"' not in menu
    assert '"id": "oat_milk"' in menu


def test_lines_with_the_wrong_voice_are_replaced(api):
    loud = {"name": "Cozy Chai Delight", "lines": ["A Warm Hug — In A Cup!", "enjoy"]}
    llm.set_model(Scripted(MoodRead=[MOOD], Recipe=[RECIPE], Lines=[loud, loud]))
    c = craft(api, text="rain")
    assert full(c["id"])["source"]["lines"] == "rules"
    assert "—" not in " ".join(c["lines"])


def test_flagged_words_are_not_echoed(api):
    m = Scripted(MoodRead=[MOOD], Recipe=[RECIPE], Lines=[LINES])
    m.flag = True
    llm.set_model(m)
    c = craft(api, text="something unkind")
    assert full(c["id"])["source"]["lines"] == "rules"
    assert not any(name == "Lines" for name, _ in m.sent)


def test_model_outage_still_makes_a_drink(api):
    llm.set_model(Scripted())
    c = craft(api, text="first day of summer")
    assert full(c["id"])["source"] == {"mood": "rules", "recipe": "rules", "lines": "rules"}


def test_stock_out_keeps_an_ingredient_out_of_new_drinks(api):
    for item in ("ice", "mint"):
        api.put(f"/api/cafes/demo/stock/{item}", json={"out": True})
    for text in ("first day of summer, iced", "playful, sunny", "lemon fresh"):
        c = craft(api, text=text, temp="cold")
        assert not {"ice", "mint"} & {i["id"] for i in c["recipe"]["ingredients"]}


def test_order_flow_and_board(api):
    c = craft(api, text="lazy sunday")
    o = api.post("/api/cafes/demo/orders", json={"creationId": c["id"], "size": "large"}).json()
    assert len(o["code"]) == 3 and o["status"] == "new"
    assert o["price"] == c["price"] + 150
    assert api.get(f"/api/orders/{o['id']}").json()["creation"]["name"] == c["name"]

    board = api.get("/api/cafes/demo/board").json()["orders"]
    assert board[0]["creation"]["recipe"]["steps"]  # staff see the method
    assert api.patch(f"/api/cafes/demo/orders/{o['id']}", json={"status": "ready"}).status_code == 409
    for s in ("making", "ready", "collected"):
        assert api.patch(f"/api/cafes/demo/orders/{o['id']}", json={"status": s}).json()["status"] == s
    assert api.get("/api/cafes/demo/board").json()["orders"] == []
    assert api.get(f"/api/orders/{o['id']}").json()["status"] == "collected"


def test_order_codes_are_unique_while_active(api):
    c = craft(api, text="calm")
    codes = {api.post("/api/cafes/demo/orders", json={"creationId": c["id"]}).json()["code"] for _ in range(40)}
    assert len(codes) == 40


def test_staff_routes_need_the_cafe_key(api):
    os.environ["ODE_STAFF_KEY"] = "linen-morning-42"
    api.headers.pop("x-ode-staff")
    assert api.get("/api/cafes/demo/board").status_code == 401
    assert api.get("/api/cafes/demo/board", headers={"x-ode-staff": "nope"}).status_code == 401
    assert api.put("/api/cafes/demo/stock/ice", json={"out": True}).status_code == 401
    assert api.get("/api/cafes/demo/board", headers={"x-ode-staff": "linen-morning-42"}).status_code == 200


def test_bad_input_is_refused(api):
    assert api.post("/api/cafes/demo/craft", json={"moods": ["furious"]}).status_code == 422
    assert api.post("/api/cafes/demo/craft", json={"text": "x" * 401}).status_code == 422
    assert api.post("/api/cafes/nowhere/craft", json={}).status_code == 404
    assert api.post("/api/cafes/demo/orders", json={"creationId": "nope"}).status_code == 404
    assert api.put("/api/cafes/demo/stock/gold", json={"out": True}).status_code == 404


def test_rating_is_saved(api):
    c = craft(api, text="calm")
    assert api.post(f"/api/creations/{c['id']}/rating", json={"rating": 5, "chips": ["perfect"]}).status_code == 200
    assert api.post(f"/api/creations/{c['id']}/rating", json={"rating": 9}).status_code == 422


def test_visitors_are_slowed_down(api):
    for _ in range(8):
        craft(api, text="calm")
    assert api.post("/api/cafes/demo/craft", json={"text": "calm"}).status_code == 429
