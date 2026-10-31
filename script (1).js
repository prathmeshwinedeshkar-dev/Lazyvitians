(function () {
  "use strict";
  const D = window.CampusData;
  if (!D) { document.body.insertAdjacentHTML("afterbegin", "<p style='padding:1rem'>data.js failed to load.</p>"); return; }

  /* ---------- helpers ---------- */
  const $ = (s) => document.querySelector(s);
  // Central feature switches live in data.js -> config.features (import is off by default).
  const F = Object.assign({ quiz: true, pwa: true, import: false }, (D.config && D.config.features) || {});
  if (!F.quiz) {
    const v = $("#vibe"); if (v) v.remove();
    document.querySelectorAll('.nav nav a[href="#vibe"]').forEach((a) => a.remove());
    const p = document.querySelector(".cta .primary"); if (p) { p.href = "#clubs"; p.textContent = "Browse clubs"; }
    document.querySelectorAll('.cta a[href="#clubs"]:not(.primary)').forEach((a) => a.remove());
  }
  if (!F.import) { const ip = $("#importPanel"); if (ip) ip.remove(); }
  if (!F.pwa) { const m = $("#manifestLink"); if (m) m.remove(); }
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } };
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
  const KEYS = ["clubs", "events", "resources", "places"]; // data types that can be imported
  const STRIP = ["verified", "source", "statusLabel", "verifiedId", "leader", "leaderRole", "leadership", "evidence", "recruit", "note", "igNote", "imported"];
  const cap = (v, n) => String(v).slice(0, n);
  // Imported records can never claim verification: evidence fields are stripped and imported:true is forced.
  const clean = (items) => (Array.isArray(items) ? items : []).slice(0, 200).filter((x) => x && typeof x === "object" && typeof x.id === "string" && typeof x.name === "string").map((x) => {
    const o = { ...x }; STRIP.forEach((f) => delete o[f]);
    Object.keys(o).forEach((f) => { if (typeof o[f] === "string") o[f] = cap(o[f], f === "description" ? 600 : 300); });
    ["category", "activities", "tags"].forEach((f) => { o[f] = Array.isArray(o[f]) ? o[f].slice(0, 10).map((s) => cap(s, 60)) : []; });
    o.imported = true; return o;
  });
  const igUrl = (h) => (h ? "https://instagram.com/" + encodeURIComponent(h.replace("@", "")) : "");

  /* ---------- merge imported data (from the Import button) ---------- */
  const imported = load("cx_import", {});
  if (F.import) KEYS.forEach((k) => D.add(k, clean(imported && imported[k])));

  /* ---------- state ---------- */
  const state = { q: "", chip: "All", ev: {}, place: "All", verifiedOnly: false };
  const strs = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
  const rawPlan = load("cx_plan", {}) || {};
  let plan = { clubs: strs(rawPlan.clubs), events: strs(rawPlan.events), resources: strs(rawPlan.resources) };
  const rawRegs = load("cx_regs", []);
  let regs = Array.isArray(rawRegs) ? rawRegs.filter((r) => r && typeof r === "object") : [];

  const CHIPS = ["All", "Technical", "Cultural", "Sports", "Social Welfare", "Entrepreneurship", "Media and Film", "Astronomy", "Finance", "Public Speaking", "Robotics", "Coding", "AI/ML", "Cybersecurity", "IoT", "Design", "Events", "Resources"];

  /* ---------- search + filter core ---------- */
  function blob(it) {
    return [it.name, it.description, it.bestFor, it.org, it.type, it.skill, it.why, (it.category || []).join(" "), (it.activities || []).join(" "), (it.tags || []).join(" ")].join(" ").toLowerCase();
  }
  function matches(it, kind) {
    const q = state.q.trim().toLowerCase();
    if (state.verifiedOnly && kind !== "resources" && !it.verified) return false;
    if (q && !q.split(/\s+/).every((w) => blob(it).includes(w))) return false;
    if (state.chip !== "All") {
      if (state.chip === "Events" && kind !== "events") return false;
      if (state.chip === "Resources" && kind !== "resources") return false;
      if (!["Events", "Resources"].includes(state.chip) && !(it.category || []).includes(state.chip)) return false;
    }
    return true;
  }
  function eventMatches(e) {
    const f = state.ev;
    if (f.type && e.type !== f.type) return false;
    if (f.month && e.month !== f.month) return false;
    if (f.org && e.org !== f.org) return false;
    if (f.skill && e.skill !== f.skill) return false;
    if (f.beginner && String(e.beginner) !== f.beginner) return false;
    if (f.reg && String(e.reg) !== f.reg) return false;
    if (f.cost && e.cost !== f.cost) return false;
    if (f.mode && e.mode !== f.mode && e.mode !== "Hybrid") return false;
    return true;
  }

  /* ---------- card templates ---------- */
  const isSaved = (k, id) => plan[k].includes(id);
  const saveBtn = (k, id) => `<button type="button" class="btn small ${isSaved(k, id) ? "on" : ""}" data-act="save" data-k="${k}" data-id="${esc(id)}" aria-pressed="${isSaved(k, id)}">${isSaved(k, id) ? "✓ In plan" : "+ Add to My Campus Plan"}</button>`;

  const proof = (it, label) => `<p class="muted proof">${it.verified ? (it.statusLabel ? esc(it.statusLabel) + " · checked " : "Verified ") + esc(it.verified) + (safeUrl(it.source) ? ` · <a href="${esc(it.source)}" target="_blank" rel="noopener noreferrer">source</a>` : "") : (it.listing === "directory" ? "Directory listing (compiled from VIT Pune official pages; no per-club source link)" : it.listing === "original" ? "Not in the directory PDF; no source found yet" : "Not yet verified")} · <a href="${esc(D.config.github)}/issues/new?title=${encodeURIComponent("Update: " + label)}" target="_blank" rel="noopener noreferrer">Report an update</a></p>`;
  const VP = window.VerifiedPack || {};
  const trust = (it) => (it.imported ? '<span class="badge u">Imported on this device</span>' : "") + (it.verified ? '<span class="badge v">Source-checked</span>' : it.listing === "directory" ? '<span class="badge u">Directory listing</span>' : it.listing === "original" ? '<span class="badge u">Not in directory</span>' : '<span class="badge u">Unverified</span>');
  const recruitLine = (c) => {
    if ((VP.recruitment || []).some((r) => r.club_id === c.verifiedId)) return "Recruitment: see the Deadlines section. Closed deadlines stay closed.";
    return c.verified ? `Recruitment dates not published (as of ${esc(c.verified)}).` : "Recruitment: unknown.";
  };
  const more = (c) => {
    const facts = c.origin ? `<p><b>Origin:</b> ${esc(c.origin)}</p>` : "";
    const lead = Array.isArray(c.leadership) && c.leadership.length ? `<p><b>Listed organizers:</b> ${c.leadership.map((l) => `${esc(l.name)} (${esc(l.role)})`).join(", ")} <span class="muted">— tenure not stated; may be outdated</span></p>` : "";
    const ev = Object.entries(c.evidence || {}).filter(([, v]) => v && safeUrl(v.url)).map(([k, v]) => `<a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${esc(k)}</a>`).join(" · ");
    return `${facts}${lead}${ev ? `<p class="muted">Sources: ${ev}</p>` : ""}<p class="muted">${recruitLine(c)}</p>`;
  };
  const hue = (c) => [...String((c.category || [])[0] || c.name)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
  const initials = (n) => n.replace(/\(.*?\)/g, "").split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w) && !["of", "the", "and", "on"].includes(w.toLowerCase())).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
  const toast = (msg) => { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); } t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800); };
  const clubCard = (c) => `<article class="card glass"><div class="chead"><span class="mono" style="--h:${hue(c)}" aria-hidden="true">${esc(initials(c.name))}</span><div class="badges">${c.category.map((x) => `<span class="badge">${esc(x)}</span>`).join("")}${trust(c)}</div></div>
    <h3>${esc(c.name)}</h3><p>${esc(c.description)}</p>${c.achievement ? `<p class="note"><b>Recognition:</b> ${esc(c.achievement)}</p>` : ""}
    <p class="muted"><b>Best for:</b> ${esc(c.bestFor)}</p>
    <details><summary>More details</summary>${c.leader ? `<p><b>Listed lead:</b> ${esc(c.leader)} (${esc(c.leaderRole)}) <span class="muted">— as listed when checked; tenure not confirmed</span></p>` : ""}${c.note ? `<p class="muted">${esc(c.note)}</p>` : ""}${more(c)}<p><b>Key activities:</b> ${esc((c.activities || []).join(", "))}</p>
    <p>${c.instagram ? `<a href="${igUrl(c.instagram)}" target="_blank" rel="noopener noreferrer">Instagram @${esc(c.instagram)}</a>${c.igNote ? ` <span class="muted">(${esc(c.igNote)})</span>` : ""}` : "<span class='muted'>Instagram: not verified yet</span>"}</p>${proof(c, c.name)}</details>
    <div class="row"><button type="button" class="btn small primary" data-act="register" data-k="clubs" data-id="${esc(c.id)}">Register interest</button>${saveBtn("clubs", c.id)}<a class="btn small ghost" href="${esc(safeUrl(c.website) || D.config.officialSite)}" target="_blank" rel="noopener noreferrer">Join / Know More</a>${c.instagram ? `<a class="btn small ghost" href="${igUrl(c.instagram)}" target="_blank" rel="noopener noreferrer">@${esc(c.instagram.replace("@", ""))}</a>` : ""}</div></article>`;

  const eventCard = (e) => `<article class="card glass bigcard"><div class="badges"><span class="badge a">${esc(e.type)}</span>${trust(e)}${(e.tags || []).map((t) => `<span class="badge">${esc(t)}</span>`).join("")}</div>
    <h3>${esc(e.name)}</h3><p class="muted">${e.verified ? "Organised by" : "Likely organiser (unverified):"} ${esc(e.org)} · ${e.verified ? esc(e.time) : "dates not verified"}</p>
    <p><b>First-years can:</b> ${esc(e.firstYear)}</p><p><b>Why go:</b> ${esc(e.why)}</p>
    ${proof(e, e.name)}<p class="muted">${esc(e.cost)} · ${esc(e.mode)} · ${e.reg ? "Registration needed" : "No registration"}</p>
    <div class="row">${saveBtn("events", e.id)}<button type="button" class="btn small" data-act="register" data-id="${esc(e.id)}">Register</button></div></article>`;

  const resCard = (r) => {
    const link = safeUrl(r.link), root = link === D.config.officialSite;
    return `<article class="card"><div class="badges">${r.category.filter((x) => x !== "Resources").map((x) => `<span class="badge">${esc(x)}</span>`).join("")}</div>
    <h3>${esc(r.name)}</h3>${r.imported ? '<span class="badge u">Imported on this device</span>' : ""}<p>${esc(r.description)}</p>
    ${r.guide ? `<details><summary>Open checklist</summary><ul class="check">${r.guide.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="muted">${esc(r.guideNote)}</p></details>` : ""}
    ${root ? `<p class="muted">Opens the vit.edu home page; use its menu to find this.</p>` : ""}
    <div class="row">${link ? `<a class="btn small" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${root ? "Open vit.edu home" : "Open Resource"}</a>` : ""}${saveBtn("resources", r.id)}</div></article>`;
  };

  const placeCard = (p) => `<article class="card glass"><span class="badge">${esc(p.filter)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p></article>`;

  /* ---------- render ---------- */
  function renderAll() {
    const clubs = D.clubs.filter((c) => matches(c, "clubs"));
    const evs = D.events.filter((e) => matches(e, "events") && eventMatches(e));
    const res = D.resources.filter((r) => matches(r, "resources"));
    $("#clubGrid").innerHTML = clubs.length ? clubs.map(clubCard).join("") : `<div class="empty">No clubs match these filters.</div>`;
    $("#eventGrid").innerHTML = evs.length ? evs.map(eventCard).join("") : `<div class="empty">${state.verifiedOnly ? "No events have verified details yet." : "No events match these filters."}</div>`;
    $("#resGrid").innerHTML = res.map(resCard).join("");
    const total = clubs.length + evs.length + res.length;
    $("#noResults").hidden = total > 0;
    $("#resultInfo").textContent = `${clubs.length} clubs · ${evs.length} events · ${res.length} resources`;
    renderPlaces(); renderPlan(); renderRegs();
  }
  function renderPlaces() {
    const names = ["All", ...new Set(D.places.map((p) => p.filter))];
    $("#placeChips").innerHTML = names.map((n) => `<button type="button" class="btn small ${state.place === n ? "on" : ""}" data-act="place" data-id="${esc(n)}">${esc(n)}</button>`).join("");
    $("#placeGrid").innerHTML = D.places.filter((p) => state.place === "All" || p.filter === state.place).map(placeCard).join("");
  }
  function renderPlan() {
    const maps = { clubs: [D.clubs, clubCard], events: [D.events, eventCard], resources: [D.resources, resCard] };
    let n = 0, html = "";
    Object.keys(maps).forEach((k) => plan[k].forEach((id) => {
      const it = maps[k][0].find((x) => x.id === id); if (!it) return; n++;
      html += `<article class="card glass"><span class="badge a">${k.slice(0, -1)}</span><h3>${esc(it.name)}</h3><button type="button" class="btn small ghost" data-act="remove" data-k="${k}" data-id="${esc(id)}">Remove</button></article>`;
    }));
    $("#planBox").innerHTML = n ? html : `<div class="empty">Nothing saved yet. Tap “+ Add to My Campus Plan” on any card.</div>`;
    $("#planCount").textContent = n;
  }
  function renderRegs() {
    $("#regBox").innerHTML = regs.length ? regs.map((r) => `<article class="card glass"><h3>${esc(r.event)}</h3><p>${esc(r.name)} · ${esc(r.role)}</p><p class="muted">${esc(r.email)}</p><button type="button" class="btn small ghost" data-act="delreg" data-id="${esc(r.id)}">Delete</button></article>`).join("") : `<div class="empty">No registrations yet. Use “Register” on an event card.</div>`;
  }
  function renderStatic() {
    $("#chips").innerHTML = CHIPS.map((c) => `<button type="button" class="btn small ${state.chip === c ? "on" : ""}" data-act="chip" data-id="${esc(c)}" aria-pressed="${state.chip === c}">${esc(c)}</button>`).join("");
    $("#testiGrid").innerHTML = D.testimonials.map((t) => `<blockquote class="card glass"><p>“${esc(t.quote)}”</p><p class="muted">${esc(t.name)}, ${esc(t.branch)} (sample)</p></blockquote>`).join("");
    $("#faqList").innerHTML = D.faqs.map((f) => `<details class="glass"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");
    const u = (arr, key) => [...new Set(arr.map((x) => x[key]))].filter(Boolean);
    const sel = (id, label, opts) => `<label>${label}<select data-ev="${id}"><option value="">Any</option>${opts.map((o) => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join("")}</select></label>`;
    const same = (a) => a.map((x) => [x, x]);
    $("#eventFilters").innerHTML = sel("type", "Type", same(u(D.events, "type"))) + sel("month", "Month / semester", same(u(D.events, "month"))) + sel("org", "Club / committee", same(u(D.events, "org"))) + sel("skill", "Skill gained", same(u(D.events, "skill"))) +
      sel("beginner", "Beginner friendly", [["true", "Yes"], ["false", "No"]]) + sel("reg", "Registration", [["true", "Required"], ["false", "Not required"]]) + sel("cost", "Cost", same(u(D.events, "cost"))) + sel("mode", "Mode", same(u(D.events, "mode")));
    $("#regEvent").innerHTML = `<optgroup label="Events">${D.events.map((e) => `<option>${esc(e.name)}</option>`).join("")}</optgroup><optgroup label="Clubs">${D.clubs.map((c) => `<option>${esc(c.name)}</option>`).join("")}</optgroup>`;
    $("#regEvent").closest("label").firstChild.textContent = "Interested in";
    const cf = D.config;
    $("#fAuthor").textContent = cf.author;
    [["#fGit", cf.github], ["#fLi", cf.linkedin], ["#fSite", cf.siteUrl]].forEach(([s, h]) => { if (safeUrl(h) && !/your-/.test(h)) $(s).href = h; else $(s).closest("li").hidden = true; });
  }

  /* ---------- events (delegation) ---------- */
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]"); if (!b) return;
    const { act, k, id } = b.dataset;
    if (act === "chip") { state.chip = id; renderStatic(); renderAll(); }
    if (act === "place") { state.place = id; renderPlaces(); }
    if (act === "save") { const i = plan[k].indexOf(id); i > -1 ? plan[k].splice(i, 1) : plan[k].push(id); save("cx_plan", plan); renderAll(); toast(i > -1 ? "Removed from My Campus Plan" : "Added to My Campus Plan"); }
    if (act === "remove") { plan[k] = plan[k].filter((x) => x !== id); save("cx_plan", plan); renderAll(); }
    if (act === "delreg") { regs = regs.filter((r) => r.id !== id); save("cx_regs", regs); renderRegs(); }
    if (act === "register") { const e = (k === "clubs" ? D.clubs : D.events).find((x) => x.id === id); if (e) $("#regEvent").value = e.name; $("#regMsg").textContent = ""; $("#regModal").showModal(); }
  });
  $("#search").addEventListener("input", (e) => { state.q = e.target.value; renderAll(); });
  $("#eventFilters").addEventListener("change", (e) => { const f = e.target.dataset.ev; if (f) { state.ev[f] = e.target.value; renderAll(); } });
  $("#resetEv").addEventListener("click", () => { state.ev = {}; document.querySelectorAll("[data-ev]").forEach((s) => (s.value = "")); renderAll(); });
  $("#regClose").addEventListener("click", () => $("#regModal").close());
  $("#themeBtn").addEventListener("click", () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t; save("cx_theme", t);
  });
  document.documentElement.dataset.theme = load("cx_theme", "dark");

  /* ---------- registration form ---------- */
  $("#regForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    const msg = $("#regMsg"); msg.className = "msg err";
    const prn = new RegExp(D.config.prnPattern);
    if (!f.name.trim() || !f.prn.trim() || !f.email.trim() || !f.phone.trim() || !f.branch.trim() || !f.why.trim()) { msg.textContent = "Please fill every required field."; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { msg.textContent = "Enter a valid email address."; return; }
    if (!/^\d{10}$/.test(f.phone)) { msg.textContent = "Phone must be exactly 10 digits."; return; }
    if (!prn.test(f.prn.trim())) { msg.textContent = "PRN format looks wrong. Check it or update prnPattern in data.js."; return; }
    regs.push({ id: "r" + Date.now(), name: f.name.trim(), prn: f.prn.trim(), email: f.email.trim(), phone: f.phone, year: f.year, branch: f.branch.trim(), event: f.event, why: f.why.trim(), role: f.role });
    save("cx_regs", regs); e.target.reset(); renderRegs();
    msg.className = "msg ok"; msg.textContent = "Saved on this device only. Nothing was sent to any organiser.";
  });

  /* ---------- import JSON ---------- */
  const MAX_FILE = 200 * 1024, MAX_STORE = 300 * 1024;
  if ($("#importFile")) {
    $("#importFile").addEventListener("change", (e) => {
      const file = e.target.files[0], msg = $("#importMsg"); if (!file) return;
      if (!/\.json$/i.test(file.name)) { msg.textContent = "Please choose a .json file."; return; }
      if (file.size > MAX_FILE) { msg.textContent = "File too large (max 200 KB)."; return; }
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("shape");
          const keep = load("cx_import", {}) || {}, add = {}; let added = 0, skipped = 0;
          KEYS.forEach((k) => {
            const raw = Array.isArray(data[k]) ? data[k].length : 0, fresh = clean(data[k]).filter((i) => !D[k].some((x) => x.id === i.id));
            skipped += raw - fresh.length; added += fresh.length;
            if (fresh.length) { add[k] = fresh; keep[k] = [...(Array.isArray(keep[k]) ? keep[k] : []), ...fresh]; }
          });
          if (JSON.stringify(keep).length > MAX_STORE) { msg.textContent = "Too much imported data to store on this device."; return; }
          Object.keys(add).forEach((k) => D.add(k, add[k]));
          save("cx_import", keep); renderStatic(); renderAll();
          msg.textContent = `Imported ${added} record(s); skipped ${skipped} (invalid or duplicate id). Imported records are never marked verified.`;
        } catch (err) { msg.textContent = "That file is not valid JSON in the expected shape."; }
      };
      r.readAsText(file);
    });
    $("#clearImport").addEventListener("click", () => { try { localStorage.removeItem("cx_import"); } catch (e) { /* ignore */ } location.reload(); });
  }

  /* ---------- NEW: ticker ---------- */
  const names = D.clubs.map((c) => `<span>${esc(c.name)}</span>`).join("");
  $("#tickerTrack").innerHTML = names + names;

  /* ---------- NEW: vibe-check quiz (override by setting CampusData.quiz in data.js) ---------- */
  const QUIZ = D.quiz || [
    { q: "Perfect weekend plan?", o: [["Build something", ["Coding", "Technical", "IoT", "Robotics"]], ["Create or perform", ["Cultural", "Media and Film", "Design"]], ["Pitch an idea", ["Entrepreneurship", "Finance", "Public Speaking"]], ["Give back or play", ["Social Welfare", "Sports", "Astronomy"]]] },
    { q: "Your superpower?", o: [["Debugging anything", ["Coding", "Cybersecurity", "AI/ML"]], ["Telling stories", ["Media and Film", "Public Speaking", "Cultural"]], ["Spotting opportunities", ["Entrepreneurship", "Finance"]], ["Hands-on fixing", ["Robotics", "IoT", "Technical"]]] },
    { q: "A great first-semester win?", o: [["Winning a hackathon", ["Coding", "Technical", "Entrepreneurship"]], ["A stage moment", ["Cultural", "Public Speaking"]], ["A solid friend circle", ["Social Welfare", "Sports"]], ["Learning something wild", ["Astronomy", "AI/ML", "Cybersecurity"]]] }
  ];
  let step = 0, picks = [];
  function renderQuiz() {
    const box = $("#quizBox"); if (!box) return;
    if (step < QUIZ.length) {
      const s = QUIZ[step];
      box.innerHTML = `<h3>${esc(s.q)} <small class="muted">(${step + 1}/${QUIZ.length})</small></h3><div class="row">${s.o.map((o, i) => `<button type="button" class="btn" data-quiz="${i}">${esc(o[0])}</button>`).join("")}</div>`;
      return;
    }
    const score = D.clubs.map((c) => ({ c, s: c.category.filter((x) => picks.includes(x)).length })).sort((a, b) => b.s - a.s).filter((x) => x.s > 0).slice(0, 3);
    box.innerHTML = `<h3>Closest category matches</h3><p class="muted">Counts how many of a club’s category tags match your answers. Not a validated assessment.</p><div class="grid">${score.map((x) => clubCard(x.c)).join("") || "<p>No match yet — try the full list below.</p>"}</div><div class="row"><button type="button" class="btn small ghost" data-quiz="reset">Retake</button></div>`;
  }
  if ($("#quizBox")) $("#quizBox").addEventListener("click", (e) => {
    const b = e.target.closest("[data-quiz]"); if (!b) return;
    if (b.dataset.quiz === "reset") { step = 0; picks = []; } else { picks.push(...QUIZ[step].o[+b.dataset.quiz][1]); step++; }
    renderQuiz();
  });
  const _renderAll = renderAll;
  renderAll = function () { _renderAll(); if (step >= QUIZ.length) renderQuiz(); };

  /* ---------- NEW: surprise me, "/" shortcut, spotlight ---------- */
  $("#surprise").addEventListener("click", () => {
    const c = D.clubs[Math.floor(Math.random() * D.clubs.length)];
    state.q = c.name; state.chip = "All"; $("#search").value = c.name; renderStatic(); renderAll();
    $("#clubs").scrollIntoView({ behavior: "smooth" });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); $("#search").focus(); }
  });
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest && e.target.closest(".card"); if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px"); card.style.setProperty("--my", e.clientY - r.top + "px");
  });

  /* ---------- NEW: share / download plan ---------- */
  function planText() {
    const src = { clubs: D.clubs, events: D.events, resources: D.resources };
    return Object.keys(src).map((k) => plan[k].map((id) => (src[k].find((x) => x.id === id) || {}).name).filter(Boolean).map((n) => `[${k.slice(0, -1)}] ${n}`).join("\n")).filter(Boolean).join("\n") || "My plan is empty.";
  }
  $("#copyPlan").addEventListener("click", () => {
    const done = (t) => ($("#planMsg").textContent = t);
    navigator.clipboard ? navigator.clipboard.writeText(planText()).then(() => done("Copied."), () => done("Copy blocked by browser.")) : done("Copy not supported here.");
  });
  $("#dlPlan").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" }));
    a.download = "my-campus-plan.json"; a.click(); URL.revokeObjectURL(a.href);
  });

  /* ---------- v4: trust filter, clear, focus return, active nav, data tiles ---------- */
  $("#hClubs").textContent = D.clubs.length;
  $("#hVerified").textContent = D.clubs.filter((c) => c.verified).length;
  $("#verifiedOnly").addEventListener("change", (e) => { state.verifiedOnly = e.target.checked; renderAll(); });
  $("#clearFilters").addEventListener("click", () => {
    state.q = ""; state.chip = "All"; state.verifiedOnly = false; state.ev = {};
    $("#search").value = ""; $("#verifiedOnly").checked = false; renderStatic(); renderAll();
  });
  let opener = null;
  document.addEventListener("click", (e) => { const b = e.target.closest('[data-act="register"]'); if (b) opener = b; });
  $("#regModal").addEventListener("close", () => { if (opener) opener.focus(); });
  if ("IntersectionObserver" in window) {
    const links = [...document.querySelectorAll(".nav nav a")];
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) links.forEach((a) => a.toggleAttribute("aria-current", a.getAttribute("href") === "#" + en.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
    links.forEach((a) => { const s = document.querySelector(a.getAttribute("href")); if (s) io.observe(s); });
  }

  renderStatic(); renderAll(); renderQuiz();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    if (F.pwa) navigator.serviceWorker.register("sw.js").catch(() => {});
    else navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
  }
})();
