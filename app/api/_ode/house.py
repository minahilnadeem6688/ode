"""
The café's own menu. In approved mode (the default) a guest only ever gets a drink the café
has approved: ode chooses which one fits the mood and writes the name and lines, but the
recipe, portions and price are the café's.

  recipe  {id, name, ingredients: [pantry ids], temperature, moods, price?, steps?, status, source}
  status  approved (served), suggested (waiting for the owner), off (kept, not served)

Also here: the coverage map (which moods have a drink, hot and iced), suggestions for new
drinks from the café's own pantry, and the preview the owner uses to see what a guest would get.
"""
import random

from . import rules
from .pantry import DATA, MOODS, allowed, method_for, price_of
from .store import new_id

DEFAULT_MENU = {DATA["cafe"]["id"]: DATA.get("menu", [])}
MODES = ("approved", "open")
TEMPS = ("hot", "cold", "room")
MILK_SWAP = ("oat_milk", "coconut_milk")  # tried in this order for dairy-free and vegan guests


class NothingFits(Exception):
    """No approved drink can be served for this guest right now (stock, diet or temperature)."""


def menu(s, cafe_id):
    """The café's recipes, planting the starter menu the first time a café is opened."""
    if not s.menu_seeded(cafe_id):
        for r in DEFAULT_MENU.get(cafe_id, []):
            s.add_recipe(cafe_id, {**r, "status": "approved", "source": "house"})
        s.mark_seeded(cafe_id)
    return s.recipes(cafe_id)


def resolve(recipe, pantry, mood, out):
    """The recipe as it can be made for this guest, or None when it can't be.
    Milk becomes oat (or coconut) milk for dairy-free and vegan guests when the café has it."""
    by_id = {i["id"]: i for i in pantry}
    ok = {i["id"] for i in allowed(pantry, recipe["temperature"], mood.get("diet"), out)}
    parts, swaps = [], []
    for iid in recipe["ingredients"]:
        item = by_id.get(iid)
        if not item:
            return None
        if iid in ok:
            parts.append(item)
            continue
        alt = next((m for m in MILK_SWAP if item["category"] == "milk" and m in ok and m != iid), None)
        if not alt:
            return None
        parts.append(by_id[alt])
        swaps.append({"from": item["name"], "to": by_id[alt]["name"]})
    return {"ingredients": parts, "swaps": swaps}


def score(recipe, made, mood, rng):
    m = set(recipe.get("moods") or [])
    fams = {f for i in made["ingredients"] for f in i["families"]}
    s = 0.0
    if mood["primary"] in m:
        s += 3
    if mood.get("secondary") in m:
        s += 1.5
    s += sum(1 for f in mood.get("families", []) if f in fams)
    s += 2 * sum(1 for f in mood.get("asked", []) if f in fams)
    sweet = any(i["category"] == "sweet" for i in made["ingredients"])
    if mood.get("sweetness", 5) >= 7 and sweet:
        s += 0.5
    if mood.get("sweetness", 5) <= 2 and sweet:
        s -= 1
    return s + rng.random() * 0.8  # a little variety between equally good drinks


def ranked(recipes, pantry, mood, out, seed, strict_temp=True):
    """Approved drinks that can be served for this guest, best first."""
    rng = random.Random(seed + "house")
    rows = []
    for r in recipes:
        if r["status"] != "approved":
            continue
        if strict_temp and r["temperature"] != mood["temperature"]:
            continue
        made = resolve(r, pantry, mood, out)
        if made:
            rows.append((score(r, made, mood, rng), r, made))
    rows.sort(key=lambda x: -x[0])
    return rows


def choose(recipes, pantry, mood, out, seed, temp_chosen):
    """The candidates for this guest. If the guest did not pick a temperature and nothing fits
    the one their mood leans to, the other temperature is allowed. Never an unapproved drink."""
    rows = ranked(recipes, pantry, mood, out, seed)
    if not rows and not temp_chosen:
        rows = ranked(recipes, pantry, mood, out, seed, strict_temp=False)
    if not rows:
        raise NothingFits()
    return rows


