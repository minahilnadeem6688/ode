"""
Accounts and sessions.

Two kinds of people sign in, and they never share a door:
  customers   email and password; they keep their odes and order history
  café team   the café key (ODE_STAFF_KEY); they run the board, the pantry and the dashboard

Passwords are stored as scrypt hashes, never as text. A session is a small signed token
(HMAC-SHA256) that says who you are and when it expires; nothing secret is inside it.

Environment:
  ODE_SECRET      signs sessions. If unset, a secret is derived from ODE_STAFF_KEY, so set
                  ODE_SECRET to a long random value to keep customer sessions independent of it
  ODE_STAFF_KEY   the café key the team signs in with
  ODE_ADMIN_KEY   optional; signs in as the ode owner (sees pilot requests). Defaults to the café key
"""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time

CUSTOMER_DAYS = 30
STAFF_HOURS = 12
EMAIL = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,190}\.[a-z]{2,24}$", re.I)

_fallback = secrets.token_bytes(32)  # local runs without any keys


def _secret():
    s = os.environ.get("ODE_SECRET") or os.environ.get("ODE_STAFF_KEY")
    return hashlib.sha256(b"ode-session|" + s.encode()).digest() if s else _fallback


def _b64(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _unb64(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def hash_password(pw):
    salt = secrets.token_bytes(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt${_b64(salt)}${_b64(h)}"


def check_password(pw, stored):
    try:
        _, salt, h = stored.split("$")
        got = hashlib.scrypt(pw.encode(), salt=_unb64(salt), n=2**14, r=8, p=1, dklen=32)
        return hmac.compare_digest(got, _unb64(h))
    except (ValueError, TypeError):
        return False


def make_token(claims, seconds):
    body = _b64(json.dumps({**claims, "exp": int(time.time()) + seconds}, separators=(",", ":")).encode())
    sig = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"


def read_token(token):
    try:
        body, sig = token.split(".")
        want = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, want):
            return None
        claims = json.loads(_unb64(body))
        return claims if claims.get("exp", 0) > time.time() else None
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def customer_token(user_id):
    return make_token({"role": "customer", "sub": user_id}, CUSTOMER_DAYS * 86400)


def staff_token(cafe, admin):
    return make_token({"role": "staff", "cafe": cafe, "admin": bool(admin)}, STAFF_HOURS * 3600)


def key_matches(given, env_name):
    want = os.environ.get(env_name)
    return bool(want and given) and hmac.compare_digest(given.encode(), want.encode())


def bearer(header):
    if header and header.lower().startswith("bearer "):
        return read_token(header[7:].strip())
    return None


def clean_email(e):
    return (e or "").strip().lower()
