"use strict";
// Sets the password for the admin account "Green". Run on the server only:  node server/set-admin.js
// The password is hashed (scrypt + random salt) and stored in server/data/admin.json (mode 600).
// It is never stored in plain text, never in the repo, and cannot be set from the website.
const fs = require("fs"), path = require("path"), crypto = require("crypto"), readline = require("readline");
const DATA = path.join(__dirname, "data");
fs.mkdirSync(DATA, { recursive: true, mode: 0o700 });

let ask;
if (process.stdin.isTTY) {
  // interactive: input is hidden while typing
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let muted = false;
  rl._writeToOutput = t => { if (!muted || t.includes("\n")) rl.output.write(t); };
  // the prompt is printed by rl.question first; hiding starts only after it is on screen
  ask = q => new Promise(r => { muted = false; rl.question(q, a => { muted = false; rl.output.write("\n"); r(a); }); muted = true; });
} else {
  // piped input: two lines (password, then repeat)
  const lines = require("fs").readFileSync(0, "utf8").split(/\r?\n/);
  ask = () => Promise.resolve(lines.shift() || "");
}

(async () => {
  const a = await ask("New password for Green (12+ chars): ");
  if (a.length < 12 || a.length > 128) { console.error("Must be 12-128 characters."); process.exit(1); }
  const b = await ask("Repeat password: ");
  if (a !== b) { console.error("Passwords do not match."); process.exit(1); }
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(a, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const file = path.join(DATA, "admin.json");
  fs.writeFileSync(file, JSON.stringify({ salt: salt.toString("hex"), hash: hash.toString("hex") }), { mode: 0o600 });
  try { fs.chmodSync(file, 0o600); fs.chmodSync(DATA, 0o700); } catch {}
  console.log("Saved. The admin account 'Green' is now active (no restart needed).");
  process.exit(0);
})();