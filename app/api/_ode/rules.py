"""
The hand-written engine. It runs when no model is configured, and it is the safety net when a
model answer fails the checks twice. Same rules as the app's offline demo, so a drink made
here and a drink made on the device feel like the same café.
"""
import random

from .pantry import allowed

CUES = {
    "mood": {
        "tired": ["tired", "exhausted", "long day", "sleepy", "drained", "monday", "slow"],
        "nostalgic": ["miss", "home", "childhood", "old", "grandmother", "nani", "dadi", "remember", "memory"],
        "energetic": ["energy", "excited", "gym", "busy", "focus", "deadline", "wake"],
        "romantic": ["date", "love", "crush", "romantic", "soft"],
        "cozy": ["rain", "rainy", "cold", "winter", "blanket", "cozy", "cosy", "book"],
        "playful": ["fun", "party", "friends", "summer", "sunny", "weekend", "friday"],
        "stressed": ["stress", "anxious", "exam", "overwhelmed", "work"],
        "calm": ["calm", "quiet", "peace", "sunday", "lazy", "chill"],
    },
    "hot": ["rain", "rainy", "cold", "winter", "warm", "cozy", "cosy", "chai", "night"],
    "cold": ["summer", "hot day", "heat", "sunny", "iced", "refresh", "cool"],
    "flavour": {
        "chocolate": ["chocolate", "cocoa", "mocha"], "citrus": ["lemon", "citrus", "zesty", "orange", "fresh"],
        "floral": ["floral", "rose", "flower", "lavender"], "fruity": ["fruit", "fruity", "berry", "strawberry", "lychee"],
        "spicy": ["spice", "spicy", "ginger", "cinnamon", "chai"], "caramel": ["caramel", "sweet", "dessert"],
        "tropical": ["mango", "tropical", "coconut", "beach"], "earthy": ["earthy", "matcha", "grounding"], "nutty": ["nutty", "hazelnut"],
    },
}

MOOD_LEAN = {
    "calm": ("hot", ["floral", "herbal"]), "nostalgic": ("hot", ["spicy", "caramel"]),
    "energetic": ("cold", ["citrus", "chocolate"]), "tired": ("hot", ["chocolate", "caramel"]),
    "romantic": ("cold", ["floral", "fruity"]), "cozy": ("hot", ["spicy", "chocolate"]),
    "playful": ("cold", ["fruity", "tropical"]), "stressed": ("hot", ["herbal", "floral"]),
}

NAMES = {
    "calm": ["Still Water", "Quiet Hour", "Soft Harbour", "Linen Morning"], "nostalgic": ["Old Letters", "Nani’s Window", "Sepia", "Paper Kites"],
    "energetic": ["Bright Start", "Live Wire", "Gold Rush", "First Light"], "tired": ["Fog Over Monday", "Slow Return", "Heavy Lids", "Soft Landing"],
    "romantic": ["Rose Hour", "Second Glance", "Blush", "Slow Dance"], "cozy": ["Rain on Tin", "Blanket Fort", "Ember", "Wool & Smoke"],
    "playful": ["Golden Hour Spritz", "Sunday Cartwheel", "Fizz & Gossip", "Kite Season"], "stressed": ["Exhale", "Open Window", "Unclench", "Long Breath"],
}
LINES = {
    "calm": [["nothing to fix,", "nowhere to be."], ["the kind of quiet", "you can hear yourself in."]],
    "nostalgic": [["it tastes like a kitchen", "you can’t go back to."], ["light, fleeting,", "exactly like the last good day of july."]],
    "energetic": [["the first good idea", "of the day, in a glass."], ["loud colours,", "clear head."]],
    "tired": [["the kind of warmth that arrives", "before you knew you needed it."], ["for the hour", "when everything is too much."]],
    "romantic": [["sweet at first,", "and then it stays."], ["the pause", "before you say it."]],
    "cozy": [["rain on the window,", "nowhere you’d rather be."], ["bitter at the edges,", "soft in the middle, like most good things."]],
    "playful": [["bubbles, gossip,", "the sun still up."], ["a little reckless,", "entirely worth it."]],
    "stressed": [["put it down for a minute.", "it will still be there."], ["one sip,", "and the room gets bigger."]],
}


def _hits(text, words):
    return any(w in text for w in words)


