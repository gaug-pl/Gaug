// (function () {
//   const g = typeof window !== "undefined" ? window : globalThis;
//   const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
//   const slug = t => t.toLowerCase().replace(/<[^>]*>/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

//   /* ---------- Gaug syntax highlighter (tmLanguage-style scopes) ---------- */
//   const RULES = [
//     ["c", /\/\/[^\n]*/y],
//     ["t", /"(?:[^"\\\n]|\\.)*"?/y],
//     ["n", /\b\d+(?:\.\d+)?\b/y],
//     ["k", /\b(?:if|elseif|else|for|in|return|async)\b/y],
//     ["s", /\b(?:const|var)\b/y],
//     ["f", /\b(?:math|list|gc|http|file|hash|gaug)(?=\.)|(?<=\.)[A-Za-z_]\w*(?=\()|[A-Za-z_]\w*(?=\()/y],
//     ["y", /\b(?:number|string|list|null)\b/y],
//     ["o", />>>|->|\+=|==|!=|<=|>=|[-+*\/%<>=!]/y],
//     ["v", /[A-Za-z_]\w*/y]
//   ];
//   function highlight(src) {
//     let i = 0, out = "";
//     while (i < src.length) {
//       let hit = false;
//       for (const [cls, re] of RULES) {
//         re.lastIndex = i;
//         const m = re.exec(src);
//         if (m && m[0].length) { out += `<span class="${cls}">${esc(m[0])}</span>`; i += m[0].length; hit = true; break; }
//       }
//       if (!hit) { out += esc(src[i]); i++; }
//     }
//     return out;
//   }

//   /* ---------- Markdown renderer ---------- */
//   function md(src, resolve) {
//     resolve = resolve || (h => h);
//     src = src.replace(/\r/g, "").replace(/^---\n[\s\S]*?\n---\n?/, "");
//     const isList = l => /^\s*([-*+]|\d+\.)\s+/.test(l);
//     const row = s => s.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());

//     const inline = s => {
//       const codes = [];
//       s = s.replace(/`([^`]+)`/g, (_, c) => "\u0000" + (codes.push(c) - 1) + "\u0000");
//       s = esc(s);
//       s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2">');
//       s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => {
//         const ext = /^https?:/.test(h);
//         return `<a href="${resolve(h).replace(/"/g, "&quot;")}"${ext ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`;
//       });
//       s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
//            .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>");
//       return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
//     };

//     const list = lines => {
//       const base = lines[0].match(/^\s*/)[0].length, tag = /^\s*\d/.test(lines[0]) ? "ol" : "ul", items = [];
//       for (const ln of lines) {
//         const ind = ln.match(/^\s*/)[0].length;
//         if (ind <= base && isList(ln)) items.push({ t: ln.replace(/^\s*([-*+]|\d+\.)\s+/, ""), sub: [] });
//         else if (!items.length) continue;
//         else if (isList(ln) || items[items.length - 1].sub.length) items[items.length - 1].sub.push(ln);
//         else items[items.length - 1].t += " " + ln.trim();
//       }
//       return `<${tag}>` + items.map(it => {
//         const sub = it.sub.filter(x => x.trim());
//         return `<li>${inline(it.t)}${sub.length && isList(sub[0]) ? list(sub) : ""}</li>`;
//       }).join("") + `</${tag}>`;
//     };

//     const starts = l => /^(```|#{1,4}\s|>|:::|\s*([-*+]|\d+\.)\s|(-{3,}|\*{3,})\s*$)/.test(l);

//     // ::: function name  ->  signature card with parameters, return value and description
//     const typeHtml = t => t.split("|").map(x => `<span class="y">${esc(x.trim() || "any")}</span>`).join(' <span class="o">|</span> ');
//     const PARAM = /^param\s+(\.\.\.)?([A-Za-z_]\w*)(\?)?(?:\s*:\s*([^-]+?))?(?:\s+-\s+(.*))?$/;
//     const RET = /^returns?\s+([^-]+?)(?:\s+-\s+(.*))?$/;
//     const fnBlock = (name, body) => {
//       const params = [], desc = [];
//       let ret = null, fence = false, m;
//       for (const ln of body.split("\n")) {
//         const t = ln.trim();
//         if (/^```/.test(t)) fence = !fence;
//         if (!fence && (m = t.match(PARAM))) params.push({ name: m[2], rest: !!m[1], opt: !!m[3], type: (m[4] || "any").trim(), desc: m[5] || "" });
//         else if (!fence && (m = t.match(RET))) ret = { type: m[1].trim(), desc: m[2] || "" };
//         else desc.push(ln);
//       }
//       const rtype = ret ? ret.type : "null";
//       const sig = `<span class="f">${esc(name)}</span>(` +
//         params.map(p => `${p.rest ? "..." : ""}<span class="v">${esc(p.name)}</span>${p.opt ? "?" : ""}: ${typeHtml(p.type)}`).join(", ") +
//         `) <span class="o">&gt;&gt;&gt;</span> ${typeHtml(rtype)}`;
//       const id = "fn-" + name.toLowerCase().replace(/[^\w]+/g, "-");
//       const d = blocks(desc.join("\n"));
//       const items = params.map(p =>
//         `<li><code>${p.rest ? "..." : ""}${esc(p.name)}${p.opt ? "?" : ""}</code> ${typeHtml(p.type)}${p.desc ? " &mdash; " + inline(p.desc) : ""}</li>`).join("");
//       const psec = params.length ? `<div class="fn-h">Parameters</div><ul class="fn-list">${items}</ul>` : "";
//       const rsec = `<div class="fn-h">Returns</div><p class="fn-ret">${typeHtml(rtype)}${ret && ret.desc ? " &mdash; " + inline(ret.desc) : ""}</p>`;
//       return `<section class="fn" id="${id}"><div class="fn-sig">${sig}</div>${d}${psec}${rsec}</section>`;
//     };

//     const blocks = text => {
//       const L = text.split("\n"), out = [];
//       let i = 0, m;
//       while (i < L.length) {
//         const l = L[i];
//         if (!l.trim()) { i++; continue; }
//         if ((m = l.match(/^```\s*([\w-]*)/))) {
//           const b = []; i++;
//           while (i < L.length && !/^```/.test(L[i])) b.push(L[i++]);
//           i++;
//           const c = b.join("\n");
//           out.push(`<div class="cbw"><button class="copy" type="button" aria-label="Copy code">Copy</button><pre class="cb"><code>${m[1] === "gaug" ? highlight(c) : esc(c)}</code></pre></div>`);
//           continue;
//         }
//         if ((m = l.match(/^:::\s*(\w+)\s*(.*)$/))) {
//           if (m[1] === "download") {
//             const [href, ...rest] = m[2].trim().split(/\s+/);
//             out.push(`<p><a class="dl" href="${esc(href)}" download>${esc(rest.join(" ") || href.split("/").pop())}</a></p>`);
//             i++; continue;
//           }
//           const b = []; i++;
//           while (i < L.length && !/^:::\s*$/.test(L[i])) b.push(L[i++]);
//           i++;
//           if (m[1] === "function" || m[1] === "fn") { out.push(fnBlock(m[2].trim(), b.join("\n"))); continue; }
//           const title = m[2] || m[1][0].toUpperCase() + m[1].slice(1);
//           out.push(`<div class="callout ${m[1]}"><p class="ct">${esc(title)}</p>${blocks(b.join("\n"))}</div>`);
//           continue;
//         }
//         if ((m = l.match(/^(#{1,4})\s+(.*?)\s*#*\s*$/))) {
//           out.push(`<h${m[1].length} id="${slug(m[2])}">${inline(m[2])}</h${m[1].length}>`);
//           i++; continue;
//         }
//         if (/^(-{3,}|\*{3,})\s*$/.test(l)) { out.push("<hr>"); i++; continue; }
//         if (/^>/.test(l)) {
//           const b = [];
//           while (i < L.length && /^>/.test(L[i])) b.push(L[i++].replace(/^>\s?/, ""));
//           out.push(`<blockquote>${blocks(b.join("\n"))}</blockquote>`);
//           continue;
//         }
//         if (l.includes("|") && i + 1 < L.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(L[i + 1])) {
//           const h = row(l), rows = [];
//           i += 2;
//           while (i < L.length && L[i].trim() && L[i].includes("|")) rows.push(row(L[i++]));
//           out.push(`<table><thead><tr>${h.map(c => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
//             rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") + `</tbody></table>`);
//           continue;
//         }
//         if (isList(l)) {
//           const b = [], base = l.match(/^\s*/)[0].length, kind = x => /^\s*\d/.test(x);
//           const same = x => isList(x) && (x.match(/^\s*/)[0].length > base || kind(x) === kind(l));
//           while (i < L.length && (same(L[i]) || (L[i].trim() && !isList(L[i]) && /^\s{2,}/.test(L[i])) || (!L[i].trim() && i + 1 < L.length && same(L[i + 1])))) b.push(L[i++]);
//           out.push(list(b));
//           continue;
//         }
//         const b = [];
//         while (i < L.length && L[i].trim() && !(b.length && starts(L[i]))) b.push(L[i++].trim());
//         out.push(`<p>${inline(b.join(" "))}</p>`);
//       }
//       return out.join("\n");
//     };
//     return blocks(src);
//   }

