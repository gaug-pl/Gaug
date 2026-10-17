"use strict";
// Gaug site server. No dependencies (Node 18+). Run from anywhere: node server/server.js
// Packages are uploaded as .zip, checked, stored as inert text in a review queue, and only
// published after the admin "Green" approves them. Nothing from a package is ever executed here.
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto"), zlib = require("zlib"), net = require("net");
const { Pool } = require("pg");

const FRONTEND_ORIGIN = "https://gaug-pl.github.io";

const ROOT = path.resolve(__dirname, ".."), DATA = path.join(__dirname, "data");
const PORT = +process.env.PORT || 3000, HOST = process.env.HOST || "127.0.0.1";
const SECURE = process.env.SECURE_COOKIES === "1";          // set when served over HTTPS
const REGISTRATION = process.env.REGISTRATION !== "off";
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const SID = SECURE ? "__Host-sid" : "sid";
fs.mkdirSync(DATA, { recursive: true, mode: 0o700 });
try { fs.chmodSync(DATA, 0o700); } catch {}
const DB_FILE = path.join(DATA, "db.json"), ADMIN_FILE = path.join(DATA, "admin.json");


/* ---------- storage: Neon PostgreSQL ---------- */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

let db = {
  users: {},
  packages: {},
  pending: {},
  profiles: {},
  bans: {},
};

let saveQueue = Promise.resolve();

