# ode.

*the menu is you.*

A mood menu for cafés. A customer scans a QR code, says how they feel, and gets a drink written only for them: a name, two lines, its own artwork and a price, built from that café's ingredients. The order lands on the barista's board; the customer pays at the counter as usual.

## What's here

| Folder | What it is |
| --- | --- |
| `app/` | The web app (React + Vite): customer flow, share cards, saved odes, barista board |
| `app/api/` | The API (FastAPI): writes each ode, takes orders, runs the board and the pantry |
| `design/` | Brand boards and the brand's generators: the quotation-drop mark, flavour portraits, painted ingredients |

### Website
- **`/`**: the live hero (type a feeling and a drink is written on the spot, the 3D cup changes with it), why cafés choose ode, the shelf
- **`/how-it-works`**: six steps beside a live phone running the real menu, and how ode keeps the rules strict
- **`/for-cafes`**: a live order board, a pantry you can switch out of stock, a price calculator and a table card designer with a working QR code
- **`/wall`**: a Pinterest-style wall of odes, filterable by mood, each opening into its ingredients and price
- **`/pricing`**: the free pilot and the monthly plan
- **`/get-ode`**: the pilot request form (saved to the `leads` table)

### Customer (`/c/demo`)
- **Tell us how you feel**: free text or an example, then optional mood, temperature, sweetness and flavours
- **Anything we must avoid**: dietary needs and allergies, enforced as hard rules and shown to the barista in red
- **Your ode**: name, two lines, a generated portrait, mood match, painted ingredients, size and price
- **Order**: an order code with live status, then a rating
- **Share**: a 9:16 story or square post image with the café's name and handle
- **My odes**: everything saved

### Café
- **Barista board** (`/barista`): new → making → ready, ingredients with amounts, method and steps, a chime for new orders
- **Pantry**: switch ingredients out of stock; new drinks stop using them immediately

## How an ode is written

Three stages, each one checked before anyone sees it:

1. **Read the mood.** The model reads what the customer wrote. Their own taps (mood, temperature, flavours) always win over its reading.
2. **Build the recipe.** Code first narrows the pantry to what this café has in stock, at this temperature, and what is safe for this person. The model can only choose from that list. Code then checks the drink: one base, at most one milk, no milk with sparkling water, every flavour they asked for included, steps that mention only what is in the cup and no amounts.
3. **Write the lines.** A name and two lines, checked for length and voice: lowercase, no dashes, emoji or cliches. Words that moderation flags are never echoed back.

A rejected answer goes back once with the reasons. If it fails again, or the model is slow or missing, that stage falls back to the rules engine. The customer always gets a drink. Portions come from the café's pantry and the price from its costs and margin, never from the model, and the customer's phone sees ingredient names only.

## Run it

```bash
cd app
npm install
npm run dev
```

Open `/` for the website, `/c/demo` for the customer menu (what a table QR code opens) and `/barista` in another tab. Without the API, everything runs on the device (drinks from the rules engine, orders shared between tabs).

With the API:

```bash
cd app
pip install -r requirements.txt uvicorn
cd api && uvicorn index:app --port 8000          # memory store, no model: rules engine
ODE_API=http://localhost:8000 npm run dev         # in app/, in another terminal
```

Tests (18, all paths of the pipeline with a scripted model; set `TEST_DATABASE_URL` to run them on Postgres):

```bash
cd app && pip install pytest httpx && pytest tests
```

## Deploy (Vercel)

One project, root directory `app`. Vercel builds the app and serves `api/index.py` as a Python function at `/api`.

Environment variables, set in Vercel only:

| Name | What it does |
| --- | --- |
| `OPENAI_API_KEY` | Turns the model on. Without it every drink comes from the rules engine |
| `DATABASE_URL` | Postgres connection string (Neon, pooled). Tables are created on first run |
| `ODE_STAFF_KEY` | The café key the barista types once on the board's screen |
| `ODE_MODEL` | Optional, defaults to `gpt-4o-mini` |
| `ODE_DAILY_MODEL_LIMIT` | Optional, odes per café per day written by the model (default 400); after that, the rules engine |

## Status

The customer flow, the barista board, the pantry and the API are in. Next: accounts (Google and email), the owner dashboard (setup, pricing, insights, QR table cards) and the café wall.