def read_mood(inp):
    t = (inp.get("text") or "").lower()
    found = [m for m, w in CUES["mood"].items() if _hits(t, w)]
    moods = list(dict.fromkeys([*inp.get("moods", []), *found]))
    primary = moods[0] if moods else "calm"
    temperature = inp.get("temp") or ("hot" if _hits(t, CUES["hot"]) else "cold" if _hits(t, CUES["cold"]) else MOOD_LEAN[primary][0])
    from_text = [f for f, w in CUES["flavour"].items() if _hits(t, w)]
    asked = list(dict.fromkeys([*inp.get("flavours", []), *from_text]))
    families = list(dict.fromkeys([*asked, *MOOD_LEAN[primary][1]]))[:3]
    return {
        "primary": primary, "secondary": moods[1] if len(moods) > 1 else None, "temperature": temperature,
        "sweetness": inp.get("sweetness", 5), "families": families, "asked": asked, "diet": inp.get("diet", []),
    }


def build_recipe(cafe, pantry, mood, out, seed):
    r = random.Random(seed)
    ok = allowed(pantry, mood["temperature"], mood["diet"], out)
    jitter = {i["id"]: r.random() * 0.6 for i in ok}
    score = lambda i: sum(f in mood["families"] for f in i["families"]) + jitter[i["id"]]
    best = lambda cats: sorted((i for i in ok if i["category"] in cats), key=score, reverse=True)
    first = lambda cats: next(iter(best(cats)), None)
    by_id = {i["id"]: i for i in ok}

    parts = []
    fizz_first = mood["temperature"] == "cold" and any(f in ("citrus", "fruity", "tropical", "floral") for f in mood["families"]) and r.random() > 0.3
    base = (first(["fizz"]) or first(["base"])) if fizz_first else first(["base"])
    if base:
        parts.append(base)
    # every flavour the customer named gets at least one ingredient
    for fam in mood["asked"]:
        if len(parts) >= 4:
            break
        hit = next((i for i in best(["fruit", "flavour", "spice", "sweet"]) if fam in i["families"] and i not in parts), None)
        if hit:
            parts.append(hit)
    for i in best(["fruit", "flavour", "spice"]):
        if len(parts) >= 3:
            break
        if score(i) >= 1 and i not in parts:
            parts.append(i)
    if base and base["id"] in ("espresso", "matcha", "black_tea") and not fizz_first:
        milk = first(["milk"])
        if milk:
            parts.append(milk)
    if mood["sweetness"] >= 6 and len(parts) < cafe["maxIngredients"] and not any(p["category"] == "sweet" for p in parts):
        s = first(["sweet"])
        if s:
            parts.append(s)
    if len(parts) < cafe["maxIngredients"]:
        # ice for cold drinks; mint only where it belongs (fresh, herbal or citrus drinks)
        if mood["temperature"] == "cold" and "ice" in by_id:
            parts.append(by_id["ice"])
        elif any(f in ("herbal", "citrus") for f in mood["families"]) and "mint" in by_id:
            parts.append(by_id["mint"])
    seen, ingredients = set(), []
    for p in parts:
        if p["id"] not in seen:
            seen.add(p["id"])
            ingredients.append(p)
    return ingredients[: cafe["maxIngredients"]]


def steps_for(ingredients, method, temp):
    names = lambda cats: [i["name"].lower() for i in ingredients if i["category"] in cats]
    s = []
    muddle = names(["fruit", "spice"])
    if method == "muddle" and muddle:
        s.append(f"Muddle {' and '.join(muddle)} in the glass.")
    base = next((i for i in ingredients if i["category"] in ("base", "fizz")), None)
    if base:
        s.append(f"Brew the {base['name'].lower()} ({base['unit']})." if temp == "hot" else f"Prepare {base['unit']} of {base['name'].lower()}, chilled.")
    flav = names(["flavour", "sweet"])
    if flav:
        s.append(f"Stir in {' and '.join(flav)}.")
    if method != "muddle" and muddle:
        s.append(f"Add {' and '.join(muddle)}.")
    milk = names(["milk"])
    if milk:
        s.append(f"Steam the {milk[0]} and pour slowly over the top." if temp == "hot" else f"Pour the {milk[0]} over ice.")
    ids = {i["id"] for i in ingredients}
    if "ice" in ids and not milk:
        s.append("Fill with ice and give it one slow stir.")
    if "mint" in ids:
        s.append("Finish with mint, lightly clapped.")
    return s


def write_ode(mood, seed):
    r = random.Random(seed + "ode")
    return {"name": r.choice(NAMES.get(mood["primary"], NAMES["calm"])), "lines": r.choice(LINES.get(mood["primary"], LINES["calm"]))}
