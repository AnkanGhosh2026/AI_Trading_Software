"""Auth + admin: SQLite users, PBKDF2 password hashes, JWT sessions."""
import os, sqlite3, hashlib, hmac, time, jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from pydantic import BaseModel

DB = os.getenv("DB_PATH", "app.db")
SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
router = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)

def db():
    c = sqlite3.connect(DB); c.row_factory = sqlite3.Row; return c

def _hash(pw, salt): return hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, 200_000).hex()

def _create(c, username, pw, role="user"):
    salt = os.urandom(16)
    c.execute("insert into users(username,salt,hash,role) values(?,?,?,?)", (username, salt, _hash(pw, salt), role))

def init():
    with db() as c:
        c.execute("create table if not exists users(id integer primary key autoincrement, username text unique, salt blob, hash text, role text default 'user', created text default current_timestamp)")
        if not c.execute("select 1 from users where role='admin'").fetchone():
            u, p = os.getenv("ADMIN_USER", "admin"), os.getenv("ADMIN_PASSWORD", "admin12345")
            _create(c, u, p, "admin"); print(f"[auth] Seeded admin '{u}'. Change ADMIN_PASSWORD and JWT_SECRET before deploying.")

def current_user(cred=Depends(bearer)):
    if not cred: raise HTTPException(401, "Not signed in")
    try: uid = int(jwt.decode(cred.credentials, SECRET, algorithms=["HS256"])["sub"])
    except Exception: raise HTTPException(401, "Session expired")
    with db() as c: u = c.execute("select * from users where id=?", (uid,)).fetchone()
    if not u: raise HTTPException(401, "This account no longer exists")
    return dict(u)

def admin_only(u=Depends(current_user)):
    if u["role"] != "admin": raise HTTPException(403, "Admin access required")
    return u

class Cred(BaseModel): username: str; password: str

def _session(u):
    return {"token": jwt.encode({"sub": str(u["id"]), "exp": int(time.time()) + 86400}, SECRET, algorithm="HS256"),
            "user": {"id": u["id"], "username": u["username"], "role": u["role"]}}

@router.post("/auth/register")
def register(b: Cred):
    name = b.username.strip().lower()
    if len(name) < 3 or len(b.password) < 8: raise HTTPException(400, "Username needs 3+ characters and password 8+ characters")
    try:
        with db() as c: _create(c, name, b.password)
    except sqlite3.IntegrityError: raise HTTPException(409, "That username is taken")
    with db() as c: return _session(c.execute("select * from users where username=?", (name,)).fetchone())

@router.post("/auth/login")
def login(b: Cred):
    with db() as c: u = c.execute("select * from users where username=?", (b.username.strip().lower(),)).fetchone()
    if not u or not hmac.compare_digest(_hash(b.password, u["salt"]), u["hash"]): raise HTTPException(401, "Wrong username or password")
    return _session(dict(u))

@router.get("/auth/me")
def me(u=Depends(current_user)): return {"id": u["id"], "username": u["username"], "role": u["role"]}

@router.get("/admin/users")
def users(_=Depends(admin_only)):
    with db() as c: return [dict(r) for r in c.execute("select id,username,role,created from users order by id")]

@router.delete("/admin/users/{uid}")
def delete_user(uid: int, me=Depends(admin_only)):
    if uid == me["id"]: raise HTTPException(400, "You can't delete your own account")
    with db() as c:
        if c.execute("delete from users where id=?", (uid,)).rowcount == 0: raise HTTPException(404, "User not found")
    return {"deleted": uid}
