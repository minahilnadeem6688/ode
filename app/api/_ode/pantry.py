"""
The café's pantry and the hard rules around it. Everything here is decided in code, never by
the model: what is in stock, what suits the temperature, what is safe for this person, what
one portion is, and what the drink costs.
"""
import json
import math
from pathlib import Path

DATA = json.loads((Path(__file__).parent / "demo_cafe.json").read_text(encoding="utf-8"))
MOODS = DATA["moods"]
FLAVOURS = DATA["flavours"]
DIETS = DATA["diets"]
TEMPS = ["hot", "cold", "room"]
SIZES = {"regular": 0, "large": 150}

# Cafés known to this deployment. The owner dashboard will write these to the database;
# until then every deployment serves the demo café.
CAFES = {DATA["cafe"]["id"]: {"cafe": DATA["cafe"], "pantry": DATA["pantry"]}}


def get_cafe(cafe_id):
    return CAFES.get(cafe_id)


def allowed(pantry, temperature, diet, out):
    d, out = set(diet or []), set(out or [])

    def ok(i):
        allergens = i.get("allergens", [])
        return (
            i["id"] not in out
            and temperature in i["temps"]
            and not ("vegan" in d and ("dairy" in allergens or i.get("notVegan")))
            and not ("dairy" in d and "dairy" in allergens)
            and not ("nuts" in d and "nuts" in allergens)
            and not ("caffeine" in d and i.get("caffeine"))
            and not ("sugar" in d and i["category"] == "sweet")
        )

    return [i for i in pantry if ok(i)]


def price_of(cafe, ingredients):
    cost = sum(i["cost"] for i in ingredients)
    raw = min(cafe["maxPrice"], max(cafe["minPrice"], cost * cafe["margin"]))
    return math.ceil(raw / 50) * 50 - 10  # 590, 640, 690: café-style prices


def method_for(ingredients, temperature):
    cats = {i["category"] for i in ingredients}
    if temperature == "hot":
        return "steam" if "milk" in cats else "hot brew"
    if "fruit" in cats:
        return "muddle"
    return "layer" if "fizz" in cats else "shake"


def prep_seconds(ingredients):
    return 90 + len(ingredients) * 25


def customer_view(creation):
    """What the customer's phone gets: ingredients by name, never portions, costs or steps."""
    r = creation["recipe"]
    return {
        **{k: v for k, v in creation.items() if k not in ("recipe", "source")},
        "recipe": {
            "ingredients": [{k: i[k] for k in ("id", "name", "category", "color", "families")} for i in r["ingredients"]],
            "method": r["method"],
            "temperature": r["temperature"],
        },
    }