def recipe_for(r, made, mood):
    """The served recipe, in the same shape the open engine produces."""
    ing = made["ingredients"]
    method = method_for(ing, r["temperature"])
    steps = list(r.get("steps") or []) or rules.steps_for(ing, method, r["temperature"])
    for sw in made["swaps"]:
        steps.append(f"Made with {sw['to'].lower()} instead of {sw['from'].lower()} for this guest.")
    return {
        "ingredients": ing, "method": method, "temperature": r["temperature"], "steps": steps,
        "prepSeconds": 90 + len(ing) * 25, "house": {"id": r["id"], "name": r["name"]}, "swaps": made["swaps"],
    }


def price_for(cafe, r, made):
    return r.get("price") or price_of(cafe, made["ingredients"])


# The owner's tools ---------------------------------------------------------------------------

def coverage(recipes, pantry, out):
    """For every mood: how many approved drinks could be served hot and iced right now."""
    cells = {m: {"hot": 0, "cold": 0} for m in MOODS}
    for r in recipes:
        if r["status"] != "approved" or r["temperature"] not in ("hot", "cold"):
            continue
        if not resolve(r, pantry, {"diet": []}, out):
            continue
        for m in r.get("moods") or []:
            if m in cells:
                cells[m][r["temperature"]] += 1
    return cells


def auto_moods(ingredient_ids, temperature, pantry):
    """Moods a drink suits, from its flavours and temperature. The owner can change them."""
    by_id = {i["id"]: i for i in pantry}
    fams = {f for iid in ingredient_ids for f in by_id[iid]["families"]} if all(iid in by_id for iid in ingredient_ids) else set()
    scored = []
    for m, (lean_temp, lean_fams) in rules.MOOD_LEAN.items():
        s = sum(f in fams for f in lean_fams) * 2 + (1 if lean_temp == temperature else 0)
        scored.append((s, m))
    scored.sort(key=lambda x: (-x[0], MOODS.index(x[1])))
    return [m for s, m in scored[:3] if s >= 2] or [scored[0][1]]


BASE_WORD = {"espresso": ("Latte", "Americano"), "cold_brew": ("Cold Brew", "Cold Brew"), "black_tea": ("Chai Latte", "Tea"),
             "matcha": ("Matcha Latte", "Matcha"), "hibiscus": ("Hibiscus Latte", "Hibiscus"), "soda": ("Soda", "Soda")}
FLAVOUR_KINDS = ("flavour", "sweet", "fruit", "spice")


def short(item):
    """'Rose syrup' -> 'Rose', 'Fresh ginger' -> 'Ginger': the word a menu would use."""
    return item["id"].replace("_", " ").title()


def menu_name(ings, temperature):
    """A plain café-menu name for a suggested drink, e.g. 'Iced Cardamom Honey Latte'."""
    base = next((i for i in ings if i["category"] in ("base", "fizz")), None)
    milk = any(i["category"] == "milk" for i in ings)
    word = BASE_WORD.get(base["id"], (base["name"], base["name"]))[0 if milk else 1] if base else "Cooler"
    if base and base["id"] == "hibiscus" and not milk:
        word = "Hibiscus Cooler" if temperature == "cold" else "Hibiscus Tea"
    if base and base["id"] == "black_tea" and not milk:
        word = "Iced Tea" if temperature == "cold" else "Tea"
    flav = [short(i) for i in ings if i["category"] in FLAVOUR_KINDS][:2]
    iced = temperature == "cold" and not any(w in word for w in ("Cold Brew", "Soda", "Cooler", "Iced"))
    return " ".join([*(["Iced"] if iced else []), *flav, word])[:40]


# Drinks a café would actually serve: the shapes ode suggests from, and pairings it avoids.
LATTE_FLAVOURS = [("vanilla",), ("caramel",), ("hazelnut",), ("cardamom",), ("cinnamon",), ("honey",), ("rose",), ("lavender",), ("cocoa",),
                  ("cardamom", "honey"), ("cinnamon", "honey"), ("rose", "cardamom"), ("vanilla", "cinnamon"), ("cocoa", "cinnamon"),
                  ("lavender", "honey"), ("caramel", "cinnamon"), ("hazelnut", "cocoa"), ("rose", "vanilla")]
TEA_HOT = [("ginger", "honey"), ("lemon", "honey"), ("cinnamon", "honey"), ("cardamom",), ("mint", "honey"), ("rose", "honey"),
           ("ginger", "lemon"), ("lavender", "honey"), ("cinnamon", "orange")]