//   // JSON parser that tolerates trailing commas (outside of strings)
//   const lenient = t => JSON.parse(t.replace(/("(?:[^"\\]|\\.)*")|,(\s*[}\]])/g, (m, str, close) => str || close));

//   /* ---------- documentation.json loader ---------- */
//   let docsP;
//   function loadDocs() {
//     return docsP || (docsP = fetch("documentation.json", { cache: "no-cache" })
//       .then(r => { if (!r.ok) throw new Error("documentation.json: HTTP " + r.status); return r.text(); })
//       // tolerate trailing commas (outside of strings) before parsing
//       .then(lenient)
//       .then(d => {
//         d.flat = [];
//         for (const grp of d.sidebar) for (const it of grp.items) d.flat.push({ ...it, group: grp.text, key: it.link.replace(/^\//, "") });
//         d.first = d.flat[0];
//         return d;
//       }));
//   }

//   g.Gaug = { esc, slug, highlight, md, loadDocs, lenient };
//   if (typeof document === "undefined") return;

//   /* ---------- shared nav behavior ---------- */
//   const $ = id => document.getElementById(id);
//   const root = document.documentElement;
//   const label = $("themeLabel"), menu = $("menu"), btn = $("themeBtn");

//   function setTheme(t) {
//     root.dataset.theme = t === "light" ? "light" : "dark";
//     label.textContent = t[0].toUpperCase() + t.slice(1);
//     menu.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", String(b.dataset.t === t)));
//     try { localStorage.setItem("gaug-theme", t); } catch (e) {}
//   }
//   let saved = "auto";
//   try { saved = localStorage.getItem("gaug-theme") || "auto"; } catch (e) {}
//   setTheme(saved);
//   btn.addEventListener("click", e => { e.stopPropagation(); menu.classList.toggle("open"); });
//   menu.addEventListener("click", e => { const b = e.target.closest("button"); if (b) setTheme(b.dataset.t); });

//   // copy button on code blocks
//   document.addEventListener("click", e => {
//     const b = e.target.closest(".copy");
//     if (!b) return;
//     const text = b.parentElement.querySelector("pre code").textContent;
//     const done = () => { b.textContent = "Copied"; b.classList.add("ok"); setTimeout(() => { b.textContent = "Copy"; b.classList.remove("ok"); }, 1500); };
//     const fallback = () => {
//       const t = document.createElement("textarea");
//       t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
//       document.body.appendChild(t); t.select();
//       try { document.execCommand("copy"); done(); } catch (err) {}
//       t.remove();
//     };
//     if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
//     else fallback();
//   });

//   // links that should open the first documentation page
//   const docLinks = document.querySelectorAll("[data-docs]");
//   if (docLinks.length) loadDocs().then(d => docLinks.forEach(a => a.href = "docs.html#" + d.first.link)).catch(() => {});

//   // search across titles and page contents
//   const q = $("q"), res = $("results");
//   let index = null, hits = [], sel = -1;
//   async function build() {
//     if (index) return index;
//     const d = await loadDocs();
//     index = await Promise.all(d.flat.map(async it => {
//       let text = "";
//       try { const r = await fetch("docs/" + encodeURI(it.file), { cache: "no-cache" }); if (r.ok) text = await r.text(); } catch (e) {}
//       return { it, plain: text.replace(/^---\n[\s\S]*?\n---\n?/, "").replace(/[#>*`|:]/g, " ").replace(/\s+/g, " ").trim() };
//     }));
//     return index;
//   }
//   function paint() {
//     res.innerHTML = hits.length
//       ? hits.map((h, n) => `<a class="res${n === sel ? " sel" : ""}" href="docs.html#${h.it.link}"><b>${esc(h.it.text)}</b><small>${esc(h.snip || h.it.group)}</small></a>`).join("")
//       : `<div class="none">No results</div>`;
//     res.classList.add("open");
//   }
//   async function run() {
//     const term = q.value.trim().toLowerCase();
//     if (!term) { res.classList.remove("open"); return; }
//     const idx = await build();
//     if (q.value.trim().toLowerCase() !== term) return;
//     hits = idx.map(({ it, plain }) => {
//       const t = it.text.toLowerCase(), p = plain.toLowerCase().indexOf(term);
//       const score = (t.includes(term) ? (t.startsWith(term) ? 15 : 10) : 0) + (p >= 0 ? 1 : 0);
//       return { it, score, snip: p >= 0 ? (p > 40 ? "…" : "") + plain.slice(Math.max(0, p - 40), p + 90) : "" };
//     }).filter(h => h.score).sort((a, b) => b.score - a.score).slice(0, 8);
//     sel = hits.length ? 0 : -1;
//     paint();
//   }
//   q.addEventListener("input", run);
//   q.addEventListener("focus", () => { if (q.value.trim()) run(); else build().catch(() => {}); });
//   q.addEventListener("keydown", e => {
//     if (e.key === "ArrowDown" || e.key === "ArrowUp") {
//       if (!hits.length) return;
//       e.preventDefault();
//       sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % hits.length;
//       paint();
//     } else if (e.key === "Enter" && hits[Math.max(sel, 0)]) {
//       location.href = "docs.html#" + hits[Math.max(sel, 0)].it.link;
//       res.classList.remove("open");
//       q.blur();
//     } else if (e.key === "Escape") { res.classList.remove("open"); q.blur(); }
//   });
//   res.addEventListener("click", () => { res.classList.remove("open"); q.value = ""; });
//   document.addEventListener("click", e => {
//     menu.classList.remove("open");
//     if (!e.target.closest(".search")) res.classList.remove("open");
//   });
//   document.addEventListener("keydown", e => {
//     if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); q.focus(); q.select(); }
//   });
// })();

