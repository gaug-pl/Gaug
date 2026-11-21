"use strict";
// Removes EVERY registered user from the Gaug registry database.
//
// For each user this also removes: their profile, published packages they own,
// pending/reviewed submissions they own, and their sessions — the same
// cascade the admin "delete user" action performs per user.
// Admin accounts are NOT touched: the built-in "Green" and every account in
// db.admins keep working.
//
//   node server/clear-users.js          preview + confirm
//   node server/clear-users.js --yes    skip the confirmation prompt
//
// Requires DATABASE_URL (same as server.js). Take a backup of the
// gaug_storage row first if you might need the data back.
const readline = require("readline");
const { Pool } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Run this where the server's environment is available.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
  try {
    const r = await pool.query("SELECT data FROM gaug_storage WHERE id = 1");
    if (r.rows.length !== 1 || !r.rows[0].data || typeof r.rows[0].data !== "object") {
      throw new Error("Gaug database row not found or invalid");
    }
    const db = r.rows[0].data;
    db.users ||= {}; db.packages ||= {}; db.pending ||= {}; db.profiles ||= {};
    db.sessions ||= {}; db.bans ||= {}; db.admins ||= {};

    const lns = Object.keys(db.users);
    if (!lns.length) { console.log("No users to remove."); return; }

    const pkgs = Object.values(db.packages || {}).filter(p => lns.includes(p.owner)).length;
    const subs = Object.values(db.pending || {}).filter(p => lns.includes(p.owner)).length;
    const sess = Object.values(db.sessions || {}).filter(s => lns.includes(s.ln)).length;
    const ips = Object.keys(db.bans || {}).length;

    console.log(`This will permanently remove ${lns.length} user account(s):`);
    for (const ln of lns) console.log(`  - ${db.users[ln].name} (@${ln})`);
    console.log(`Along with: ${pkgs} published package(s), ${subs} submission(s), ${sess} session(s).`);
    console.log(`IP bans (${ips}) and admin accounts are kept.`);

    if (!process.argv.includes("--yes")) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise(res => rl.question("Type 'yes' to continue: ", res));
      rl.close();
      if (answer !== "yes") { console.log("Cancelled."); return; }
    }

    for (const ln of lns) {
      delete db.users[ln];
      delete db.profiles[ln];
      for (const k of Object.keys(db.packages)) if (db.packages[k].owner === ln) delete db.packages[k];
      for (const k of Object.keys(db.pending)) if (db.pending[k].owner === ln) delete db.pending[k];
      for (const [k, v] of Object.entries(db.sessions)) if (v.ln === ln) delete db.sessions[k];
    }

    await pool.query(
      "UPDATE gaug_storage SET data = $1::jsonb, updated_at = NOW() WHERE id = 1",
      [JSON.stringify(db)]
    );
    console.log(`Removed ${lns.length} user(s) and all of their data.`);
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch(e => { console.error("Failed:", e.message); process.exitCode = 1; });