COOLER_FRUIT = ("lemon", "orange", "strawberry", "mango", "lychee")
COOLER_EXTRA = (None, "mint", "rose", "honey", "lavender", "ginger")
COLD_BREW = [("orange",), ("vanilla",), ("caramel",), ("cocoa",), ("cinnamon",), ("honey",), ("vanilla", "milk"), ("caramel", "milk"),
             ("cocoa", "oat_milk"), ("cinnamon", "oat_milk")]


def shapes(temperature):
    out = []
    for base in ("espresso", "matcha", "black_tea"):
        for fl in LATTE_FLAVOURS:
            if base == "matcha" and fl[0] in ("cocoa", "caramel", "hazelnut"):
                continue
            for milk in ("milk", "oat_milk"):
                out.append([base, *fl, milk])
    if temperature == "hot":
        for base in ("black_tea", "hibiscus"):
            out += [[base, *pair] for pair in TEA_HOT]
    else:
        for base in ("soda", "hibiscus", "black_tea"):
            for fruit in COOLER_FRUIT:
                for extra in COOLER_EXTRA:
                    if base == "black_tea" and fruit in ("mango", "strawberry"):
                        continue
                    out.append([base, fruit, *([extra] if extra else [])])
        out += [["cold_brew", *x] for x in COLD_BREW]
    return out


def suggest(cafe, pantry, recipes, out, n=6, seed="s"):
    """New drinks the café could approve, made only from its pantry, filling the gaps first."""
    rng = random.Random(seed)
    by_id = {i["id"]: i for i in pantry}
    have = {(r["temperature"], frozenset(r["ingredients"])) for r in recipes}
    cells = coverage(recipes, pantry, out)
    gaps = sorted(((cells[m][t], rng.random(), m, t) for m in MOODS for t in ("hot", "cold")))
    pools = {}
    for t in ("hot", "cold"):
        ok = {i["id"] for i in allowed(pantry, t, [], out)}
        pool = []
        for ids in shapes(t):
            if t == "cold" and "ice" in ok:
                ids = [*ids, "ice"]
            if all(i in ok for i in ids) and (t, frozenset(ids)) not in have:
                pool.append(ids)
        pools[t] = pool
    found, used_bases = [], {}
    for count, _, m, t in gaps:
        if len(found) >= n:
            break
        lean = set(rules.MOOD_LEAN[m][1])
        best = None
        for ids in pools[t]:
            if (t, frozenset(ids)) in have:
                continue
            fams = {f for i in ids for f in by_id[i]["families"]}
            score = 2 * len(fams & lean) + rng.random() - 1.5 * used_bases.get(ids[0], 0)
            if not best or score > best[0]:
                best = (score, ids)
        if not best or best[0] < 1:
            continue
        ids = best[1]
        have.add((t, frozenset(ids)))
        used_bases[ids[0]] = used_bases.get(ids[0], 0) + 1
        ings = [by_id[i] for i in ids]
        found.append({
            "id": new_id(8), "name": menu_name(ings, t), "ingredients": ids, "temperature": t,
            "moods": list(dict.fromkeys([m, *auto_moods(ids, t, pantry)]))[:3], "status": "suggested", "source": "ode",
            "why": f"No {'hot' if t == 'hot' else 'iced'} drink for {m} guests yet" if count == 0 else f"Another {'hot' if t == 'hot' else 'iced'} choice for {m} guests",
        })
    return found


def view(cafe, r, pantry, out):
    """A recipe as the dashboard shows it: names, cost, price and whether it can be made now."""
    by_id = {i["id"]: i for i in pantry}
    ings = [by_id[i] for i in r["ingredients"] if i in by_id]
    cost = sum(i["cost"] for i in ings)
    price = r.get("price") or price_of(cafe, ings)
    missing = [by_id[i]["name"] for i in r["ingredients"] if i in set(out) and i in by_id]
    return {
        **{k: r[k] for k in ("id", "name", "ingredients", "temperature", "status", "source") if k in r},
        "moods": r.get("moods") or [], "steps": r.get("steps") or [], "why": r.get("why"),
        "price": price, "priceSet": bool(r.get("price")), "cost": cost, "margin": round(price / cost, 1) if cost else None,
        "outOfStock": missing,
        "items": [{k: i[k] for k in ("id", "name", "category", "color")} for i in ings],
    }
