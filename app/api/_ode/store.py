"""
Where creations, orders and stock live. Postgres when DATABASE_URL is set (Neon in
production), otherwise memory, which is enough to run the app locally and for the tests.
"""
import json
import os
import random
import secrets
import threading
import time
from pathlib import Path

ACTIVE_HOURS = 12  # an order not collected after this long drops off the board
NEXT = {"new": "making", "making": "ready", "ready": "collected"}


def new_id(n=10):
    return secrets.token_urlsafe(n)[:n].replace("-", "x").replace("_", "y")


def _pick_code(taken):
    free = [str(c) for c in range(100, 1000) if str(c) not in taken]
    return random.choice(free) if free else str(random.randint(100, 999))


class Memory:
    kind = "memory"

    def __init__(self):
        self.lock = threading.Lock()
        self.creations, self.orders, self.out, self.leads = {}, [], {}, []
        self.users, self.saves = {}, {}
        self.menus, self.seeded, self.modes = {}, set(), {}

    def stock_out(self, cafe):
        return sorted(self.out.get(cafe, set()))

    def set_stock(self, cafe, item, is_out):
        s = self.out.setdefault(cafe, set())
        s.add(item) if is_out else s.discard(item)

    def save_creation(self, c):
        self.creations[c["id"]] = {**c, "_at": time.time()}

    def get_creation(self, cid):
        c = self.creations.get(cid)
        return {k: v for k, v in c.items() if k != "_at"} if c else None

    def rate(self, cid, rating, chips):
        if cid in self.creations:
            self.creations[cid].update(rating=rating, chips=chips)
            return True
        return False

    def crafts_today(self, cafe):
        day = time.time() - 86400
        return sum(1 for c in self.creations.values() if c["cafe"] == cafe and c["_at"] > day)

    def _active(self, cafe):
        cutoff = time.time() - ACTIVE_HOURS * 3600
        return [o for o in self.orders if o["cafe"] == cafe and o["status"] != "collected" and o["placedAt"] / 1000 > cutoff]

    def place(self, cafe, creation_id, size, price, user_id=None):
        with self.lock:
            o = {
                "id": new_id(12), "cafe": cafe, "code": _pick_code({o["code"] for o in self._active(cafe)}),
                "creationId": creation_id, "size": size, "price": price, "status": "new", "placedAt": int(time.time() * 1000),
                "userId": user_id,
            }
            self.orders.insert(0, o)
            return dict(o)

    def get_order(self, oid):
        o = next((o for o in self.orders if o["id"] == oid), None)
        return dict(o) if o else None

    def board(self, cafe):
        return [dict(o) for o in self._active(cafe)]

    def add_lead(self, lead):
        self.leads.append({**lead, "createdAt": int(time.time() * 1000)})

    def list_leads(self):
        return list(reversed(self.leads))

    # accounts
    def create_user(self, email, name, pw_hash):
        with self.lock:
            if any(u["email"] == email for u in self.users.values()):
                return None
            u = {"id": new_id(12), "email": email, "name": name, "pw_hash": pw_hash, "createdAt": int(time.time() * 1000)}
            self.users[u["id"]] = u
            return dict(u)

    def user_by_email(self, email):
        u = next((u for u in self.users.values() if u["email"] == email), None)
        return dict(u) if u else None

    def user_by_id(self, uid):
        u = self.users.get(uid)
        return dict(u) if u else None

    def save_ode(self, uid, cid, on):
        s = self.saves.setdefault(uid, {})
        if on:
            s.setdefault(cid, time.time())
        else:
            s.pop(cid, None)

    def saved(self, uid):
        items = sorted(self.saves.get(uid, {}).items(), key=lambda x: -x[1])
        return [{**self.get_creation(cid), "savedAt": int(at * 1000)} for cid, at in items if cid in self.creations]

    def orders_for(self, uid, limit=30):
        return [dict(o) for o in self.orders if o.get("userId") == uid][:limit]

    def stats(self, cafe):
        now = time.time()
        mine = [o for o in self.orders if o["cafe"] == cafe]
        today = [o for o in mine if o["placedAt"] / 1000 > now - 86400]
        week = [o for o in mine if o["placedAt"] / 1000 > now - 7 * 86400]
        made = [self.creations[o["creationId"]] for o in week if o["creationId"] in self.creations]
        rated = [c for c in self.creations.values() if c["cafe"] == cafe and c.get("rating")][::-1]
        return _summarise(today, week, made, rated)

    # the café's menu
    def recipes(self, cafe):
        return [dict(r) for r in self.menus.get(cafe, [])]

    def add_recipe(self, cafe, r):
        r = {**r, "id": r.get("id") or new_id(8), "createdAt": int(time.time() * 1000)}
        with self.lock:
            self.menus.setdefault(cafe, []).append(r)
        return dict(r)

    def update_recipe(self, cafe, rid, fields):
        with self.lock:
            r = next((r for r in self.menus.get(cafe, []) if r["id"] == rid), None)
            if not r:
                return None
            r.update(fields)
            return dict(r)

    def delete_recipe(self, cafe, rid):
        with self.lock:
            before = len(self.menus.get(cafe, []))
            self.menus[cafe] = [r for r in self.menus.get(cafe, []) if r["id"] != rid]
            return len(self.menus[cafe]) < before

    def menu_seeded(self, cafe):
        return cafe in self.seeded

    def mark_seeded(self, cafe):
        self.seeded.add(cafe)

    def get_mode(self, cafe):
        return self.modes.get(cafe)

    def set_mode(self, cafe, mode):
        self.modes[cafe] = mode

    def advance(self, cafe, oid, status):
        with self.lock:
            o = next((o for o in self.orders if o["id"] == oid and o["cafe"] == cafe), None)
            if not o or NEXT.get(o["status"]) != status:
                return None
            o["status"] = status
            o[status + "At"] = int(time.time() * 1000)
            return dict(o)


