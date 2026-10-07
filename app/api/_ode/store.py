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

    def place(self, cafe, creation_id, size, price):
        with self.lock:
            o = {
                "id": new_id(12), "cafe": cafe, "code": _pick_code({o["code"] for o in self._active(cafe)}),
                "creationId": creation_id, "size": size, "price": price, "status": "new", "placedAt": int(time.time() * 1000),
            }
            self.orders.insert(0, o)
            return dict(o)

    def get_order(self, oid):
        o = next((o for o in self.orders if o["id"] == oid), None)
        return dict(o) if o else None

    def board(self, cafe):
        return [dict(o) for o in self._active(cafe)]

    def add_lead(self, lead):
        self.leads.append({**lead, "at": time.time()})

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

    def place(self, cafe, creation_id, size, price):
        with self.conn() as c:
            for _ in range(5):
                taken = {r["code"] for r in c.execute(f"select code from orders where {self.ACTIVE}", (cafe,))}
                code = _pick_code(taken)
                r = c.execute(
                    f"insert into orders (id, cafe_id, code, creation_id, size, price) select %s, %s, %s, %s, %s, %s "
                    f"where not exists (select 1 from orders where {self.ACTIVE} and code = %s) returning *",
                    (new_id(12), cafe, code, creation_id, size, price, cafe, code),
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