async function initializeStorage() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gaug_storage (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const existing = await pool.query(
    "SELECT data FROM gaug_storage WHERE id = 1"
  );

  if (existing.rows.length === 0) {
    // Import an existing local database if available.
    // Never overwrite an existing Neon row.
    let initial = null;

    try {
      initial = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    } catch (e) {
      if (e.code !== "ENOENT" && !(e instanceof SyntaxError)) {
        throw e;
      }
    }

    const initialDb = initial && typeof initial === "object"
      && !Array.isArray(initial)
      ? initial
      : {};

    initialDb.users ||= {};
    initialDb.packages ||= {};
    initialDb.pending ||= {};
    initialDb.profiles ||= {};
    initialDb.bans ||= {};

    await pool.query(
      `INSERT INTO gaug_storage (id, data)
       VALUES (1, $1::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [JSON.stringify(initialDb)]
    );
  }

  const result = await pool.query(
    "SELECT data FROM gaug_storage WHERE id = 1"
  );

  if (result.rows.length !== 1 ||
      !result.rows[0].data ||
      typeof result.rows[0].data !== "object" ||
      Array.isArray(result.rows[0].data)) {
    throw new Error("Invalid Gaug database data");
  }

  db = result.rows[0].data;
  db.users ||= {};
  db.packages ||= {};
  db.pending ||= {};
  db.profiles ||= {};
  db.bans ||= {};
}

function save() {
  // Serialize full-database writes to avoid overlapping saves
  // overwriting each other's snapshots.
  saveQueue = saveQueue.then(async () => {
    const snapshot = JSON.stringify(db);

    await pool.query(
      `INSERT INTO gaug_storage (id, data, updated_at)
       VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE
       SET data = EXCLUDED.data,
           updated_at = NOW()`,
      [snapshot]
    );
  });

  return saveQueue;
}


function readAdmin() {
  // Use persistent Render environment variables first.
  const hash = process.env.ADMIN_HASH;
  const salt = process.env.ADMIN_SALT;

  if (hash && salt) {
    return { hash, salt };
  }

  // Fall back to the local file during development.
  try {
    const admin = JSON.parse(
      fs.readFileSync(ADMIN_FILE, "utf8")
    );

    return admin.hash && admin.salt ? admin : null;
  } catch {
    return null;
  }
}


function own(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
    ? obj[key]
    : undefined;
}


/* ---------- crypto ---------- */
const sha = s => crypto.createHash("sha256").update(s).digest("hex");
const hashPw = (pw, saltHex) => new Promise((ok, no) =>
  crypto.scrypt(pw, Buffer.from(saltHex, "hex"), 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => e ? no(e) : ok(k)));
const DUMMY_SALT = crypto.randomBytes(16).toString("hex");   // keeps timing equal for unknown users

/* ---------- rules ---------- */
const RESERVED = ["green", "admin", "administrator", "root", "system", "moderator", "staff", "owner", "gaug"];
const isReserved = n => RESERVED.includes(n.toLowerCase().replace(/_/g, ""));
const USER_RE = /^[A-Za-z0-9_]{3,20}$/, PKG_RE = /^[a-z0-9][a-z0-9_-]{1,31}$/, VER_RE = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/;
const LICENSES = ["MIT", "Apache-2.0", "BSD-3-Clause", "ISC", "GPL-3.0", "Unlicense"];
const cmpVer = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };

/* ---------- package upload limits ---------- */
const ZIP_MAX = 1024 * 1024, FILE_MAX = 200 * 1024, TOTAL_MAX = 1024 * 1024, ENTRY_MAX = 60;
const EXT_OK = new Set([".gaug", ".md", ".txt", ".json"]);           // text only: no binaries, ever
const NAME_OK = /^[A-Za-z0-9_-][A-Za-z0-9_.-]*(\/[A-Za-z0-9_-][A-Za-z0-9_.-]*){0,3}$/;   // no "..", no hidden files, max depth 4
const MAX_PENDING_PER_USER = 5;

// Lines that deserve a closer look during review. Edit these to match the Gaug modules that can
// touch files, the network, the OS or the environment. They only highlight; they never decide.
const SUSPICIOUS = [
  [/\b(exec|system|spawn|shell|popen|process)\b/i, "runs programs"],
  [/\b(http|https|socket|fetch|download|upload|url|net)\b/i, "network access"],
  [/\b(write|delete|remove|unlink|rmdir|rename|chmod|fs|file|io)\b/i, "file access"],
  [/\b(env|getenv|environ|home|passwd|token|secret|password|key)\b/i, "environment / secrets"],
  [/\b(eval|load|import|require|base64|decode|obfuscat\w*)\b/i, "dynamic code / encoding"],
  [/[A-Za-z0-9+\/=]{120,}/, "long encoded blob"],
];
function scan(files) {
  const flags = [];
  for (const [file, text] of Object.entries(files)) {
    text.split("\n").forEach((line, i) => {
      for (const [re, why] of SUSPICIOUS) if (re.test(line) && flags.length < 300) { flags.push({ file, line: i + 1, why }); break; }
    });
  }
  return flags;
}

/* ---------- zip reader (no extraction to disk, no execution) ---------- */
function readZip(buf) {
  const bad = m => { throw new Error(m); };
  if (buf.length < 22 || buf.length > ZIP_MAX) bad("Zip must be under 1 MB");
  let e = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) if (buf.readUInt32LE(i) === 0x06054b50) { e = i; break; }
  if (e < 0) bad("That is not a valid zip file");
  const total = buf.readUInt16LE(e + 10), cdSize = buf.readUInt32LE(e + 12), cdOff = buf.readUInt32LE(e + 16);
  if (total === 0xFFFF || cdOff === 0xFFFFFFFF) bad("Zip64 archives are not supported");
  if (total > ENTRY_MAX + 40) bad("Too many entries");
  if (cdOff + cdSize > e) bad("Corrupt zip");

  // pass 1: read the directory only
  const entries = []; let p = cdOff, sum = 0;
  for (let n = 0; n < total; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) bad("Corrupt zip");
    const flags = buf.readUInt16LE(p + 8), method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24),
      nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), attr = buf.readUInt32LE(p + 38), lo = buf.readUInt32LE(p + 42);
    if (p + 46 + nl > buf.length) bad("Corrupt zip");
    const name = buf.toString("utf8", p + 46, p + 46 + nl);
    p += 46 + nl + xl + cl;
    if (name.endsWith("/") || name.startsWith("__MACOSX/") || name.split("/").pop() === ".DS_Store") continue;
    if (flags & 1) bad("Encrypted zips are not allowed");
    if (((attr >>> 16) & 0xF000) === 0xA000) bad("Symbolic links are not allowed");
    if (method !== 0 && method !== 8) bad("Unsupported compression method");
    if (usize > FILE_MAX) bad(`"${name}" is larger than 200 KB`);
    if ((sum += usize) > TOTAL_MAX) bad("Package is larger than 1 MB when unpacked");
    entries.push({ name, method, csize, usize, lo });
  }
  if (!entries.length) bad("The zip is empty");
  if (entries.length > ENTRY_MAX) bad(`Too many files (max ${ENTRY_MAX})`);

  // a single wrapping folder (zip made from "my-package/") is stripped
  const first = entries[0].name.split("/")[0];
  if (entries.every(x => x.name.includes("/") && x.name.split("/")[0] === first)) entries.forEach(x => x.name = x.name.slice(first.length + 1));

  // pass 2: validate names, then unpack
  const out = {}, dec = new TextDecoder("utf-8", { fatal: true });
  for (const x of entries) {
    const base = x.name.split("/").pop(), ext = path.extname(base).toLowerCase();
    if (x.name.length > 100 || !NAME_OK.test(x.name)) bad(`Bad file name: "${x.name.slice(0, 60)}" (letters, numbers, _ - . and / only, no hidden files)`);
    if (!EXT_OK.has(ext) && !["LICENSE", "README"].includes(base)) bad(`"${x.name}": only .gaug, .md, .txt and .json files are allowed`);
    if (Object.prototype.hasOwnProperty.call(out, x.name)) bad(`Duplicate file "${x.name}"`);
    if (x.lo + 30 > buf.length || buf.readUInt32LE(x.lo) !== 0x04034b50) bad("Corrupt zip");
    const start = x.lo + 30 + buf.readUInt16LE(x.lo + 26) + buf.readUInt16LE(x.lo + 28);
    if (start + x.csize > buf.length) bad("Corrupt zip");
    let data;
    try { const raw = buf.subarray(start, start + x.csize); data = x.method === 0 ? raw : zlib.inflateRawSync(raw, { maxOutputLength: FILE_MAX + 1 }); }
    catch { bad(`Could not unpack "${x.name}"`); }
    if (data.length !== x.usize) bad(`"${x.name}" is corrupt`);
    let text; try { text = dec.decode(data); } catch { bad(`"${x.name}" is not valid UTF-8 text`); }
    if (text.includes("\0")) bad(`"${x.name}" looks like a binary file`);
    out[x.name] = text.replace(/\r\n/g, "\n");
  }
  if (!Object.keys(out).some(n => n.endsWith(".gaug"))) bad("The package needs at least one .gaug file");
  return out;
}

/* ---------- rate limiting (memory only, nothing is written to disk) ---------- */
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(); let h = hits.get(key);
  if (!h || h.until < now) h = { n: 0, until: now + windowMs };
  hits.set(key, h);
  return h.n >= max;
}
const bump = key => { const h = hits.get(key); if (h) h.n++; };
const clearKey = key => hits.delete(key);

/* ---------- sessions ---------- */
const sessions = new Map();

function newSession(res, ln, name, role) {
  const tok = crypto.randomBytes(32).toString("hex");
  const ttl = role === "admin" ? 2 * 3600e3 : 7 * 24 * 3600e3;
  sessions.set(sha(tok), { ln, name, role, exp: Date.now() + ttl });

  return `${SID}=${tok}; HttpOnly; SameSite=None; Path=/; Max-Age=${ttl / 1000}; Secure`;
}

function getSession(req) {
  const c = (req.headers.cookie || "").split(/;\s*/).find(x => x.startsWith(SID + "="));
  if (!c) return null;
  const k = sha(c.slice(SID.length + 1)), s = sessions.get(k);
  if (!s || s.exp < Date.now() || (db.users[s.ln] && db.users[s.ln].banned)) { sessions.delete(k); return null; }
  return { ...s, k };
}
setInterval(() => {
  const now = Date.now();
  for (const [k, s] of sessions) if (s.exp < now) sessions.delete(k);
  for (const [k, h] of hits) if (h.until < now) hits.delete(k);
}, 60e3).unref();

/* ---------- http helpers ---------- */
const BASE = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY", "Cross-Origin-Opener-Policy": "same-origin" };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
function send(res, code, obj, extra = {}) {
  const isStr = typeof obj === "string";
  res.writeHead(code, { "Content-Type": isStr ? "text/plain; charset=utf-8" : "application/json", "Cache-Control": "no-store", "Content-Security-Policy": CSP, ...BASE, ...extra });
  res.end(isStr ? obj : JSON.stringify(obj));
}
const fail = (res, code, msg) => send(res, code, { error: msg });
const normIp = a => String(a || "").trim().replace(/^::ffff:/i, "");
function ip(req) {
  if (TRUST_PROXY) { const f = (req.headers["x-forwarded-for"] || "").split(",").pop().trim(); if (f) return normIp(f); }
  return normIp(req.socket.remoteAddress) || "?";
}
function readJson(req, limit = 65536) {
  return new Promise((ok, no) => {
    let n = 0; const c = [];
    req.on("data", d => { n += d.length; if (n > limit) { no(new Error("Request too large")); req.destroy(); } else c.push(d); });
    req.on("end", () => { try { const v = JSON.parse(Buffer.concat(c).toString() || "{}"); ok(v && typeof v === "object" && !Array.isArray(v) ? v : {}); } catch { no(new Error("Bad JSON")); } });
    req.on("error", no);
  });
}
function sameOrigin(req) {
    const origin = req.headers.origin;

    if (origin) {
        try {
            const host = new URL(origin).host;

            return (
                host === req.headers.host ||
                origin === FRONTEND_ORIGIN
            );
        } catch {
            return false;
        }
    }

    return req.headers["sec-fetch-site"] === "same-origin";
}

/* ---------- submission helpers ---------- */
const brief = p => ({ id: p.id, name: p.name, version: p.version, description: p.description, license: p.license, author: p.author, status: p.status, reason: p.reason || "", at: p.at, files: p.fileCount, flags: p.flagCount });
function prune() {   // decided submissions disappear after 30 days
  const cut = Date.now() - 30 * 86400e3; let ch = false;
  for (const [id, p] of Object.entries(db.pending)) if (p.status !== "pending" && p.at < cut) { delete db.pending[id]; ch = true; }
  return ch;
}

/* ---------- API ---------- */
async function api(req, res, url) {
  const m = req.method, parts = url.pathname.split("/").filter(Boolean).slice(1);   // after "api"
  if (m !== "GET") {
    if (!sameOrigin(req)) return fail(res, 403, "Cross-site request blocked");
    if (!/^application\/json/.test(req.headers["content-type"] || "") && m !== "DELETE" && !(m === "POST" && parts[0] === "submissions" && parts[2])) return fail(res, 415, "JSON only");
  }
  const s = getSession(req), who = s && { name: s.name, role: s.role };
  const route = parts[0];

  if (route === "me" && m === "GET") return send(res, 200, { user: who, bio: s ? (own(db.profiles, s.ln) || {}).bio || "" : "", avatar: s ? (own(db.profiles, s.ln) || {}).avatarAt || 0 : 0, registration: REGISTRATION, licenses: LICENSES });

  if (route === "logout" && m === "POST") {
    if (s) sessions.delete(s.k);
    return send(res, 200, { ok: true }, { "Set-Cookie": `${SID}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${SECURE ? "; Secure" : ""}` });
  }

  if (route === "register" && m === "POST") {
    if (!REGISTRATION) return fail(res, 403, "Registration is closed");
    const b = await readJson(req).catch(e => e), a = ip(req);
    if (b instanceof Error) return fail(res, 400, b.message);
    if (limited("reg|" + a, 5, 3600e3)) return fail(res, 429, "Too many sign-ups, try later");
    const u = b.username, p = b.password;
    if (typeof u !== "string" || !USER_RE.test(u)) return fail(res, 400, "Username: 3-20 letters, numbers or underscores");
    if (typeof p !== "string" || p.length < 10 || p.length > 128) return fail(res, 400, "Password must be 10-128 characters");
    if (isReserved(u) || db.users[u.toLowerCase()]) return fail(res, 409, "That username is not available");
    if (Object.keys(db.users).length >= 5000) return fail(res, 503, "Registration is full");
    bump("reg|" + a);
    const salt = crypto.randomBytes(16).toString("hex"), hash = (await hashPw(p, salt)).toString("hex");
    const ln = u.toLowerCase();
    if (db.users[ln]) return fail(res, 409, "That username is not available");
    db.users[ln] = { name: u, salt, hash, lastIp: a }; await save();;
    return send(res, 200, { user: { name: u, role: "user" } }, { "Set-Cookie": newSession(res, ln, u, "user") });
  }

  if (route === "login" && m === "POST") {
    const b = await readJson(req).catch(e => e), a = ip(req);
    if (b instanceof Error) return fail(res, 400, b.message);
    const u = typeof b.username === "string" ? b.username.slice(0, 20) : "", p = typeof b.password === "string" ? b.password.slice(0, 128) : "";
    const ln = u.toLowerCase(), kIp = "li|" + a, kAcc = "la|" + ln;
    const isAdmin = ln === "green";
    if (limited(kIp, 10, 15 * 60e3) || limited(kAcc, isAdmin ? 8 : 20, 15 * 60e3)) return fail(res, 429, "Too many attempts. Try again in 15 minutes.");
    let rec = null;
    if (isAdmin) { const ad = readAdmin(); if (ad) rec = { name: "Green", role: "admin", salt: ad.salt, hash: ad.hash }; }
    else if (Object.prototype.hasOwnProperty.call(db.users, ln)) rec = { ...db.users[ln], role: "user" };
    const h = await hashPw(p, rec ? rec.salt : DUMMY_SALT);
    const ok = !!rec && crypto.timingSafeEqual(h, Buffer.from(rec.hash, "hex"));
    if (!ok) { bump(kIp); bump(kAcc); return fail(res, 401, "Invalid username or password"); }
    if (rec.banned) return fail(res, 403, "This account has been banned" + (rec.banned.reason ? ": " + rec.banned.reason : ""));
    clearKey(kAcc);
    if (!isAdmin && db.users[ln].lastIp !== a) { db.users[ln].lastIp = a; await save();; }
    return send(res, 200, { user: { name: rec.name, role: rec.role } }, { "Set-Cookie": newSession(res, ln, rec.name, rec.role) });
  }

  const isPublicPackageRead =
  route === "packages" &&
  m === "GET" &&
  (parts.length === 1 || parts.length === 2);

if (!s && !isPublicPackageRead) {
  return fail(res, 401, "Log in first");
}

  if (route === "profile") {
    const pr = () => own(db.profiles, s.ln) || {};
    if (m === "POST" && !parts[1]) {
      const b = await readJson(req).catch(e => e);
      if (b instanceof Error) return fail(res, 400, b.message);
      if (typeof b.bio !== "string" || b.bio.length > 160) return fail(res, 400, "Bio: max 160 characters");
      db.profiles[s.ln] = { ...pr(), bio: b.bio.replace(/[\u0000-\u001f\u007f]/g, " ").trim() }; await save();;
      return send(res, 200, { ok: true });
    }
    if (parts[1] === "avatar" && m === "POST") {
      if (limited("av|" + s.ln, 20, 3600e3)) return fail(res, 429, "Slow down, try again later");
      bump("av|" + s.ln);
      const b = await readJson(req, 140000).catch(e => e);
      if (b instanceof Error) return fail(res, 400, b.message);
      const mt = /^data:image\/jpeg;base64,([A-Za-z0-9+\/]+={0,2})$/.exec(typeof b.image === "string" ? b.image : "");
      if (!mt) return fail(res, 400, "Send a JPEG image");
      const buf = Buffer.from(mt[1], "base64");   // must be a real JPEG (start/end markers) and small
      if (buf.length < 200 || buf.length > 80000 || buf[0] !== 0xFF || buf[1] !== 0xD8 || buf[2] !== 0xFF || buf[buf.length - 2] !== 0xFF || buf[buf.length - 1] !== 0xD9) return fail(res, 400, "That image isn't valid or is too large");
      db.profiles[s.ln] = { ...pr(), avatar: mt[1], avatarAt: Date.now() }; await save();;
      return send(res, 200, { ok: true });
    }
    if (parts[1] === "avatar" && m === "DELETE") {
      const p = { ...pr() }; delete p.avatar; delete p.avatarAt; db.profiles[s.ln] = p; await save();;
      return send(res, 200, { ok: true });
    }
  }

  if (route === "avatar" && m === "GET") {   // served as an inert image: no sniffing, sandboxed, no scripts
    const p = own(db.profiles, (parts[1] || "").toLowerCase());
    if (!p || !p.avatar) return fail(res, 404, "Not found");
    const buf = Buffer.from(p.avatar, "base64");
    res.writeHead(200, { "Content-Type": "image/jpeg", "Content-Length": buf.length, "Cache-Control": "private, max-age=3600", "Content-Security-Policy": "default-src 'none'; sandbox", ...BASE });
    return res.end(buf);
  }

  /* ----- published packages (read, delete). Publishing happens only through approval ----- */
  if (route === "packages") {
    const name = parts[1];
    if (m === "GET" && !name) {
      return send(res, 200, { packages: Object.values(db.packages).map(({ name, version, description, license, author, owner, files, code }) => ({ name, version, description, license, author, mine: !!s && owner === s.ln, files: Object.keys(files || { m: code }).length })) });
    }
    if (m === "GET") {
      const p = own(db.packages, name);
      return p ? send(res, 200, { package: { name: p.name, version: p.version, description: p.description, license: p.license, author: p.author, files: p.files || { "main.gaug": p.code || "" } } }) : fail(res, 404, "Not found");
    }
    if (m === "DELETE" && name) {
      const p = own(db.packages, name);
      if (!p) return fail(res, 404, "Not found");
      if (p.owner !== s.ln && s.role !== "admin") return fail(res, 403, "Not allowed");
      delete db.packages[name]; await save();;
      return send(res, 200, { ok: true });
    }
  }

  /* ----- submissions: upload -> review queue -> approve / reject ----- */
  if (route === "submissions") {
    const id = parts[1], action = parts[2];

    if (m === "GET" && !id) {   // admin: the whole pending queue. user: own submissions, any status
      if (prune()) await save();;
      const list = Object.values(db.pending).filter(p => s.role === "admin" ? p.status === "pending" : p.owner === s.ln);
      return send(res, 200, { submissions: list.sort((a, b) => b.at - a.at).map(brief) });
    }

    if (m === "GET" && id) {
      const p = own(db.pending, id);
      if (!p || (p.owner !== s.ln && s.role !== "admin")) return fail(res, 404, "Not found");
      return send(res, 200, { submission: { ...brief(p), ...(s.role === "admin" ? { files: p.files, flagList: p.flags } : {}) } });
    }

    if (m === "POST" && !id) {   // upload
      if (limited("sub|" + s.ln, 10, 3600e3)) return fail(res, 429, "Slow down, try again later");
      bump("sub|" + s.ln);
      const b = await readJson(req, 1.6e6).catch(e => e);
      if (b instanceof Error) return fail(res, 400, b.message);
      const { name: n, version, description, license, zip } = b;
      if (typeof n !== "string" || !PKG_RE.test(n)) return fail(res, 400, "Name: 2-32 chars, a-z 0-9 _ -");
      if (typeof version !== "string" || !VER_RE.test(version)) return fail(res, 400, "Version must look like 1.0.0");
      if (typeof description !== "string" || !description.trim() || description.length > 300) return fail(res, 400, "Description is required (max 300 characters)");
      if (!LICENSES.includes(license)) return fail(res, 400, "Pick a license");
      if (typeof zip !== "string" || !zip.length || zip.length > 1.5e6) return fail(res, 400, "Attach a .zip under 1 MB");
      const ex = own(db.packages, n);
      if (ex && ex.owner !== s.ln && s.role !== "admin") return fail(res, 403, "That package name belongs to someone else");
      if (ex && s.role !== "admin" && cmpVer(version, ex.version) <= 0) return fail(res, 400, `Version must be higher than the published ${ex.version}`);
      const mine = Object.values(db.pending).filter(p => p.owner === s.ln && p.status === "pending");
      if (mine.length >= MAX_PENDING_PER_USER) return fail(res, 400, `You already have ${MAX_PENDING_PER_USER} packages waiting for review`);
      if (mine.some(p => p.name === n && p.version === version)) return fail(res, 409, "That version is already waiting for review");
      let files; try { files = readZip(Buffer.from(zip, "base64")); } catch (e) { return fail(res, 400, e.message); }
      const flags = scan(files), pid = crypto.randomBytes(6).toString("hex");
      db.pending[pid] = { id: pid, name: n, version, description: description.trim(), license, owner: s.ln, author: s.name, status: "pending", at: Date.now(), files, flags, fileCount: Object.keys(files).length, flagCount: flags.length };
      await save();;
      return send(res, 200, { ok: true, id: pid });
    }

    if (m === "POST" && id && s.role === "admin" && (action === "approve" || action === "reject")) {
      const p = own(db.pending, id);
      if (!p || p.status !== "pending") return fail(res, 404, "Not found or already decided");
      if (action === "approve") {
        const ex = own(db.packages, p.name);
        if (ex && ex.owner !== p.owner) return fail(res, 409, "That name now belongs to another user");
        db.packages[p.name] = { name: p.name, version: p.version, description: p.description, license: p.license, files: p.files, code: p.files["main.gaug"] || "", owner: p.owner, author: ex ? ex.author : p.author };
        p.status = "approved";
      } else {
        const b = await readJson(req).catch(() => ({}));
        p.status = "rejected"; p.reason = typeof b.reason === "string" ? b.reason.slice(0, 200) : "";
      }
      p.at = Date.now(); delete p.files; delete p.flags;   // the files now live in the package, or are discarded
      await save();;
      return send(res, 200, { ok: true });
    }

    if (m === "DELETE" && id) {
      const p = own(db.pending, id);
      if (!p || (p.owner !== s.ln && s.role !== "admin")) return fail(res, 404, "Not found");
      delete db.pending[id]; await save();;
      return send(res, 200, { ok: true });
    }
  }

  if (s.role === "admin" && (route === "users" || route === "ipban" || route === "ipunban")) {
    if (route === "users" && m === "GET") {
      const cnt = {}; for (const p of Object.values(db.packages)) cnt[p.owner] = (cnt[p.owner] || 0) + 1;
      return send(res, 200, {
        users: Object.entries(db.users).map(([ln, u]) => ({ name: u.name, banned: u.banned || null, ip: u.lastIp || "", packages: cnt[ln] || 0 })),
        ips: Object.entries(db.bans).map(([a, b]) => ({ ip: a, ...b })),
      });
    }
    if (route === "users" && m === "POST" && parts[1] && (parts[2] === "ban" || parts[2] === "unban")) {
      const ln = parts[1].toLowerCase(), u = own(db.users, ln);
      if (!u) return fail(res, 404, "Not found");
      if (parts[2] === "ban") {
        const b = await readJson(req).catch(() => ({}));
        u.banned = { reason: typeof b.reason === "string" ? b.reason.slice(0, 200) : "", at: Date.now() };
        for (const [k, v] of sessions) if (v.ln === ln) sessions.delete(k);
      } else delete u.banned;
      await save();;
      return send(res, 200, { ok: true });
    }
    if ((route === "ipban" || route === "ipunban") && m === "POST") {
      const b = await readJson(req).catch(e => e);
      if (b instanceof Error) return fail(res, 400, b.message);
      const a = normIp(b.ip);
      if (!net.isIP(a)) return fail(res, 400, "Enter a valid IP address");
      if (route === "ipban") {
        if (a === ip(req)) return fail(res, 400, "You can't ban your own IP address");
        db.bans[a] = { reason: typeof b.reason === "string" ? b.reason.slice(0, 200) : "", at: Date.now() };
      } else delete db.bans[a];
      await save();;
      return send(res, 200, { ok: true });
    }
    if (route === "users" && m === "DELETE" && parts[1]) {
      const ln = parts[1].toLowerCase();
      if (!Object.prototype.hasOwnProperty.call(db.users, ln)) return fail(res, 404, "Not found");
      delete db.users[ln]; delete db.profiles[ln];
      for (const k of Object.keys(db.packages)) if (db.packages[k].owner === ln) delete db.packages[k];
      for (const k of Object.keys(db.pending)) if (db.pending[k].owner === ln) delete db.pending[k];
      for (const [k, v] of sessions) if (v.ln === ln) sessions.delete(k);
      await save();;
      return send(res, 200, { ok: true });
    }
  }
  return fail(res, 404, "Not found");
}

/* ---------- static files ---------- */
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2" };
function serve(req, res, url) {
  let p; try { p = decodeURIComponent(url.pathname); } catch { return send(res, 400, "Bad request"); }
  if (p === "/") p = "/index.html";
  if (p.includes("\0") || p.split("/").some(s => s.startsWith("."))) return send(res, 404, "Not found");
  let f; try { f = fs.realpathSync(path.join(ROOT, p)); } catch { return send(res, 404, "Not found"); }
  const rel = path.relative(ROOT, f);
  if (rel.startsWith("..") || path.isAbsolute(rel) || rel.split(path.sep)[0] === "server") return send(res, 404, "Not found");
  const type = MIME[path.extname(f).toLowerCase()];
  if (!type || !fs.statSync(f).isFile()) return send(res, 404, "Not found");
  const h = { "Content-Type": type, ...BASE };
  if (rel === "packages.html") h["Content-Security-Policy"] = CSP;
  res.writeHead(200, h);
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(f).pipe(res);
}

const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigin = origin === FRONTEND_ORIGIN;

    if (allowedOrigin) {
        res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Max-Age", "600");
        res.setHeader("Vary", "Origin");
    }

    if (req.method === "OPTIONS") {
        if (!allowedOrigin) {
            res.writeHead(403);
            return res.end();
        }

        res.writeHead(204);
        return res.end();
    }
  try {
    if (Object.prototype.hasOwnProperty.call(db.bans, ip(req))) {
      return send(res, 403, "Access denied");
    }

    const url = new URL(req.url, "http://x");

    if (url.pathname.startsWith("/api/")) {
      return await api(req, res, url);
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, "Method not allowed");
    }

    serve(req, res, url);
  } catch (e) {
    console.error("Request failed:", e.message);
    if (!res.headersSent) fail(res, 500, "Server error");
  }
});

async function start() {
  try {
    await initializeStorage();

    const host = process.env.HOST || "0.0.0.0";

    server.listen(PORT, host, () => {
      console.log(`Gaug site listening on port ${PORT}`);
    });
  } catch (e) {
    console.error("Gaug startup failed:", e.message);
    await pool.end().catch(() => {});
    process.exitCode = 1;
  }
}

start();
