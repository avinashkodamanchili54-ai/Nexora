"""
User store: Supabase PostgreSQL database.
Direct connection via psycopg2 connection pool with fallback to Supabase REST client.
"""
import json
import time
import uuid
from typing import Optional
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor
from supabase import create_client, Client

from app.config import SUPABASE_DB_URL, SUPABASE_URL, SUPABASE_KEY

_pool: Optional[ThreadedConnectionPool] = None
_supabase_client: Optional[Client] = None


def _get_pool() -> ThreadedConnectionPool:
    global _pool
    if _pool is None or _pool.closed:
        _pool = ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=SUPABASE_DB_URL,
            connect_timeout=6,
        )
    return _pool


def _get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client


def _format_row(row: dict) -> dict:
    if not row:
        return {}
    item = dict(row)
    if isinstance(item.get("farm_profile"), str):
        try:
            item["farm_profile"] = json.loads(item["farm_profile"])
        except Exception:
            item["farm_profile"] = {}
    elif item.get("farm_profile") is None:
        item["farm_profile"] = {}
    return item


def get_user(phone: str) -> Optional[dict]:
    phone = phone.strip()
    try:
        pool = _get_pool()
        conn = pool.getconn()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT phone, user_id, name, password_hash, preferred_language, crop_type, crop_mode, farm_profile, created_at FROM public.users WHERE phone = %s LIMIT 1;",
                    (phone,),
                )
                row = cur.fetchone()
                if row:
                    return _format_row(dict(row))
        finally:
            pool.putconn(conn)
    except Exception:
        # Fallback to Supabase client
        try:
            client = _get_supabase_client()
            res = client.table("users").select("*").eq("phone", phone).limit(1).execute()
            if res.data and len(res.data) > 0:
                return _format_row(res.data[0])
        except Exception:
            pass
    return None


def create_user(
    phone: str,
    name: str,
    password_hash: str,
    preferred_language: str,
    crop_type: str,
    crop_mode: str,
) -> dict:
    user = {
        "phone": phone.strip(),
        "user_id": str(uuid.uuid4()),
        "name": name.strip(),
        "password_hash": password_hash,
        "preferred_language": preferred_language,
        "crop_type": crop_type,
        "crop_mode": crop_mode,
        "farm_profile": {},
        "created_at": int(time.time()),
    }

    try:
        pool = _get_pool()
        conn = pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO public.users (phone, user_id, name, password_hash, preferred_language, crop_type, crop_mode, farm_profile, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        user["phone"],
                        user["user_id"],
                        user["name"],
                        user["password_hash"],
                        user["preferred_language"],
                        user["crop_type"],
                        user["crop_mode"],
                        json.dumps(user["farm_profile"]),
                        user["created_at"],
                    ),
                )
            conn.commit()
            return user
        finally:
            pool.putconn(conn)
    except Exception:
        # Fallback to Supabase client
        client = _get_supabase_client()
        client.table("users").insert(user).execute()
        return user


def update_user(phone: str, updates: dict) -> Optional[dict]:
    phone = phone.strip()
    if not updates:
        return get_user(phone)

    allowed_keys = {
        "name",
        "preferred_language",
        "crop_type",
        "crop_mode",
        "farm_profile",
    }
    filtered = {k: v for k, v in updates.items() if k in allowed_keys}
    if not filtered:
        return get_user(phone)

    try:
        pool = _get_pool()
        conn = pool.getconn()
        try:
            set_clauses = []
            values = []
            for k, v in filtered.items():
                set_clauses.append(f"{k} = %s")
                if k == "farm_profile" and isinstance(v, dict):
                    values.append(json.dumps(v))
                else:
                    values.append(v)
            values.append(phone)

            sql = f"UPDATE public.users SET {', '.join(set_clauses)} WHERE phone = %s RETURNING phone, user_id, name, password_hash, preferred_language, crop_type, crop_mode, farm_profile, created_at;"
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, tuple(values))
                row = cur.fetchone()
            conn.commit()
            if row:
                return _format_row(dict(row))
        finally:
            pool.putconn(conn)
    except Exception:
        try:
            client = _get_supabase_client()
            res = client.table("users").update(filtered).eq("phone", phone).execute()
            if res.data and len(res.data) > 0:
                return _format_row(res.data[0])
        except Exception:
            pass

    return get_user(phone)


def phone_exists(phone: str) -> bool:
    return get_user(phone) is not None
