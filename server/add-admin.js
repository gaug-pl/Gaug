"use strict";
// Manages admin accounts in the Gaug registry database (Neon/Postgres).
//
//   node server/add-admin.js <username>      add an admin (prompts for password twice)
//   node server/add-admin.js list            list admin accounts
//   node server/add-admin.js remove <name>   remove an admin account
//
// Requires DATABASE_URL (same as server.js). Passwords are scrypt-hashed with
// a random salt — identical parameters to user registration — and are never
// stored or printed in plain text. Admins get role "admin" at login and the
// same powers as the built-in "Green" account. Admin usernames cannot be
// registered as regular users afterwards.
const crypto = require("crypto"), readline = require("readline");
const { Pool } = require("pg");

const USER_RE = /^[A-Za-z0-9_]{3,20}$/;
const RESERVED = ["green", "admin", "administrator", "root", "system", "moderator", "staff", "owner", "gaug"];
const isReserved = n => RESERVED.includes(n.toLowerCase().replace(/_/g, ""));

let ask;
if (process.stdin.isTTY) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let muted = false;
  rl._writeToOutput = t => { if (!muted || t.includes("\n")) rl.output.write(t); };
  ask = q => new Promise(r => { muted = false; rl.question(q, a => { muted = false; rl.output.write("\n"); r(a); }); muted = true; });
} else {
  const lines = require("fs").readFileSync(0, "utf8").split(/\r?\n/);
  ask = () => Promise.resolve(lines.shift() || "");
}

function loadDb() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Run this where the server's environment is available.");
    process.exit(1);
  }
  return new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
}

async function readStore(pool) {
  const r = await pool.query("SELECT data FROM gaug_storage WHERE id = 1");
  if (r.rows.length !== 1 || !r.rows[0].data || typeof r.rows[0].data !== "object") {
    throw new Error("Gaug database row not found or invalid");
  }
  const db = r.rows[0].data;
  db.users ||= {}; db.admins ||= {}; db.nextId ||= 2;
  return db;
}

async function writeStore(pool, db) {
  await pool.query(
    "UPDATE gaug_storage SET data = $1::jsonb, updated_at = NOW() WHERE id = 1",
    [JSON.stringify(db)]
  );
}

async function addAdmin(pool, username) {
  if (!USER_RE.test(username)) {
    console.error("Username must be 3-20 letters, numbers or underscores.");
    process.exit(1);
  }
  const ln = username.toLowerCase();
  if (ln !== "green" && isReserved(ln)) {
    console.error(`'${username}' is a reserved name.`);
    process.exit(1);
  }

  const db = await readStore(pool);
  if (db.users[ln]) { console.error(`'${username}' is already a registered user. Delete that user first.`); process.exit(1); }
  if (db.admins[ln]) { console.error(`'${username}' is already an admin.`); process.exit(1); }

  const a = await ask(`New password for ${username} (12-128 chars): `);
  if (a.length < 12 || a.length > 128) { console.error("Must be 12-128 characters."); process.exit(1); }
  const b = await ask("Repeat password: ");
  if (a !== b) { console.error("Passwords do not match."); process.exit(1); }

  const saltBytes = crypto.randomBytes(16);
  const hash = crypto.scryptSync(a, saltBytes, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  db.admins[ln] = { name: username, salt: saltBytes.toString("hex"), hash: hash.toString("hex"), id: db.nextId++ };
  await writeStore(pool, db);
  console.log(`Admin '${username}' added (profile #${db.admins[ln].id}). They can log in right away.`);
}

async function listAdmins(pool) {
  const db = await readStore(pool);
  const entries = Object.entries(db.admins);
  console.log("Built-in admin: Green (#1) — credentials from ADMIN_HASH/ADMIN_SALT or data/admin.json");
  if (!entries.length) { console.log("No additional admin accounts."); return; }
  for (const [ln, a] of entries) console.log(`  ${a.name} (@${ln}) — profile #${a.id}`);
}

async function removeAdmin(pool, username) {
  const ln = username.toLowerCase();
  const db = await readStore(pool);
  if (!db.admins[ln]) {
    console.error(ln === "green"
      ? "There is no db.admins 'green' entry — the built-in Green uses env vars / admin.json, which this script cannot remove."
      : `'${username}' is not an admin.`);
    process.exit(1);
  }
  delete db.admins[ln];
  await writeStore(pool, db);
  console.log(`Admin '${username}' removed.` +
    (ln === "green" ? " Note: the built-in Green may still be active via ADMIN_HASH/ADMIN_SALT or data/admin.json." : ""));
}

(async () => {
  const [cmd, arg] = process.argv.slice(2);
  const pool = loadDb();
  try {
    if (cmd === "list") await listAdmins(pool);
    else if (cmd === "remove" && arg) await removeAdmin(pool, arg);
    else if (cmd && cmd !== "list" && cmd !== "remove") await addAdmin(pool, cmd);
    else {
      console.log("Usage:");
      console.log("  node server/add-admin.js <username>      add an admin");
      console.log("  node server/add-admin.js list            list admins");
      console.log("  node server/add-admin.js remove <name>   remove an admin");
      process.exitCode = 1;
    }
  } catch (e) {
    console.error("Failed:", e.message);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
})();