(function () {
  const g = typeof window !== "undefined" ? window : globalThis;
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const slug = t => t.toLowerCase().replace(/<[^>]*>/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

  /* ---------- Gaug syntax highlighter (driven by gaug.tmLanguage.json) ---------- */
  // Edit gaug.tmLanguage.json to change what gets highlighted. Scope names map to the site's token classes by prefix.
  const GRAMMAR_URL = "gaug.tmLanguage.json";
  const SCOPE_CLASS = [
    ["comment", "c"], ["string", "t"], ["constant", "n"], ["keyword.operator", "o"], ["keyword", "k"],
    ["storage", "s"], ["entity.name.function", "f"], ["support.function", "f"], ["support.type", "y"], ["variable", "v"]
  ];
  const classOf = scope => { for (const [p, c] of SCOPE_CLASS) if (scope === p || scope.startsWith(p + ".")) return c; return ""; };
  let RULES = [];
  function compileGrammar(gr) {
    const rules = [], repo = gr.repository || {};
    const add = (r, p) => { try { rules.push(r); } catch (e) { console.warn("gaug grammar: bad pattern", p, e.message); } };
    const walk = (list, depth) => {
      if (depth > 8) return;
      for (const p of list || []) {
        try {
          if (p.include) { const e = repo[String(p.include).replace(/^#/, "")]; if (e) walk([e], depth + 1); }
          else if (p.patterns && !p.match && !p.begin) walk(p.patterns, depth + 1);
          else if (p.match) add({ cls: classOf(p.name || ""), caps: p.captures, re: new RegExp(p.match, p.captures ? "yd" : "y") }, p.match);
          else if (p.begin && p.end) add({ cls: classOf(p.name || ""), re: new RegExp(p.begin + "[\\s\\S]*?(?:" + p.end + "|$)", "y") }, p.begin);
        } catch (e) { console.warn("gaug grammar: bad pattern", p.match || p.begin, e.message); }
      }
    };
    walk(gr.patterns, 0);
    return rules;
  }
  const span = (cls, s) => cls ? `<span class="${cls}">${esc(s)}</span>` : esc(s);
  function highlight(src) {
    let i = 0, out = "";
    while (i < src.length) {
      let hit = false;
      for (const r of RULES) {
        r.re.lastIndex = i;
        const m = r.re.exec(src);
        if (!m || !m[0].length) continue;
        const end = i + m[0].length;
        if (r.caps && m.indices) {            // per-group scopes from "captures"
          let pos = i;
          const gs = Object.keys(r.caps).map(Number).filter(n => m.indices[n]).sort((x, y) => m.indices[x][0] - m.indices[y][0]);
          for (const n of gs) {
            const [gs0, ge] = m.indices[n];
            if (gs0 < pos) continue;
            out += span(r.cls, src.slice(pos, gs0)) + span(classOf((r.caps[n] || {}).name || ""), src.slice(gs0, ge));
            pos = ge;
          }
          out += span(r.cls, src.slice(pos, end));
        } else out += span(r.cls, m[0]);
        i = end; hit = true; break;
      }
      if (!hit) { out += esc(src[i]); i++; }
    }
    return out;
  }
  let grammarP;
  function loadGrammar() {
    return grammarP || (grammarP = fetch(GRAMMAR_URL, { cache: "no-cache" })
      .then(r => { if (!r.ok) throw new Error(GRAMMAR_URL + ": HTTP " + r.status); return r.text(); })
      .then(lenient)
      .then(gr => { RULES = compileGrammar(gr); return RULES; })
      .catch(e => { grammarP = null; throw e; }));
  }

  /* ---------- Markdown renderer ---------- */
  /* ---------- chart styles (injected on first use; follow the site's dark/light tokens) ---------- */
  const CHART_CSS = `
:root{--c1f:#8ae234;--c1s:#4e9a06;--c2f:#729fcf;--c2s:#204a87;--c3f:#fcaf3e;--c3s:#f57900;--c4f:#ef2929;--c4s:#cc0000}
.ch{margin:0 0 24px}
.ch-load{color:var(--muted);font-size:14px;margin:0}
.ch-title{font-weight:800;font-size:15px;color:var(--fg);margin:0 0 14px}
.ch .ch1{background:var(--c1f);border-color:var(--c1s)}
.ch .ch2{background:var(--c2f);border-color:var(--c2s)}
.ch .ch3{background:var(--c3f);border-color:var(--c3s)}
.ch .ch4{background:var(--c4f);border-color:var(--c4s)}
.ch-plot{position:relative;padding-top:24px}
.ch-grid{position:absolute;left:0;right:0;top:24px;height:220px;border-top:1px solid var(--line);background:linear-gradient(to top,var(--line) 1px,transparent 1px) left bottom/100% 25%}
.ch-bars{position:relative;display:flex;gap:18px}
.ch-col{flex:1;min-width:0}
.ch-group{height:220px;display:flex;align-items:flex-end;gap:5px;border-bottom:2px solid var(--muted)}
.ch-bar{position:relative;flex:1;min-width:6px;max-width:72px;margin:0 auto;min-height:2px;border:2px solid;border-bottom:0;border-radius:3px 3px 0 0;box-sizing:border-box}
.ch-multi .ch-group{justify-content:center}
.ch-multi .ch-bar{margin:0}
.ch-val{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);padding-bottom:3px;font-size:12px;color:var(--muted);white-space:nowrap}
.ch-nov .ch-bars .ch-val{display:none}
.ch-lab{margin-top:8px;font-size:13px;text-align:center;color:var(--body);overflow-wrap:anywhere}
.ch-legend{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:14px;font-size:13px;color:var(--body)}
.ch-legend span{display:inline-flex;align-items:center;gap:7px}
.ch-sw{width:12px;height:12px;border:2px solid;border-radius:2px;box-sizing:border-box;display:inline-block}
.ch-hrow{display:grid;grid-template-columns:minmax(80px,28%) minmax(0,1fr);gap:14px;align-items:center;margin:0 0 12px}
.ch-hrow .ch-lab{margin:0;text-align:right}
.ch-htrack{display:grid;grid-template-columns:minmax(0,1fr) 84px;gap:10px;align-items:center;margin:3px 0}
.ch-hbar{height:20px;min-width:2px;border:2px solid;border-left-width:0;border-radius:0 3px 3px 0;box-sizing:border-box}
.ch-hrow .ch-val{position:static;transform:none;padding:0;font-size:13px}
.ch-scroll{overflow-x:auto}
.ch-svg{display:block;width:100%;min-width:480px;height:auto}
.ch-svg text{fill:var(--muted);font:12px var(--sans)}
.ch-svg .gl{stroke:var(--line);stroke-width:1}
.ch-svg .ln{fill:none;stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}
.ch-svg .pt{stroke-width:2}
.ch-svg .ln.ch1{stroke:var(--c1f)}.ch-svg .ln.ch2{stroke:var(--c2f)}.ch-svg .ln.ch3{stroke:var(--c3f)}.ch-svg .ln.ch4{stroke:var(--c4f)}
.ch-svg .pt.ch1{fill:var(--c1f);stroke:var(--c1s)}.ch-svg .pt.ch2{fill:var(--c2f);stroke:var(--c2s)}.ch-svg .pt.ch3{fill:var(--c3f);stroke:var(--c3s)}.ch-svg .pt.ch4{fill:var(--c4f);stroke:var(--c4s)}
:root[data-theme="light"] .ch-svg .ln.ch1{stroke:var(--c1s)}:root[data-theme="light"] .ch-svg .ln.ch2{stroke:var(--c2s)}:root[data-theme="light"] .ch-svg .ln.ch3{stroke:var(--c3s)}:root[data-theme="light"] .ch-svg .ln.ch4{stroke:var(--c4s)}
`;
  function ensureChartCss() {
    if (typeof document === "undefined" || document.getElementById("gaug-chart-css")) return;
    const st = document.createElement("style");
    st.id = "gaug-chart-css"; st.textContent = CHART_CSS;
    document.head.appendChild(st);
  }

  /* ---------- charts + CSV ---------- */
  const fmtN = n => String(+n.toFixed(2));
  const niceMax = v => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };

  // c = { kind: bar|hbar|line, title, unit, maxOpt, log, names[], rows: [{ label, vals[] }] }
  function renderChart(c) {
    const { kind, title, rows } = c, unit = c.unit || "", names = c.names || [];
    if (!rows.length) throw new Error("No data rows to draw.");
    const ns = Math.max(...rows.map(r => r.vals.length)), multi = ns > 1;
    // highlighted series (or category, when there is only one series) always gets the brand green
    const hlName = (c.highlight || "").toLowerCase();
    const hl = !hlName ? -1 : multi ? names.findIndex(n => n.toLowerCase() === hlName) : rows.findIndex(r => r.label.toLowerCase() === hlName);
    const colorOf = (si, ri) => {
      const k = multi ? si : ri;
      if (hl < 0) return 1 + (k % 4);
      return k === hl ? 1 : 2 + ((k > hl ? k - 1 : k) % 3);
    };
    const all = rows.flatMap(r => r.vals).filter(Number.isFinite);
    const val = n => fmtN(n) + (unit ? (unit === "\u00d7" ? "" : " ") + esc(unit) : "");
    const tip = (r, v, si) => `${esc(r.label)}${multi ? " - " + esc(names[si] || "Series " + (si + 1)) : ""}: ${val(v)}`;
    const log = !!c.log && kind !== "line";
    const pos = all.filter(v => v > 0);
    let lo = 0, hi = c.maxOpt != null ? c.maxOpt : niceMax(Math.max(...all, 0)), decades = 4;
    if (log && pos.length) {
      lo = Math.pow(10, Math.floor(Math.log10(Math.min(...pos))) - 1);
      hi = Math.pow(10, Math.ceil(Math.log10(Math.max(...pos))));
      if (hi <= lo) hi = lo * 10;
      decades = Math.max(1, Math.round(Math.log10(hi / lo)));
    }
    const frac = v => !(v > 0) ? 0 : log && pos.length
      ? Math.max(0, Math.min(1, (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))))
      : Math.min(1, v / hi);
    let plot;
    if (kind === "bar") {
      plot = `<div class="ch-plot"><div class="ch-grid" style="background-size:100% ${(100 / decades).toFixed(3)}%"></div><div class="ch-bars">` + rows.map((r, ri) =>
        `<div class="ch-col"><div class="ch-group">` + r.vals.map((v, si) =>
          `<div class="ch-bar ch${colorOf(si, ri)}" style="height:${(frac(v) * 100).toFixed(2)}%" title="${tip(r, v, si)}"><span class="ch-val">${val(v)}</span></div>`).join("") +
        `</div><div class="ch-lab">${esc(r.label)}</div></div>`).join("") + `</div></div>`;
    } else if (kind === "hbar") {
      plot = rows.map((r, ri) => `<div class="ch-hrow"><div class="ch-lab">${esc(r.label)}</div><div>` + r.vals.map((v, si) =>
        `<div class="ch-htrack"><div><div class="ch-hbar ch${colorOf(si, ri)}" style="width:${(frac(v) * 100).toFixed(2)}%" title="${tip(r, v, si)}"></div></div><span class="ch-val">${val(v)}</span></div>`).join("") + `</div></div>`).join("");
    } else {
      const W = 600, H = 280, L = 48, R = 16, T = 16, B = 36;
      const mn = Math.min(0, ...all), ymin = mn < 0 ? -niceMax(-mn) : 0, ymax = c.maxOpt != null ? c.maxOpt : niceMax(Math.max(...all, 0));
      const X = i => rows.length === 1 ? (L + W - R) / 2 : L + (W - L - R) * i / (rows.length - 1);
      const Y = v => T + (H - T - B) * (1 - (v - ymin) / ((ymax - ymin) || 1));
      let svg = "";
      for (let k = 0; k <= 4; k++) {
        const v = ymin + (ymax - ymin) * k / 4, y = Y(v).toFixed(1);
        svg += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text x="${L - 8}" y="${(+y + 4).toFixed(1)}" text-anchor="end">${fmtN(v)}</text>`;
      }
      rows.forEach((r, i) => { svg += `<text x="${X(i).toFixed(1)}" y="${H - 12}" text-anchor="middle">${esc(r.label)}</text>`; });
      for (let si = 0; si < ns; si++) {
        const pts = rows.map((r, i) => Number.isFinite(r.vals[si]) ? [X(i), Y(r.vals[si]), r, r.vals[si]] : null).filter(Boolean);
        const k = colorOf(si, 0);
        if (pts.length > 1) svg += `<polyline class="ln ch${k}" points="${pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")}"/>`;
        svg += pts.map(p => `<circle class="pt ch${k}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5"><title>${tip(p[2], p[3], si)}</title></circle>`).join("");
      }
      plot = `<div class="ch-scroll"><svg class="ch-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title || "Line chart")}">${svg}</svg></div>`;
    }
    const notes = [...(c.notes || []), ...(log ? ["Logarithmic scale"] : [])];
    const legend = (multi || notes.length) ? `<div class="ch-legend">` +
      (multi ? Array.from({ length: ns }, (_, i) => `<span><i class="ch-sw ch${colorOf(i, 0)}"></i>${esc(names[i] || "Series " + (i + 1))}</span>`).join("") : "") +
      notes.map(n => `<span>${esc(n)}</span>`).join("") + `</div>` : "";
    const cls = "ch ch-k-" + kind + (multi ? " ch-multi" : "") + (kind === "bar" && rows.length * ns > 12 ? " ch-nov" : "");
    return `<figure class="${cls}" aria-label="${esc(title || "Chart")}">${title ? `<figcaption class="ch-title">${esc(title)}</figcaption>` : ""}${plot}${legend}</figure>`;
  }

  // CSV text -> array of rows (handles "quoted, fields", "" escapes, CRLF)
  function parseCSV(text) {
    const rows = []; let row = [], f = "", q = false;
    text = text.replace(/^\uFEFF/, "");
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { row.push(f); f = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(f); f = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else f += ch;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function csvPrep(spec, text) {
    const t = parseCSV(text);
    if (!t.length) throw new Error("The CSV file is empty.");
    const head = t[0].map(h => h.trim());
    const col = n => {
      const i = head.findIndex(h => h.toLowerCase() === String(n).trim().toLowerCase());
      if (i < 0) throw new Error(`No column "${n}". Columns are: ${head.join(", ")}`);
      return i;
    };
    let data = t.slice(1);
    for (const w of spec.where || []) {
      const i = col(w.col), set = w.vals.map(v => v.toLowerCase());
      data = data.filter(r => set.includes((r[i] || "").trim().toLowerCase()) !== w.neg);
    }
    return { head, data, col };
  }
  // "MedianMs" -> ms, "SizeMB" -> MB, "time_s" -> s ...
  const unitOf = h => {
    const m = h.match(/[a-z](Ms|Us|Ns|Sec|Secs|MB|KB|GB|Bytes)$/) || h.match(/[_\s(](ms|us|ns|sec|secs|mb|kb|gb|bytes)\)?$/i);
    if (!m) return "";
    const u = m[1].toLowerCase();
    return ({ mb: "MB", kb: "KB", gb: "GB", sec: "s", secs: "s" })[u] || u;
  };
  // Works out sensible defaults when the CSV gives no hints:
  //   x = first column; if another text column repeats it becomes the series ("long" format),
  //   otherwise every number column is a series ("wide" format).
  //   The value column prefers Median, then Mean/Avg, and skips counts like Runs.
  function chartFromCSV(spec, text) {
    const { head, data, col } = csvPrep(spec, text);
    const cell = (r, i) => (r[i] || "").trim();
    const isNum = i => data.some(r => cell(r, i) !== "") && data.every(r => cell(r, i) === "" || Number.isFinite(+cell(r, i)));
    const xi = spec.x ? col(spec.x) : 0;
    const ys = spec.y && spec.y.length ? spec.y.map(col) : null;
    let si = spec.series ? col(spec.series) : -1;
    if (si < 0 && !(ys && ys.length > 1)) {
      const c = head.map((_, i) => i).find(i => i !== xi && !isNum(i));
      if (c !== undefined && new Set(data.map(r => cell(r, c))).size < data.length) si = c;
    }
    const rows = []; let names = [], yi = [];
    if (si >= 0) {
      const pool = head.map((_, i) => i).filter(i => i !== xi && i !== si && isNum(i));
      const v = ys ? ys[0] : (pool.find(i => /median/i.test(head[i])) ?? pool.find(i => /mean|avg|average/i.test(head[i])) ??
        pool.find(i => !/^(runs?|count|n|iterations?|samples?|id|index)$/i.test(head[i])) ?? pool[0]);
      if (v === undefined) throw new Error("No number column to plot. Add a line like: y ColumnName");
      yi = [v];
      const sers = [], cats = new Map();
      for (const r of data) { const k = cell(r, si); if (!sers.includes(k)) sers.push(k); }
      for (const r of data) {
        const c = cell(r, xi);
        if (!cats.has(c)) cats.set(c, []);
        cats.get(c)[sers.indexOf(cell(r, si))] = parseFloat(r[v]);
      }
      names = sers;
      for (const [label, vals] of cats) rows.push({ label, vals: sers.map((_, k) => Number.isFinite(vals[k]) ? vals[k] : 0) });
    } else {
      yi = ys || head.map((_, i) => i).filter(i => i !== xi && isNum(i));
      if (!yi.length) throw new Error("No number columns to plot. Add a line like: y ColumnName");
      names = yi.map(i => head[i]);
      for (const r of data) rows.push({ label: cell(r, xi), vals: yi.map(i => parseFloat(r[i]) || 0) });
    }
    const units = [...new Set(yi.map(i => unitOf(head[i])))];
    let unit = spec.unit || (units.length === 1 ? units[0] : "");
    const notes = [];
    if (spec.relative) {                       // every value divided by the baseline's value in the same group
      const bi = names.findIndex(n => n.toLowerCase() === spec.relative.toLowerCase());
      if (bi < 0) throw new Error(`No "${spec.relative}" to compare against. Available: ${names.join(", ")}`);
      for (const r of rows) { const base = r.vals[bi]; r.vals = r.vals.map(v => base > 0 ? v / base : 0); }
      unit = "\u00d7"; notes.push(`Relative to ${names[bi]} (1\u00d7)`);
    }
    if (spec.speed) {                          // flip time into speed: higher = faster
      const k = spec.relative ? 1 : unit === "ms" ? 1000 : 1;
      for (const r of rows) r.vals = r.vals.map(v => v > 0 ? k / v : 0);
      unit = spec.relative ? "\u00d7" : unit === "ms" ? "runs/s" : unit ? "1/" + unit : "";
      notes.push("Higher is faster");
    } else if (spec.relative) notes.push("Lower is faster");
    const vals = rows.flatMap(r => r.vals), pos = vals.filter(v => v > 0);
    // a huge spread (100x or more) would hide the small bars, so switch to a log scale unless "linear" is set
    const autoLog = !spec.linear && spec.kind !== "line" && pos.length === vals.length && pos.length > 1 && Math.max(...pos) / Math.min(...pos) >= 100;
    return { kind: spec.kind, title: spec.title, unit, maxOpt: spec.maxOpt, log: !!spec.log || autoLog, names, rows, highlight: spec.highlight, notes };
  }
  function tableFromCSV(spec, text) {
    const { head, data, col } = csvPrep(spec, text);
    const idx = spec.columns && spec.columns.length ? spec.columns.map(col) : head.map((_, i) => i);
    const num = i => data.length && data.every(r => (r[i] || "").trim() === "" || Number.isFinite(+r[i]));
    const th = idx.map(i => `<th${num(i) ? ' style="text-align:right"' : ""}>${esc(head[i])}</th>`).join("");
    const tr = data.map(r => `<tr>${idx.map(i => `<td${num(i) ? ' style="text-align:right"' : ""}>${esc((r[i] || "").trim())}</td>`).join("")}</tr>`).join("");
    return `<figure class="ch">${spec.title ? `<figcaption class="ch-title">${esc(spec.title)}</figcaption>` : ""}<div class="ch-scroll"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div></figure>`;
  }

  // charts/tables that name a CSV file are drawn once the file has loaded
  const csvCache = new Map();
  function loadCSV(path) {
    if (!csvCache.has(path)) {
      csvCache.set(path, fetch(path, { cache: "no-cache" }).then(r => {
        if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
        return r.text();
      }).catch(e => { csvCache.delete(path); throw e; }));
    }
    return csvCache.get(path);
  }
  async function hydrate(root) {
    for (const el of root.querySelectorAll("[data-chart],[data-table]")) {
      const isChart = el.hasAttribute("data-chart");
      const raw = el.getAttribute(isChart ? "data-chart" : "data-table");
      if (raw === null) continue;                      // already claimed by another pass
      el.removeAttribute("data-chart"); el.removeAttribute("data-table");
      try {
        const spec = JSON.parse(raw), text = await loadCSV(spec.csv);
        el.outerHTML = isChart ? renderChart(chartFromCSV(spec, text)) : tableFromCSV(spec, text);
      } catch (e) {
        el.innerHTML = `<div class="callout danger"><p class="ct">Could not draw this from the CSV</p><p>${esc(e.message)}</p></div>`;
      }
    }
  }

  function md(src, resolve) {
    resolve = resolve || (h => h);
    src = src.replace(/\r/g, "").replace(/^---\n[\s\S]*?\n---\n?/, "");
    const isList = l => /^\s*([-*+]|\d+\.)\s+/.test(l);
    const row = s => s.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());

    const inline = s => {
      const codes = [];
      s = s.replace(/`([^`]+)`/g, (_, c) => "\u0000" + (codes.push(c) - 1) + "\u0000");
      s = esc(s);
      s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2">');
      s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => {
        const ext = /^https?:/.test(h);
        return `<a href="${resolve(h).replace(/"/g, "&quot;")}"${ext ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`;
      });
      s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
           .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>");
      return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
    };

    const list = lines => {
      const base = lines[0].match(/^\s*/)[0].length, tag = /^\s*\d/.test(lines[0]) ? "ol" : "ul", items = [];
      for (const ln of lines) {
        const ind = ln.match(/^\s*/)[0].length;
        if (ind <= base && isList(ln)) items.push({ t: ln.replace(/^\s*([-*+]|\d+\.)\s+/, ""), sub: [] });
        else if (!items.length) continue;
        else if (isList(ln) || items[items.length - 1].sub.length) items[items.length - 1].sub.push(ln);
        else items[items.length - 1].t += " " + ln.trim();
      }
      return `<${tag}>` + items.map(it => {
        const sub = it.sub.filter(x => x.trim());
        return `<li>${inline(it.t)}${sub.length && isList(sub[0]) ? list(sub) : ""}</li>`;
      }).join("") + `</${tag}>`;
    };

    const starts = l => /^(```|#{1,4}\s|>|:::|\s*([-*+]|\d+\.)\s|(-{3,}|\*{3,})\s*$)/.test(l);

    // ::: function name  ->  signature card with parameters, return value and description
    const typeHtml = t => t.split(/\||\s+or\s+/).map(x => `<span class="y">${esc(x.trim() || "any")}</span>`).join(' <span class="o">|</span> ');
    const PARAM = /^param\s+(\.\.\.)?([A-Za-z_]\w*)(\?)?(?:\s*:\s*([^-=]+?))?(?:\s*=\s*(.+?))?(?:\s+-\s+(.*))?$/;
    const RET = /^returns?\s+([^-]+?)(?:\s+-\s+(.*))?$/;
    // "version 1.2" inside a ::: fn or ::: const block = the first Gaug version that has it
    const VER_LINE = /^version\s+v?(\d+(?:\.\d+){0,2})\s*$/i;
    const verBadge = v => v ? `<span class="fn-ver" title="Added in Gaug ${esc(v)}. Older versions don't have this.">Since ${esc(v)}</span>` : "";
    const fnBlock = (name, body) => {
      const params = [], desc = [];
      let ret = null, ver = null, fence = false, m;
      for (const ln of body.split("\n")) {
        const t = ln.trim();
        if (/^```/.test(t)) fence = !fence;
        if (!fence && (m = t.match(VER_LINE))) ver = m[1];
        else if (!fence && (m = t.match(PARAM))) params.push({ name: m[2], rest: !!m[1], opt: !!m[3] || m[5] !== undefined, type: (m[4] || "any").trim(), def: m[5] ? m[5].trim() : "", desc: m[6] || "" });
        else if (!fence && (m = t.match(RET))) ret = { type: m[1].trim(), desc: m[2] || "" };
        else desc.push(ln);
      }
      const rtype = ret ? ret.type : "null";
      const sig = `<span class="f">${esc(name)}</span>(` +
        params.map(p => `${p.rest ? "..." : ""}<span class="v">${esc(p.name)}</span>${p.opt ? "?" : ""}: ${typeHtml(p.type)}${p.def ? ` <span class="o">=</span> ${highlight(p.def)}` : ""}`).join(", ") +
        `) <span class="o">&gt;&gt;&gt;</span> ${typeHtml(rtype)}`;
      const id = "fn-" + name.toLowerCase().replace(/[^\w]+/g, "-");
      const d = blocks(desc.join("\n"));
      const items = params.map(p =>
        `<li><code>${p.rest ? "..." : ""}${esc(p.name)}${p.opt ? "?" : ""}</code> ${typeHtml(p.type)}${p.opt ? ` <em>(optional${p.def ? `, default <code>${esc(p.def)}</code>` : ""})</em>` : ""}${p.desc ? " &mdash; " + inline(p.desc) : ""}</li>`).join("");
      const psec = params.length ? `<div class="fn-h">Parameters</div><ul class="fn-list">${items}</ul>` : "";
      const rsec = `<div class="fn-h">Returns</div><p class="fn-ret">${typeHtml(rtype)}${ret && ret.desc ? " &mdash; " + inline(ret.desc) : ""}</p>`;
      return `<section class="fn" id="${id}"${ver ? ` data-since="${esc(ver)}"` : ""}><div class="fn-sig">${verBadge(ver)}${sig}</div>${d}${psec}${rsec}</section>`;
    };

    // ::: const name  ->  constant card with type, value and description
    const TYPE_LINE = /^type\s+(.+)$/;
    const VALUE_LINE = /^value\s+(.+)$/;
    const constBlock = (name, body) => {
      const desc = [];
      let type = "any", value = null, ver = null, fence = false, m;
      for (const ln of body.split("\n")) {
        const t = ln.trim();
        if (/^```/.test(t)) fence = !fence;
        if (!fence && (m = t.match(VER_LINE))) ver = m[1];
        else if (!fence && (m = t.match(TYPE_LINE))) type = m[1].trim();
        else if (!fence && (m = t.match(VALUE_LINE))) value = m[1].trim();
        else desc.push(ln);
      }
      const sig = `<font color="#94c1ff">${esc(name)}</font><span class="o">:</span> ${typeHtml(type)}` +
  (value !== null ? ` <span class="o">=</span> ${highlight(value)}` : "");
      const id = "const-" + name.toLowerCase().replace(/[^\w]+/g, "-");
      return `<section class="fn" id="${id}"${ver ? ` data-since="${esc(ver)}"` : ""}><div class="fn-sig">${verBadge(ver)}${sig}</div>${blocks(desc.join("\n"))}</section>`;
    };

    // ::: chart [bar|hbar|line] [Title]   body = "Label: value" lines, pasted CSV, or a "csv path" line
    const NUM = "-?\\d+(?:\\.\\d+)?";
    const DATA = new RegExp("^(.+?):\\s*(" + NUM + "(?:\\s*,\\s*" + NUM + ")*)\\s*$");
    const DIRECTIVE = /^((unit|max|series|csv|x|y|where|columns|relative|highlight)\s+.+|log|linear|speed)$/i;
    const csvList = x => x.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const placeholder = (attr, spec) => `<figure class="ch ch-pending" ${attr}="${esc(JSON.stringify(spec)).replace(/"/g, "&quot;")}">${spec.title ? `<figcaption class="ch-title">${esc(spec.title)}</figcaption>` : ""}<p class="ch-load">Loading from ${esc(spec.csv)}&hellip;</p></figure>`;
    const oops = (what, e) => `<div class="callout danger"><p class="ct">Could not draw this ${what}</p><p>${esc(e.message)}</p></div>`;
    // finds CSV text pasted into a block: a header row plus data rows with the same number of columns
    const inlineCsv = (lines, needNum) => {
      let fence = false;
      for (let i = 0; i < lines.length; i++) {
        const t = lines[i].trim();
        if (/^```/.test(t)) { fence = !fence; continue; }
        if (fence || !t || DIRECTIVE.test(t) || DATA.test(t) || !t.includes(",")) continue;
        const n = parseCSV(t)[0].length;
        if (n < 2) continue;
        const rows = [t]; let j = i + 1;
        while (j < lines.length) {
          const u = lines[j].trim();
          if (!u) { j++; continue; }
          if (/^```/.test(u) || DIRECTIVE.test(u)) break;
          const p = parseCSV(u);
          if (!p.length || p[0].length !== n) break;
          rows.push(u); j++;
        }
        const cells = rows.map(r => parseCSV(r)[0]);
        const ok = rows.length >= 2 && cells[0].some(c => !Number.isFinite(+c)) && (!needNum || cells.slice(1).some(r => r.some(c => c.trim() !== "" && Number.isFinite(+c))));
        if (ok) return { from: i, to: j, text: rows.join("\n") };
      }
      return null;
    };
    const chartBlock = (arg, body) => {
      ensureChartCss();
      const am = arg.match(/^(\w+)\s*(.*)$/) || [];
      const kind = ["bar", "hbar", "line"].includes(am[1]) ? am[1] : "bar";
      const title = kind === am[1] ? am[2] : arg;
      const lines = body.split("\n"), inl = inlineCsv(lines, true);
      const hasData = !!inl || /^\s*csv\s+/m.test(body);
      const spec = { kind, title, unit: "", maxOpt: null, log: false, linear: false, speed: false, relative: "", highlight: "", where: [], y: [] };
      let seriesRaw = "", fence = false, mm;
      const rows = [], desc = [];
      for (let idx = 0; idx < lines.length; idx++) {
        const ln = lines[idx], t = ln.trim(), isFence = /^```/.test(t);
        if (inl && idx >= inl.from && idx < inl.to) continue;
        if (isFence) fence = !fence;
        if (fence || isFence) { desc.push(ln); continue; }
        if ((mm = t.match(/^unit\s+(.+)$/))) spec.unit = mm[1].trim();
        else if ((mm = t.match(/^max\s+(\d+(?:\.\d+)?)$/))) spec.maxOpt = +mm[1];
        else if (/^log$/i.test(t)) spec.log = true;
        else if (/^linear$/i.test(t)) spec.linear = true;
        else if (/^speed$/i.test(t)) spec.speed = true;
        else if ((mm = t.match(/^relative\s+(.+)$/))) spec.relative = mm[1].trim();
        else if ((mm = t.match(/^highlight\s+(.+)$/))) spec.highlight = mm[1].trim();
        else if ((mm = t.match(/^series\s+(.+)$/))) seriesRaw = mm[1].trim();
        else if ((mm = t.match(/^csv\s+(.+)$/))) spec.csv = mm[1].trim();
        else if (hasData && (mm = t.match(/^x\s+(.+)$/))) spec.x = mm[1].trim();
        else if (hasData && (mm = t.match(/^y\s+(.+)$/))) spec.y = csvList(mm[1]);
        else if (hasData && (mm = t.match(/^where\s+(.+?)\s*(!=|=)\s*(.+)$/))) spec.where.push({ col: mm[1].trim(), neg: mm[2] === "!=", vals: csvList(mm[3]) });
        else if (!hasData && (mm = t.match(DATA))) rows.push({ label: mm[1].trim(), vals: mm[2].split(",").map(Number) });
        else desc.push(ln);
      }
      const extra = desc.join("\n").trim() ? blocks(desc.join("\n")) : "";
      spec.series = hasData ? seriesRaw : "";
      if (spec.csv) return placeholder("data-chart", spec) + extra;
      if (inl) { try { return renderChart(chartFromCSV(spec, inl.text)) + extra; } catch (e) { return oops("chart", e) + extra; } }
      if (!rows.length) return `<div class="callout danger"><p class="ct">Chart has no data</p><p>Add lines like <code>Label: 12</code>, paste a CSV, or add a <code>csv path/to/file.csv</code> line.</p></div>`;
      return renderChart({ kind, title, unit: spec.unit, maxOpt: spec.maxOpt, log: spec.log, highlight: spec.highlight, names: seriesRaw ? csvList(seriesRaw) : [], rows }) + extra;
    };

    // ::: table path/to/file.csv Title   or   ::: table Title + pasted CSV   (optional: columns A, B / where Col = value)
    const tableBlock = (arg, body) => {
      ensureChartCss();
      const [first = "", ...rest] = arg.split(/\s+/), file = /\.csv$/i.test(first);
      const spec = { table: true, csv: file ? first : "", title: file ? rest.join(" ") : arg, columns: [], where: [] };
      const lines = body.split("\n"), inl = file ? null : inlineCsv(lines, false), desc = [];
      let fence = false, mm;
      for (let idx = 0; idx < lines.length; idx++) {
        const ln = lines[idx], t = ln.trim(), isFence = /^```/.test(t);
        if (inl && idx >= inl.from && idx < inl.to) continue;
        if (isFence) fence = !fence;
        if (fence || isFence) { desc.push(ln); continue; }
        if ((mm = t.match(/^columns\s+(.+)$/))) spec.columns = csvList(mm[1]);
        else if ((mm = t.match(/^where\s+(.+?)\s*(!=|=)\s*(.+)$/))) spec.where.push({ col: mm[1].trim(), neg: mm[2] === "!=", vals: csvList(mm[3]) });
        else desc.push(ln);
      }
      const extra = desc.join("\n").trim() ? blocks(desc.join("\n")) : "";
      if (file) return placeholder("data-table", spec) + extra;
      if (!inl) return `<div class="callout danger"><p class="ct">Table has no data</p><p>Paste CSV rows, or start the block with a file name: <code>::: table data/file.csv</code>.</p></div>`;
      try { return tableFromCSV(spec, inl.text) + extra; } catch (e) { return oops("table", e) + extra; }
    };

    const blocks = text => {
      const L = text.split("\n"), out = [];
      let i = 0, m;
      while (i < L.length) {
        const l = L[i];
        if (!l.trim()) { i++; continue; }
        if ((m = l.match(/^```\s*([\w-]*)/))) {
          const b = []; i++;
          while (i < L.length && !/^```/.test(L[i])) b.push(L[i++]);
          i++;
          const c = b.join("\n");
          out.push(`<div class="cbw"><button class="copy" type="button" aria-label="Copy code">Copy</button><pre class="cb"${m[1] === "gaug" ? " data-gaug" : ""}><code>${m[1] === "gaug" ? highlight(c) : esc(c)}</code></pre></div>`);
          continue;
        }
        if ((m = l.match(/^:::\s*(\w+)\s*(.*)$/))) {
          if (m[1] === "download") {
            const [href, ...rest] = m[2].trim().split(/\s+/);
            out.push(`<p><a class="dl" href="${esc(href)}" download>${esc(rest.join(" ") || href.split("/").pop())}</a></p>`);
            i++; continue;
          }
          const b = []; i++;
          while (i < L.length && !/^:::\s*$/.test(L[i])) b.push(L[i++]);
          i++;
          if (m[1] === "function" || m[1] === "fn") { out.push(fnBlock(m[2].trim(), b.join("\n"))); continue; }
          if (m[1] === "const" || m[1] === "constant") { out.push(constBlock(m[2].trim(), b.join("\n"))); continue; }
          if (m[1] === "chart") { out.push(chartBlock(m[2].trim(), b.join("\n"))); continue; }
          if (m[1] === "table") { out.push(tableBlock(m[2].trim(), b.join("\n"))); continue; }
          const title = m[2] || m[1][0].toUpperCase() + m[1].slice(1);
          out.push(`<div class="callout ${m[1]}"><p class="ct">${esc(title)}</p>${blocks(b.join("\n"))}</div>`);
          continue;
        }
        if ((m = l.match(/^(#{1,4})\s+(.*?)\s*#*\s*$/))) {
          out.push(`<h${m[1].length} id="${slug(m[2])}">${inline(m[2])}</h${m[1].length}>`);
          i++; continue;
        }
        if (/^(-{3,}|\*{3,})\s*$/.test(l)) { out.push("<hr>"); i++; continue; }
        if (/^>/.test(l)) {
          const b = [];
          while (i < L.length && /^>/.test(L[i])) b.push(L[i++].replace(/^>\s?/, ""));
          out.push(`<blockquote>${blocks(b.join("\n"))}</blockquote>`);
          continue;
        }
        if (l.includes("|") && i + 1 < L.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(L[i + 1])) {
          const h = row(l), rows = [];
          i += 2;
          while (i < L.length && L[i].trim() && L[i].includes("|")) rows.push(row(L[i++]));
          out.push(`<table><thead><tr>${h.map(c => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
            rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") + `</tbody></table>`);
          continue;
        }
        if (isList(l)) {
          const b = [], base = l.match(/^\s*/)[0].length, kind = x => /^\s*\d/.test(x);
          const same = x => isList(x) && (x.match(/^\s*/)[0].length > base || kind(x) === kind(l));
          while (i < L.length && (same(L[i]) || (L[i].trim() && !isList(L[i]) && /^\s{2,}/.test(L[i])) || (!L[i].trim() && i + 1 < L.length && same(L[i + 1])))) b.push(L[i++]);
          out.push(list(b));
          continue;
        }
        const b = [];
        while (i < L.length && L[i].trim() && !(b.length && starts(L[i]))) b.push(L[i++].trim());
        out.push(`<p>${inline(b.join(" "))}</p>`);
      }
      return out.join("\n");
    };
    return blocks(src);
  }

  // JSON parser that tolerates trailing commas (outside of strings)
  const lenient = t => JSON.parse(t.replace(/("(?:[^"\\]|\\.)*")|,(\s*[}\]])/g, (m, str, close) => str || close));

  /* ---------- documentation.json loader ---------- */
  let docsP;
  function loadDocs() {
    return docsP || (docsP = fetch("documentation.json", { cache: "no-cache" })
      .then(r => { if (!r.ok) throw new Error("documentation.json: HTTP " + r.status); return r.text(); })
      // tolerate trailing commas (outside of strings) before parsing
      .then(lenient)
      .then(d => {
        d.flat = [];
        for (const grp of d.sidebar) for (const it of grp.items) d.flat.push({ ...it, group: grp.text, key: it.link.replace(/^\//, "") });
        d.first = d.flat[0];
        return d;
      })
      // the highlighter grammar must be ready before any page is rendered
      .then(d => loadGrammar().catch(e => console.warn(e.message)).then(() => d)));
  }

  g.Gaug = { version: 10, esc, slug, highlight, md, loadDocs, loadGrammar, lenient, renderChart, parseCSV, hydrate };
  if (typeof document === "undefined") return;

  /* ---------- favicon: generated from gaug-icon.png ---------- */
  // Replace gaug-icon.png with any transparent PNG and the tab icon follows:
  // empty margins are trimmed so the artwork fills the icon. INSET zooms in a little more (0 = no zoom).
  (function buildFavicon() {
    const SRC = "gaug-icon.png", INSET = 0.06, OUT = 64;
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth, h = img.naturalHeight;
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const cx = c.getContext("2d"); cx.drawImage(img, 0, 0);
        const d = cx.getImageData(0, 0, w, h).data;
        let l = w, t = h, r = -1, b = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (d[(y * w + x) * 4 + 3] > 16) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y; }
        }
        if (r < l) return;
        const side = Math.max(r - l, b - t) + 1, mx = (l + r + 1) / 2, my = (t + b + 1) / 2, crop = side * (1 - INSET * 2);
        const out = document.createElement("canvas"); out.width = out.height = OUT;
        const ox = out.getContext("2d"); ox.imageSmoothingQuality = "high";
        ox.drawImage(img, mx - crop / 2, my - crop / 2, crop, crop, 0, 0, OUT, OUT);
        const link = document.createElement("link");
        link.rel = "icon"; link.type = "image/png"; link.href = out.toDataURL("image/png");
        document.querySelectorAll('link[rel="icon"]').forEach(n => n.remove());
        document.head.appendChild(link);
      } catch (e) { /* keep the static <link rel="icon"> fallback */ }
    };
    img.src = SRC;
  })();

  /* ---------- shared nav behavior ---------- */
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const label = $("themeLabel"), menu = $("menu"), btn = $("themeBtn");

  function setTheme(t) {
    root.dataset.theme = t === "light" ? "light" : "dark";
    label.textContent = t[0].toUpperCase() + t.slice(1);
    menu.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", String(b.dataset.t === t)));
    try { localStorage.setItem("gaug-theme", t); } catch (e) {}
  }
  let saved = "auto";
  try { saved = localStorage.getItem("gaug-theme") || "auto"; } catch (e) {}
  setTheme(saved);
  btn.addEventListener("click", e => { e.stopPropagation(); menu.classList.toggle("open"); });
  menu.addEventListener("click", e => { const b = e.target.closest("button"); if (b) setTheme(b.dataset.t); });

  // copy button on code blocks
  document.addEventListener("click", e => {
    const b = e.target.closest(".copy");
    if (!b) return;
    const text = b.parentElement.querySelector("pre code").textContent;
    const done = () => { b.textContent = "Copied"; b.classList.add("ok"); setTimeout(() => { b.textContent = "Copy"; b.classList.remove("ok"); }, 1500); };
    const fallback = () => {
      const t = document.createElement("textarea");
      t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); done(); } catch (err) {}
      t.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  });

  // load the highlighter grammar, then re-colour anything drawn before it arrived
  loadGrammar().then(() => {
    document.querySelectorAll("pre[data-gaug] code").forEach(c => { c.innerHTML = highlight(c.textContent); });
    const ta = $("ta"); if (ta) ta.dispatchEvent(new Event("input"));
  }).catch(e => console.warn(e.message));

  // draw charts/tables that load a CSV file whenever they show up on the page
  new MutationObserver(() => hydrate(document)).observe(document.body, { childList: true, subtree: true });
  hydrate(document);

  // links that should open the first documentation page
  const docLinks = document.querySelectorAll("[data-docs]");
  if (docLinks.length) loadDocs().then(d => docLinks.forEach(a => a.href = "docs.html#" + d.first.link)).catch(() => {});

  // search across titles and page contents
  const q = $("q"), res = $("results");
  let index = null, hits = [], sel = -1;
  async function build() {
    if (index) return index;
    const d = await loadDocs();
    index = await Promise.all(d.flat.map(async it => {
      let text = "";
      try { const r = await fetch("docs/" + encodeURI(it.file), { cache: "no-cache" }); if (r.ok) text = await r.text(); } catch (e) {}
      return { it, plain: text.replace(/^---\n[\s\S]*?\n---\n?/, "").replace(/[#>*`|:]/g, " ").replace(/\s+/g, " ").trim() };
    }));
    return index;
  }
  function paint() {
    res.innerHTML = hits.length
      ? hits.map((h, n) => `<a class="res${n === sel ? " sel" : ""}" href="docs.html#${h.it.link}"><b>${esc(h.it.text)}</b><small>${esc(h.snip || h.it.group)}</small></a>`).join("")
      : `<div class="none">No results</div>`;
    res.classList.add("open");
  }
  async function run() {
    const term = q.value.trim().toLowerCase();
    if (!term) { res.classList.remove("open"); return; }
    const idx = await build();
    if (q.value.trim().toLowerCase() !== term) return;
    hits = idx.map(({ it, plain }) => {
      const t = it.text.toLowerCase(), p = plain.toLowerCase().indexOf(term);
      const score = (t.includes(term) ? (t.startsWith(term) ? 15 : 10) : 0) + (p >= 0 ? 1 : 0);
      return { it, score, snip: p >= 0 ? (p > 40 ? "…" : "") + plain.slice(Math.max(0, p - 40), p + 90) : "" };
    }).filter(h => h.score).sort((a, b) => b.score - a.score).slice(0, 8);
    sel = hits.length ? 0 : -1;
    paint();
  }
  q.addEventListener("input", run);
  q.addEventListener("focus", () => { if (q.value.trim()) run(); else build().catch(() => {}); });
  q.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!hits.length) return;
      e.preventDefault();
      sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % hits.length;
      paint();
    } else if (e.key === "Enter" && hits[Math.max(sel, 0)]) {
      location.href = "docs.html#" + hits[Math.max(sel, 0)].it.link;
      res.classList.remove("open");
      q.blur();
    } else if (e.key === "Escape") { res.classList.remove("open"); q.blur(); }
  });
  res.addEventListener("click", () => { res.classList.remove("open"); q.value = ""; });
  document.addEventListener("click", e => {
    menu.classList.remove("open");
    if (!e.target.closest(".search")) res.classList.remove("open");
  });
})();