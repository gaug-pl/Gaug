"use strict";
/* Packages page: login -> account -> upload -> (admin) review. All text goes through textContent, never innerHTML. */
const API_BASE = "https://gaugregisteryapi.onrender.com";

(function () {
  const app = document.getElementById("app");
  let me = null, licenses = [], notice = "";

  /* ---------- helpers ---------- */
  const SVG = new Set(["svg", "path", "polygon", "text", "circle"]);
  function h(tag, attrs, ...kids) {
    const e = SVG.has(tag) ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") e.setAttribute("class", v);
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat(Infinity)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    return e;
  }
  async function api(p, method = "GET", body) {
    const r = await fetch(`${API_BASE}/api/${p}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
});

    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Request failed");
    return d;
  }
  const go = hash => { if (location.hash === hash) render(); else location.hash = hash; };
  const show = (...nodes) => { app.classList.remove("wide"); app.replaceChildren(...nodes); window.scrollTo(0, 0); };
  const when = t => new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const kb = n => n < 1024 ? n + " B" : (n / 1024).toFixed(n < 10240 ? 1 : 0) + " KB";
  const crumb = (...items) => h("div", { class: "crumb" }, items.map((it, i) => [i ? h("span", { class: "sep" }, "/") : null, it.href ? h("a", { href: it.href }, it.t) : h("span", { class: "muted" }, it.t)]));
  const status = s => h("span", { class: "st " + s }, s === "pending" ? "In review" : s[0].toUpperCase() + s.slice(1));
  const empty = t => h("p", { class: "muted", style: "margin:0;font-size:14px" }, t);

  /* ---------- login / sign up ---------- */
  function authView(registration) {
    let mode = "login";
    const err = h("p", { class: "err", role: "alert" });
    const user = h("input", { id: "u", autocomplete: "username", maxlength: 20 });
    const pass = h("input", { id: "p", type: "password", maxlength: 128 });
    const btn = h("button", { class: "btn", type: "submit" }, "Log in");
    const tabs = h("div", { class: "tabs", role: "tablist" });
    function draw() {
      tabs.replaceChildren(...[["login", "Log in"], ...(registration ? [["register", "Create account"]] : [])].map(([k, t]) =>
        h("button", { type: "button", role: "tab", "aria-selected": String(mode === k), onclick: () => { mode = k; err.textContent = ""; btn.textContent = t; pass.autocomplete = k === "login" ? "current-password" : "new-password"; draw(); } }, t)));
    }
    draw(); pass.autocomplete = "current-password";
    const form = h("form", { class: "auth", onsubmit: async e => {
      e.preventDefault(); err.textContent = ""; btn.disabled = true;
      try { await api(mode, "POST", { username: user.value.trim(), password: pass.value }); await boot(); }
      catch (x) { err.textContent = x.message; btn.disabled = false; }
    } }, tabs, h("label", { for: "u" }, "Username"), user, h("label", { for: "p" }, "Password"), pass, err, btn,
      h("p", { class: "note" }, "Packages are reviewed by hand before they go public."));
    show(h("h1", {}, "Packages"), h("p", { class: "sub" }, "Log in to publish packages to the Gaug registry."), form);
  }

  /* ---------- account area ---------- */
  const P = {
    user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
    box: ["M21 8l-9-5-9 5v8l9 5 9-5z", "M3 8l9 5 9-5", "M12 13v8"],
    down: ["M12 3v12", "M7 11l5 5 5-5", "M5 21h14"],
    gear: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"],
    home: ["M3 11l9-8 9 8", "M5 10v10h14V10"],
    check: ["M9 11l3 3 8-8", "M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"],
    pen: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"],
    code: ["M16 18l6-6-6-6", "M8 6l-6 6 6 6"],
    file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h8"],
    dots: ["M12 5v.01", "M12 12v.01", "M12 19v.01"],
  };
  const icon = (n, cls = "ic") => h("svg", { viewBox: "0 0 24 24", class: cls, "aria-hidden": "true" }, P[n].map(d => h("path", { d })));
  document.addEventListener("click", () => document.querySelectorAll(".kmenu.open").forEach(m => m.classList.remove("open")));

  const avatar = () => h("div", { class: "avatar" }, me.avatar
    ? h("img", { src: `/api/avatar/${encodeURIComponent(me.name.toLowerCase())}?v=${me.avatar}`, alt: "" })
    : h("svg", { viewBox: "0 0 100 100", "aria-hidden": "true" },
      h("circle", { cx: 50, cy: 50, r: 50, fill: "#1f252d" }), h("circle", { cx: 50, cy: 38, r: 14, fill: "#8b949e" }), h("path", { d: "M24 80C24 65 36 58 50 58S76 65 76 80z", fill: "#8b949e" })));
  const cube = () => h("svg", { viewBox: "0 0 120 124", class: "cube", "aria-hidden": "true" },
    h("polygon", { points: "60,6 108,32 60,58 12,32", fill: "#6ee83a" }), h("polygon", { points: "12,32 60,58 60,116 12,90", fill: "#2a8a0c" }), h("polygon", { points: "108,32 60,58 60,116 108,90", fill: "#3fb311" }),
    ...[["#1d6a07", 1.6, .55], ["#eaffdc", 0, 1]].map(([c, o, op]) => h("text", { x: 24, y: 44, "text-anchor": "middle", "font-size": 44, "font-weight": 800, fill: c, "fill-opacity": op, style: "font-family:var(--sans)", transform: `matrix(1 .5417 0 1 ${12 + o} ${32 + o})` }, "G")));

  async function load() {
    const [s, k] = await Promise.all([api("submissions"), api("packages")]);
    return { subs: s.submissions, pk: k.packages, mine: k.packages.filter(p => p.mine) };
  }
  const menuNav = (items, active, cls) => h("div", { class: cls, role: "navigation" }, items.map(([href, ic, label, key]) => h("a", { href, class: key === active ? "on" : "" }, icon(ic), label)));

  function shell(tab, d, ...content) {
    const admin = me.role === "admin", pending = admin ? d.subs.length : d.subs.filter(s => s.status === "pending").length;
    const side = [["#/", "user", "Profile", "profile"], ["#/mine", "box", "My Packages", "mine"], ["installations.html", "down", "Installations", ""], ["#/settings", "gear", "Settings", "settings"]];
    const inner = [["#/", "home", "Overview", "overview"], ["#/mine", "box", "My Packages", "mine"],
      admin ? ["#/queue", "check", "Review queue" + (pending ? ` (${pending})` : ""), "queue"] : ["#/submissions", "check", "Submissions", "submissions"],
      ...(admin ? [["#/all", "box", "All Packages", "all"], ["#/controls", "gear", "Controls", "controls"]] : [])];
    const stat = (n, t) => h("div", { class: "stat" }, h("b", {}, n), h("span", {}, t));
    const header = h("div", { class: "a-card prof" }, avatar(),
      h("div", { class: "pmain" }, h("h2", { class: "pname" }, me.name, admin && h("span", { class: "badge" }, "ADMIN")), h("div", { class: "handle" }, "@" + me.name.toLowerCase()), h("p", { class: "bio" }, me.bio || "No bio yet."),
        h("div", { class: "stats" }, stat(d.mine.length, "Packages"))),
      h("a", { class: "btn ghost ed", href: "#/settings" }, icon("pen", "ic sm"), "Edit Profile"));
    const note = notice ? h("div", { class: "a-card okbar" }, notice) : null; notice = "";
    show(h("div", { class: "shell" },
      menuNav(side, tab === "settings" ? "settings" : tab === "mine" ? "mine" : "profile", "side a-card"),
      h("div", { class: "acol" }, header, h("div", { class: "inner" }, menuNav(inner, tab, "tabs2 a-card"), h("div", { class: "pane" }, note, ...content)))));
    app.classList.add("wide");
  }

  const head = (t, right) => h("div", { class: "chead" }, h("h3", {}, t), right);
  const viewAll = href => h("a", { href, class: "va" }, "View all →");
  const upBtn = () => h("a", { class: "btn sm", href: "#/upload" }, "Upload Package");

  function pkgRow(p) {
    const tile = ["code", "gear", "file"][[...p.name].reduce((a, c) => a + c.charCodeAt(0), 0) % 3];
    const menu = h("div", { class: "kmenu" },
      h("button", { onclick: () => go("#/pkg/" + encodeURIComponent(p.name)) }, "View"),
      (p.mine || me.role === "admin") && h("button", { class: "del", onclick: async () => { if (confirm(`Delete ${p.name}?`)) { await api("packages/" + encodeURIComponent(p.name), "DELETE"); render(); } } }, "Delete"));
    const kebab = h("div", { class: "kwrap", onclick: e => e.stopPropagation() },
      h("button", { class: "kbtn", "aria-label": "Package actions", onclick: e => { e.stopPropagation(); const o = menu.classList.contains("open"); document.querySelectorAll(".kmenu.open").forEach(m => m.classList.remove("open")); if (!o) menu.classList.add("open"); } }, icon("dots")), menu);
    return h("div", { class: "prow", onclick: () => go("#/pkg/" + encodeURIComponent(p.name)) },
      h("div", { class: "tile" }, icon(tile, "ic big")),
      h("div", { class: "pinfo" }, h("b", {}, p.name), h("small", {}, p.description), h("span", {}, "v" + p.version + (p.mine ? "" : " · " + p.author))),
      h("div", { class: "pstat" }, h("b", {}, p.files || 0), h("small", {}, "Files")),
      h("div", { class: "pstat" }, h("b", {}, p.license || "—"), h("small", {}, "License")), kebab);
  }
  const pkgCard = (title, list, link, none, right) => h("div", { class: "a-card sec" }, head(title, right || (link && list.length ? viewAll(link) : null)), list.length ? list.map(pkgRow) : h("div", { class: "none" }, none));

  const subRow = s => h("div", { class: "srow", style: "cursor:default" },
    h("div", {}, h("b", {}, s.name, " ", h("code", {}, "v" + s.version)), h("small", {}, s.status === "rejected" && s.reason ? "Rejected: " + s.reason : `${s.files} files · ${when(s.at)}`)),
    status(s.status), s.status !== "pending" ? h("button", { class: "btn danger", onclick: async () => { await api("submissions/" + s.id, "DELETE"); render(); } }, "Clear") : h("span"));
  const subsCard = (list, title, link) => h("div", { class: "a-card sec" }, head(title, link && list.length ? viewAll(link) : null), list.length ? list.map(subRow) : h("div", { class: "none" }, "You haven't uploaded anything yet."));
  const queueCard = (list, title, link) => h("div", { class: "a-card sec" }, head(title, link && list.length ? viewAll(link) : null),
    list.length ? list.map(s => h("div", { class: "srow", onclick: () => go("#/review/" + s.id) },
      h("div", {}, h("b", {}, s.name, " ", h("code", {}, "v" + s.version)), h("small", {}, `${s.author} · ${s.files} files · ${when(s.at)}`)),
      s.flags ? h("span", { class: "st rejected" }, s.flags + " flagged") : h("span", { class: "st approved" }, "No flags"), h("span", { class: "muted" }, "Review →"))) : h("div", { class: "none" }, "Nothing to review."));

  async function overviewView() {
    const d = await load(), admin = me.role === "admin";
    const banner = h("div", { class: "a-card banner" }, h("div", {}, h("h2", {}, "Welcome back, ", h("span", { class: "g" }, me.name), "!"), h("p", {}, "Keep building and share your packages with the community."), upBtn()), cube());
    shell("overview", d, banner,
      admin ? queueCard(d.subs.slice(0, 3), "Waiting for your review", "#/queue") : (d.subs.length ? subsCard(d.subs.slice(0, 3), "Recent submissions", "#/submissions") : null),
      pkgCard("Your Packages", d.mine.slice(0, 3), "#/mine", "You haven't published anything yet."));
  }
  async function mineView() { const d = await load(); shell("mine", d, pkgCard("My Packages", d.mine, null, "You haven't published anything yet.", upBtn())); }
  async function subsView() { const d = await load(); shell("submissions", d, subsCard(d.subs, "My submissions")); }
  async function queueView() { const d = await load(); shell("queue", d, queueCard(d.subs, "Waiting for your review")); }
  async function allView() { const d = await load(); shell("all", d, pkgCard("All Packages", d.pk, null, "No packages are published yet.")); }

  async function controlsView() {
    const [d, c] = await Promise.all([load(), api("users")]);
    const bannedIps = new Set(c.ips.map(x => x.ip));
    const act = async (path, body, msg) => { try { await api(path, "POST", body || {}); notice = msg; render(); } catch (x) { alert(x.message); } };
    const q = h("input", { placeholder: "Search users", "aria-label": "Search users", style: "margin:0;width:200px;height:34px;padding:0 12px" });
    const list = h("div");
    function row(u) {
      const ipb = !!u.ip && bannedIps.has(u.ip), enc = encodeURIComponent(u.name);
      const ban = u.banned
        ? h("button", { class: "btn ghost sm", onclick: () => act(`users/${enc}/unban`, {}, `${u.name} was unbanned.`) }, "Unban")
        : h("button", { class: "btn danger", onclick: () => { const r = prompt(`Ban ${u.name}? Reason (optional, shown to them at login):`); if (r !== null) act(`users/${enc}/ban`, { reason: r }, `${u.name} was banned.`); } }, "Ban");
      const ipBtn = ipb
        ? h("button", { class: "btn ghost sm", onclick: () => act("ipunban", { ip: u.ip }, `${u.ip} was unbanned.`) }, "Unban IP")
        : h("button", { class: "btn danger", disabled: !u.ip, title: u.ip ? "" : "No IP recorded yet (they haven't logged in since this feature was added)", onclick: () => { if (confirm(`Ban IP ${u.ip}? Everyone using this address will be blocked from the whole site.`)) act("ipban", { ip: u.ip, reason: "Banned with " + u.name }, `${u.ip} was banned.`); } }, "IP ban");
      return h("div", { class: "urow" },
        h("div", {}, h("b", {}, u.name, u.banned && h("span", { class: "st rejected", style: "margin-left:8px" }, "Banned"), ipb && h("span", { class: "st pending", style: "margin-left:8px" }, "IP banned")),
          h("small", {}, `${u.packages} packages · `, h("code", {}, u.ip || "no IP yet"), u.banned && u.banned.reason ? " · " + u.banned.reason : "")),
        h("div", { class: "row" }, ban, ipBtn));
    }
    function draw() {
      const f = q.value.trim().toLowerCase(), rows = c.users.filter(u => u.name.toLowerCase().includes(f)).slice(0, 200).map(row);
      list.replaceChildren(...(rows.length ? rows : [h("div", { class: "none" }, "No users found.")]));
    }
    q.addEventListener("input", draw); draw();
    const ip = h("input", { placeholder: "IP address, e.g. 203.0.113.7", "aria-label": "IP address", style: "margin:0" });
    const why = h("input", { placeholder: "Reason (optional)", maxlength: 200, "aria-label": "Reason", style: "margin:0" });
    const ipForm = h("form", { class: "ipform", onsubmit: e => { e.preventDefault(); act("ipban", { ip: ip.value, reason: why.value }, `${ip.value.trim()} was banned.`); } }, ip, why, h("button", { class: "btn danger", type: "submit" }, "Ban IP"));
    const ipList = c.ips.length ? c.ips.map(x => h("div", { class: "urow" },
      h("div", {}, h("b", {}, h("code", {}, x.ip)), h("small", {}, `${when(x.at)}${x.reason ? " · " + x.reason : ""}`)),
      h("button", { class: "btn ghost sm", onclick: () => act("ipunban", { ip: x.ip }, `${x.ip} was unbanned.`) }, "Unban IP"))) : [h("div", { class: "none" }, "No IP addresses are banned.")];
    shell("controls", d,
      h("div", { class: "a-card sec" }, head("Users", q), list),
      h("div", { class: "a-card sec" }, head("IP bans"), h("div", { class: "pad" }, ipForm), ipList));
  }

  async function settingsView() {
    const d = await load();
    const err = h("p", { class: "err", role: "alert" });
    const bio = h("textarea", { id: "bio", maxlength: 160, style: "font-family:var(--sans);white-space:pre-wrap;min-height:90px" }); bio.value = me.bio || "";
    const form = h("form", { onsubmit: async e => {
      e.preventDefault(); err.textContent = "";
      try { await api("profile", "POST", { bio: bio.value }); me.bio = bio.value.trim(); notice = "Profile saved."; render(); } catch (x) { err.textContent = x.message; }
    } }, h("label", { for: "bio" }, "Bio (max 160 characters)"), bio, err, h("button", { class: "btn sm", type: "submit" }, "Save"));
    const perr = h("p", { class: "err", role: "alert" });
    const pic = h("input", { type: "file", accept: "image/png,image/jpeg,image/webp", hidden: true });
    const toJpeg = file => new Promise((ok, no) => {   // crop to a square, resize, re-encode: strips metadata and anything odd
      const r = new FileReader();
      r.onerror = () => no(new Error("Could not read the file"));
      r.onload = () => {
        const im = new Image();
        im.onerror = () => no(new Error("That image could not be opened"));
        im.onload = () => {
          const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
          const x = c.getContext("2d"), m = Math.min(im.width, im.height);
          x.fillStyle = "#1f252d"; x.fillRect(0, 0, S, S);
          x.drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, S, S);
          ok(c.toDataURL("image/jpeg", 0.85));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
    pic.addEventListener("change", async () => {
      const f = pic.files[0]; perr.textContent = "";
      if (!f) return;
      if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) { perr.textContent = "Use a PNG, JPEG or WebP image."; return; }
      if (f.size > 8 * 1024 * 1024) { perr.textContent = "Image must be under 8 MB."; return; }
      try { await api("profile/avatar", "POST", { image: await toJpeg(f) }); me.avatar = Date.now(); notice = "Profile picture updated."; render(); }
      catch (x) { perr.textContent = x.message; }
    });
    const picCard = h("div", { class: "a-card sec" }, head("Profile picture"), h("div", { class: "pad picrow" }, avatar(),
      h("div", {}, h("div", { class: "row" }, pic, h("button", { class: "btn sm", type: "button", onclick: () => pic.click() }, "Upload picture"),
        me.avatar ? h("button", { class: "btn ghost sm", type: "button", onclick: async () => { await api("profile/avatar", "DELETE"); me.avatar = 0; notice = "Profile picture removed."; render(); } }, "Remove") : null),
        perr, h("p", { class: "note" }, "PNG, JPEG or WebP. It's cropped to a square and resized to 256×256."))));
    shell("settings", d, picCard,
      h("div", { class: "a-card sec" }, head("Profile"), h("div", { class: "pad" }, form, h("p", { class: "note" }, `Your username (@${me.name.toLowerCase()}) can't be changed.`))),
      h("div", { class: "a-card sec" }, head("Session"), h("div", { class: "pad" }, h("button", { class: "btn ghost", onclick: async () => { await api("logout", "POST", {}); me = null; boot(); } }, "Log out"))));
  }

  /* ---------- upload page ---------- */
  function uploadView() {
    let file = null;
    const err = h("p", { class: "err", role: "alert" });
    const input = h("input", { type: "file", accept: ".zip,application/zip", hidden: true });
    const name = h("input", { id: "n", placeholder: "my-awesome-package", maxlength: 32 });
    const ver = h("input", { id: "v", placeholder: "1.0.0", maxlength: 14 });
    const desc = h("textarea", { id: "d", placeholder: "What does your package do?", maxlength: 300, style: "font-family:var(--sans);white-space:pre-wrap;min-height:96px" });
    const lic = h("select", { id: "l" }, h("option", { value: "" }, "Select a license"), licenses.map(l => h("option", { value: l }, l)));
    const picked = h("div", { class: "picked" });
    const btn = h("button", { class: "btn", type: "submit" }, "Submit for Review");

    function setFile(f) {
      err.textContent = "";
      if (!f) return;
      if (!/\.zip$/i.test(f.name)) { err.textContent = "Only .zip files are supported."; return; }
      if (f.size > 1024 * 1024) { err.textContent = "The zip must be under 1 MB."; return; }
      file = f; picked.textContent = `${f.name} · ${kb(f.size)}`;
      if (!name.value) name.value = f.name.replace(/\.zip$/i, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
    }
    const drop = h("div", { class: "drop", tabindex: 0, role: "button", "aria-label": "Choose a zip file",
      onclick: () => input.click(), onkeydown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } },
      ondragover: e => { e.preventDefault(); drop.classList.add("over"); }, ondragleave: () => drop.classList.remove("over"),
      ondrop: e => { e.preventDefault(); drop.classList.remove("over"); setFile(e.dataTransfer.files[0]); } },
      h("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, h("path", { d: "M6 3h9l4 4v14H6z" })),
      h("div", { class: "big" }, "Drag and drop your package here"),
      h("div", {}, "or ", h("u", {}, "browse files")),
      h("small", {}, "Supported format: .zip"), picked);
    input.addEventListener("change", () => setFile(input.files[0]));

    const form = h("form", { class: "upl", onsubmit: async e => {
      e.preventDefault(); err.textContent = "";
      if (!file) { err.textContent = "Choose a .zip file first."; return; }
      btn.disabled = true; btn.textContent = "Uploading…";
      try {
        const zip = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = () => no(new Error("Could not read the file")); r.readAsDataURL(file); });
        await api("submissions", "POST", { name: name.value.trim(), version: ver.value.trim(), description: desc.value, license: lic.value, zip });
        notice = `"${name.value.trim()}" was uploaded and is waiting for review. It will appear in the registry once approved.`;
        go("#/");
      } catch (x) { err.textContent = x.message; btn.disabled = false; btn.textContent = "Submit for Review"; }
    } },
      drop, input,
      h("div", { class: "grid2" }, h("div", {}, h("label", { for: "n" }, "Package name ", h("span", { class: "req" }, "*")), name), h("div", {}, h("label", { for: "v" }, "Version ", h("span", { class: "req" }, "*")), ver)),
      h("label", { for: "d" }, "Description ", h("span", { class: "req" }, "*")), desc,
      h("label", { for: "l" }, "License ", h("span", { class: "req" }, "*")), lic,
      err,
      h("div", { class: "foot" }, h("span", { class: "note", style: "margin:0" }, "Every package is reviewed by hand before it is published."), h("div", { class: "row" }, btn, h("a", { href: "#/", class: "btn ghost" }, "Cancel"))));
    show(crumb({ t: "Packages", href: "#/" }, { t: "Upload" }), h("h1", { style: "font-size:clamp(34px,5vw,52px)" }, "Upload a ", h("span", { style: "color:var(--green)" }, "Package")),
      h("p", { class: "sub" }, "Publish your package to the Gaug package registry."), form);
  }

  /* ---------- file viewer (inert text) ---------- */
  function viewer(files, flagList = []) {
    const names = Object.keys(files).sort((a, b) => (a === "main.gaug" ? -1 : b === "main.gaug" ? 1 : a.localeCompare(b)));
    const pre = h("pre", { class: "view", tabindex: 0 });
    const list = h("div", { class: "fl" });
    let cur = null;
    function open(n, line) {
      cur = n;
      const fl = new Set(flagList.filter(f => f.file === n).map(f => f.line));
      pre.replaceChildren(...files[n].split("\n").map((t, i) => h("div", { class: "ln" + (fl.has(i + 1) ? " hit" : ""), id: `L${i + 1}` }, h("i", {}, i + 1), h("span", {}, t || " "))));
      list.querySelectorAll("button").forEach(b => b.setAttribute("aria-current", String(b.dataset.n === n)));
      if (line) pre.querySelector("#L" + line)?.scrollIntoView({ block: "center" });
    }
    list.append(...names.map(n => h("button", { type: "button", "data-n": n, onclick: () => open(n) }, n, flagList.some(f => f.file === n) ? h("span", { class: "dot" }, "●") : null)));
    open(names[0]);
    return { box: h("div", {}, list, pre), open };
  }

  /* ---------- admin review ---------- */
  async function reviewView(id) {
    const { submission: s } = await api("submissions/" + id);
    if (me.role !== "admin" || !s.files) return go("#/");
    const v = viewer(s.files, s.flagList);
    const err = h("p", { class: "err", role: "alert" });
    const reason = h("input", { placeholder: "Reason (optional, shown to the author)", maxlength: 200 });
    const decide = async (a, body) => { try { await api(`submissions/${id}/${a}`, "POST", body || {}); notice = `${s.name} ${s.version} ${a === "approve" ? "approved and published" : "rejected"}.`; go("#/"); } catch (x) { err.textContent = x.message; } };
    show(crumb({ t: "Packages", href: "#/" }, { t: "Review" }),
      h("h1", { style: "font-size:clamp(34px,5vw,52px)" }, s.name, " ", h("span", { style: "color:var(--green)" }, s.version)),
      h("p", { class: "sub" }, `${s.description} — by ${s.author} · ${s.license} · ${s.files ? Object.keys(s.files).length : 0} files`),
      h("div", { class: "card" }, h("h2", {}, "Code"), v.box),
      h("div", { class: "card" }, h("h2", {}, `Flagged lines (${s.flagList.length})`),
        s.flagList.length ? h("div", {}, s.flagList.map(f => h("div", { class: "pkg", onclick: () => v.open(f.file, f.line) }, h("div", {}, h("b", {}, `${f.file}:${f.line}`), h("small", {}, f.why))))) : empty("Nothing matched the watch-list. Still read the code."),
        h("p", { class: "note" }, "Flags are only hints. They never approve or block a package.")),
      h("div", { class: "card" }, reason, err, h("div", { class: "row" },
        h("button", { class: "btn", onclick: () => confirm(`Publish ${s.name} ${s.version}?`) && decide("approve") }, "Approve & publish"),
        h("button", { class: "btn danger", style: "height:44px", onclick: () => decide("reject", { reason: reason.value }) }, "Reject"),
        h("a", { class: "btn ghost", href: "#/" }, "Back"))));
  }

  /* ---------- published package ---------- */
  async function pkgView(name) {
    const { package: p } = await api("packages/" + encodeURIComponent(name));
    const v = viewer(p.files);
    const mine = me.role === "admin" || (await api("packages")).packages.some(x => x.name === p.name && x.mine);
    show(crumb({ t: "Packages", href: "#/" }, { t: p.name }),
      h("h1", { style: "font-size:clamp(34px,5vw,52px)" }, p.name, " ", h("span", { style: "color:var(--green)" }, p.version)),
      h("p", { class: "sub" }, `${p.description} — by ${p.author} · ${p.license || "no license"}`),
      h("div", { class: "card" }, v.box),
      mine && h("button", { class: "btn danger", onclick: async () => { if (confirm(`Delete ${p.name}?`)) { await api("packages/" + encodeURIComponent(p.name), "DELETE"); go("#/"); } } }, "Delete package"));
  }

  /* ---------- router ---------- */
  async function render() {
    if (!me) return;
    const [, a, b] = location.hash.split("/");
    try {
      if (a === "upload") return uploadView();
      if (a === "review" && b) return await reviewView(b);
      if (a === "pkg" && b) return await pkgView(decodeURIComponent(b));
      if ((a === "queue" || a === "all" || a === "controls") && me.role !== "admin") return await overviewView();
      return await ({ mine: mineView, submissions: subsView, queue: queueView, all: allView, controls: controlsView, settings: settingsView }[a] || overviewView)();
    } catch (x) { show(h("p", { class: "err" }, x.message), h("a", { href: "#/", class: "btn ghost" }, "Back")); }
  }
  async function boot() {
    const d = await api("me");
    me = d.user; if (me) { me.bio = d.bio || ""; me.avatar = d.avatar || 0; } licenses = d.licenses || [];
    if (!me) return authView(d.registration);
    render();
  }
  window.addEventListener("hashchange", render);
  boot().catch(x => show(h("p", { class: "err" }, x.message)));
})();