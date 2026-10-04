# ode.

*the menu is you.*

A mood menu for cafés. A customer scans a QR code, says how they feel, and gets a drink written only for them: a name, two lines, its own artwork and a price, built from that café's ingredients. The order lands on the barista's board; the customer pays at the counter as usual.

## What's here

| Folder | What it is |
| --- | --- |
| `app/` | The web app (React + Vite): customer flow, share cards, saved odes, barista board |
| `design/` | Brand boards and the brand's generators: the quotation-drop mark, flavour portraits, painted ingredients |

### Customer
- **Tell us how you feel**: free text or an example, then optional mood, temperature, sweetness and flavours
- **Anything we must avoid**: dietary needs and allergies, enforced as hard rules and shown to the barista in red
- **Your ode**: name, two lines, a generated portrait, mood match, painted ingredients, size and price
- **Order**: an order code with live status, then a rating
- **Share**: a 9:16 story or square post image with the café's name and handle
- **My odes**: everything saved

### Café
- **Barista board** (`/barista`): new → making → ready, ingredients with amounts, method and steps, a chime for new orders
- **Pantry**: switch ingredients out of stock; new drinks stop using them immediately

## Run it

```bash
cd app
npm install
npm run dev
```

Open `/` on a phone-sized window and `/barista` in another tab.

## Status

Demo mode: drinks are written by a rule-based stand-in for the AI pipeline (`app/src/lib/craft.js`) that follows the same three stages, and data is kept on the device. Next: the API (FastAPI, PostgreSQL, OpenAI), accounts, the owner dashboard and the café wall.
