"use strict";
// Creates a login session for an existing account and prints the cookie
// value — no password needed. Use it to get back into an account when the
// password is unknown, or to log the CLI in without interactive prompts.
//
//   node server/make-session.js <username>
//
// Output is a single line:  sid=<token>
//   - CLI:     put that whole line into ~/.gaug/session
//   - Browser: devtools -> Application -> Cookies -> add name "sid", value "<token>"
//
// The session never expires (same as normal logins) until logout or removal.
// Requires DATABASE_URL (same as server.js).
const crypto = require("crypto"), fs = require("fs"), path = require("path");
const { Pool } = require("pg");

const SESSION_TTL = 200 * 365 * 86400e3;
const SID = process.env.SECURE_COOKIES === "1" ? "__Host-sid" : "sid";
const sha = s => crypto.createHash("sha256").update(s).digest("hex");

function greenCredsExist() {
  if (process.env.ADMIN_HASH && process.env.ADMIN_SALT) return true;
  try {
    const f = path.join(__dirname, "data", "admin.json");
    const a = JSON.parse(fs.readFileSync(f, "utf8"));
    return !!(a && a.hash && a.salt);
  } catch { return false; }
}

(async () => {
  const username = process.argv[2];
  if (!username) { console.error("Usage: node server/make-session.js <username>"); process.exit(1); }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Run this where the server's environment is available.");
    process.exit(1);
  }
  const ln = username.toLowerCase();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
  try {
    const r = await pool.query("SELECT data FROM gaug_storage WHERE id = 1");
    if (r.rows.length !== 1 || !r.rows[0].data) throw new Error("Gaug database row not found");
    const db = r.rows[0].data;
    db.users ||= {}; db.admins ||= {}; db.sessions ||= {};

    let rec = null;
    const adm = db.admins[ln];
    if (adm) rec = { ln, name: adm.name, role: "admin" };
    else if (ln === "green" && greenCredsExist()) rec = { ln, name: "Green", role: "admin" };
    else if (db.users[ln]) rec = { ln, name: db.users[ln].name, role: "user" };
    if (!rec) { console.error(`No account named '${username}'.`); process.exit(1); }

    const tok = crypto.randomBytes(32).toString("hex");
    db.sessions[sha(tok)] = { ...rec, exp: Date.now() + SESSION_TTL };
    await pool.query(
      "UPDATE gaug_storage SET data = $1::jsonb, updated_at = NOW() WHERE id = 1",
      [JSON.stringify(db)]
    );
    console.log(`${SID}=${tok}`);
  } finally {
    await pool.end().catch(() => {});
  }
})().catch(e => { console.error("Failed:", e.message); process.exit(1); });