class Postgres:
    kind = "postgres"

    def __init__(self, url):
        self.url = url
        with self.conn() as c:
            c.execute((Path(__file__).parent / "schema.sql").read_text())

    def conn(self):
        import psycopg
        from psycopg.rows import dict_row

        # prepare_threshold=None keeps it working through Neon's pooled (pgbouncer) endpoint
        return psycopg.connect(self.url, autocommit=True, row_factory=dict_row, prepare_threshold=None, connect_timeout=8)

    def stock_out(self, cafe):
        with self.conn() as c:
            return [r["item_id"] for r in c.execute("select item_id from stock_out where cafe_id = %s order by item_id", (cafe,))]

    def set_stock(self, cafe, item, is_out):
        with self.conn() as c:
            if is_out:
                c.execute("insert into stock_out (cafe_id, item_id) values (%s, %s) on conflict do nothing", (cafe, item))
            else:
                c.execute("delete from stock_out where cafe_id = %s and item_id = %s", (cafe, item))

    def save_creation(self, cr):
        with self.conn() as c:
            c.execute("insert into creations (id, cafe_id, data) values (%s, %s, %s)", (cr["id"], cr["cafe"], json.dumps(cr)))

    def get_creation(self, cid):
        with self.conn() as c:
            r = c.execute("select data from creations where id = %s", (cid,)).fetchone()
            return r["data"] if r else None

    def rate(self, cid, rating, chips):
        with self.conn() as c:
            return c.execute("update creations set rating = %s, chips = %s where id = %s", (rating, chips, cid)).rowcount > 0

    def crafts_today(self, cafe):
        with self.conn() as c:
            return c.execute("select count(*) n from creations where cafe_id = %s and created_at > now() - interval '1 day'", (cafe,)).fetchone()["n"]

    @staticmethod
    def _order(r):
        ms = lambda t: int(t.timestamp() * 1000) if t else None
        o = {
            "id": r["id"], "cafe": r["cafe_id"], "code": r["code"], "creationId": r["creation_id"], "size": r["size"],
            "price": r["price"], "status": r["status"], "placedAt": ms(r["placed_at"]),
        }
        for s in ("making", "ready", "collected"):
            if r[s + "_at"]:
                o[s + "At"] = ms(r[s + "_at"])
        return o

    ACTIVE = f"cafe_id = %s and status <> 'collected' and placed_at > now() - interval '{ACTIVE_HOURS} hours'"

    def place(self, cafe, creation_id, size, price, user_id=None):
        with self.conn() as c:
            for _ in range(5):
                taken = {r["code"] for r in c.execute(f"select code from orders where {self.ACTIVE}", (cafe,))}
                code = _pick_code(taken)
                r = c.execute(
                    f"insert into orders (id, cafe_id, code, creation_id, size, price, user_id) select %s, %s, %s, %s, %s, %s, %s "
                    f"where not exists (select 1 from orders where {self.ACTIVE} and code = %s) returning *",
                    (new_id(12), cafe, code, creation_id, size, price, user_id, cafe, code),
                ).fetchone()
                if r:
                    return self._order(r)
            raise RuntimeError("could not find a free order code")

    def get_order(self, oid):
        with self.conn() as c:
            r = c.execute("select * from orders where id = %s", (oid,)).fetchone()
            return self._order(r) if r else None

    def board(self, cafe):
        with self.conn() as c:
            return [self._order(r) for r in c.execute(f"select * from orders where {self.ACTIVE} order by placed_at", (cafe,))]

    def add_lead(self, lead):
        with self.conn() as c:
            c.execute(
                "insert into leads (cafe_name, name, city, contact, message) values (%(cafe_name)s, %(name)s, %(city)s, %(contact)s, %(message)s)",
                lead,
            )

    def list_leads(self):
        with self.conn() as c:
            rows = c.execute("select * from leads order by created_at desc limit 200").fetchall()
        return [{"cafe_name": r["cafe_name"], "name": r["name"], "city": r["city"], "contact": r["contact"], "message": r["message"],
                 "createdAt": int(r["created_at"].timestamp() * 1000)} for r in rows]

    @staticmethod
    def _user(r):
        return {"id": r["id"], "email": r["email"], "name": r["name"], "pw_hash": r["pw_hash"], "createdAt": int(r["created_at"].timestamp() * 1000)} if r else None

    def create_user(self, email, name, pw_hash):
        with self.conn() as c:
            r = c.execute("insert into users (id, email, name, pw_hash) values (%s, %s, %s, %s) on conflict (email) do nothing returning *",
                          (new_id(12), email, name, pw_hash)).fetchone()
        return self._user(r)

    def user_by_email(self, email):
        with self.conn() as c:
            return self._user(c.execute("select * from users where email = %s", (email,)).fetchone())

    def user_by_id(self, uid):
        with self.conn() as c:
            return self._user(c.execute("select * from users where id = %s", (uid,)).fetchone())

    def save_ode(self, uid, cid, on):
        with self.conn() as c:
            if on:
                c.execute("insert into saves (user_id, creation_id) values (%s, %s) on conflict do nothing", (uid, cid))
            else:
                c.execute("delete from saves where user_id = %s and creation_id = %s", (uid, cid))

    def saved(self, uid):
        with self.conn() as c:
            rows = c.execute("select c.data, s.saved_at from saves s join creations c on c.id = s.creation_id where s.user_id = %s order by s.saved_at desc", (uid,)).fetchall()
        return [{**r["data"], "savedAt": int(r["saved_at"].timestamp() * 1000)} for r in rows]

    def orders_for(self, uid, limit=30):
        with self.conn() as c:
            return [self._order(r) for r in c.execute("select * from orders where user_id = %s order by placed_at desc limit %s", (uid, limit))]

    def stats(self, cafe):
        with self.conn() as c:
            today = [self._order(r) for r in c.execute("select * from orders where cafe_id = %s and placed_at > now() - interval '1 day'", (cafe,))]
            week = [self._order(r) for r in c.execute("select * from orders where cafe_id = %s and placed_at > now() - interval '7 days'", (cafe,))]
            made = [r["data"] for r in c.execute(
                "select c.data from orders o join creations c on c.id = o.creation_id where o.cafe_id = %s and o.placed_at > now() - interval '7 days'", (cafe,))]
            rated = [{**r["data"], "rating": r["rating"], "chips": r["chips"]} for r in c.execute(
                "select data, rating, chips from creations where cafe_id = %s and rating is not null order by created_at desc limit 200", (cafe,))]
        return _summarise(today, week, made, rated)

    # the café's menu
    @staticmethod
    def _recipe(r):
        return {**r["data"], "id": r["id"], "status": r["status"], "createdAt": int(r["created_at"].timestamp() * 1000)}

    def recipes(self, cafe):
        with self.conn() as c:
            return [self._recipe(r) for r in c.execute("select * from recipes where cafe_id = %s order by created_at, id", (cafe,))]

    def add_recipe(self, cafe, r):
        rid = r.get("id") or new_id(8)
        data = {k: v for k, v in r.items() if k not in ("id", "status", "createdAt")}
        with self.conn() as c:
            row = c.execute("insert into recipes (id, cafe_id, data, status) values (%s, %s, %s, %s) on conflict (cafe_id, id) do update set data = excluded.data returning *",
                            (rid, cafe, json.dumps(data), r.get("status", "approved"))).fetchone()
        return self._recipe(row)

    def update_recipe(self, cafe, rid, fields):
        with self.conn() as c:
            row = c.execute("select * from recipes where cafe_id = %s and id = %s", (cafe, rid)).fetchone()
            if not row:
                return None
            cur = self._recipe(row)
            cur.update(fields)
            data = {k: v for k, v in cur.items() if k not in ("id", "status", "createdAt")}
            row = c.execute("update recipes set data = %s, status = %s, updated_at = now() where cafe_id = %s and id = %s returning *",
                            (json.dumps(data), cur["status"], cafe, rid)).fetchone()
        return self._recipe(row)

    def delete_recipe(self, cafe, rid):
        with self.conn() as c:
            return c.execute("delete from recipes where cafe_id = %s and id = %s", (cafe, rid)).rowcount > 0

    def menu_seeded(self, cafe):
        with self.conn() as c:
            r = c.execute("select seeded from cafe_settings where cafe_id = %s", (cafe,)).fetchone()
            return bool(r and r["seeded"])

    def mark_seeded(self, cafe):
        with self.conn() as c:
            c.execute("insert into cafe_settings (cafe_id, seeded) values (%s, true) on conflict (cafe_id) do update set seeded = true", (cafe,))

    def get_mode(self, cafe):
        with self.conn() as c:
            r = c.execute("select mode from cafe_settings where cafe_id = %s", (cafe,)).fetchone()
            return r["mode"] if r else None

    def set_mode(self, cafe, mode):
        with self.conn() as c:
            c.execute("insert into cafe_settings (cafe_id, mode) values (%s, %s) on conflict (cafe_id) do update set mode = excluded.mode", (cafe, mode))

    def advance(self, cafe, oid, status):
        prev = {v: k for k, v in NEXT.items()}.get(status)
        if not prev:
            return None
        with self.conn() as c:
            r = c.execute(
                f"update orders set status = %s, {status}_at = now() where id = %s and cafe_id = %s and status = %s returning *",
                (status, oid, cafe, prev),
            ).fetchone()
            return self._order(r) if r else None


def _summarise(today, week, made, rated):
    from collections import Counter

    moods = Counter(c["mood"]["primary"] for c in made)
    ings = Counter(i["name"] for c in made for i in c["recipe"]["ingredients"] if i["id"] != "ice")
    temps = Counter(c["recipe"]["temperature"] for c in made)
    return {
        "today": {"orders": len(today), "revenue": sum(o["price"] for o in today)},
        "week": {"orders": len(week), "revenue": sum(o["price"] for o in week)},
        "rating": {"average": round(sum(c["rating"] for c in rated) / len(rated), 2) if rated else None, "count": len(rated)},
        "moods": moods.most_common(6),
        "ingredients": ings.most_common(6),
        "temperatures": dict(temps),
        "recent": [{"name": c["name"], "rating": c["rating"], "chips": c.get("chips") or []} for c in rated[:6]],
    }


_store = None


def store():
    global _store
    if _store is None:
        url = os.environ.get("DATABASE_URL")
        _store = Postgres(url) if url else Memory()
    return _store


def set_store(s):
    global _store
    _store = s
