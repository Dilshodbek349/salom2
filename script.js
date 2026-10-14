// ================= Salom Test — script.js =================
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const DB = {
  get: (k, d = []) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ADMIN_CODE = "SALOM2026"; // admin ro'yxatdan o'tishi uchun maxfiy kod — o'zgartiring
const me = () => DB.get("session", null);
const VIEWS = ["home", "about", "courses", "teachers", "rating", "contact", "auth", "student", "admin"];
const LINKS = [["home", "Bosh sahifa"], ["about", "Maktab haqida"], ["courses", "Kurslar"], ["teachers", "Ustozlar"], ["rating", "Reyting"], ["contact", "Aloqa"]];
let role = "student", mode = "register", draft = [];

// ---------- Dark / Light ----------
document.documentElement.dataset.theme = localStorage.getItem("theme") || "light";
function toggleTheme() {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = t; localStorage.setItem("theme", t);
}

// ---------- Sahifalar (oynalar) ----------
function go(v) {
  const s = me();
  if (!s) v = "auth"; // kirmagan odam faqat ro'yxatdan o'tish sahifasini ko'radi
  else if ((v === "student" || v === "admin") && s.role !== v) v = s.role;
  VIEWS.forEach(x => $("#v-" + x).hidden = x !== v);
  if (v === "rating") drawRating();
  if (v === "student") drawStudent();
  if (v === "admin") { if (!draft.length) addQ(); drawAdmin(); }
  if (v === "auth") setAuth();
  drawNav(v); scrollTo({ top: 0, behavior: "smooth" });
}
function drawNav(cur) {
  const s = me();
  if (!s) { $("#nav").innerHTML = `<span class="logo"><img src="logo.png" alt="Logo"></span><span><a onclick="toggleTheme()">🌓</a></span>`; return; }
  const acc = s ? `<a onclick="go('${s.role}')" class="${cur === s.role ? "on" : ""}">👤 ${esc(s.name)}</a><a onclick="logout()">Chiqish</a>`
                : `<a onclick="go('auth')" class="${cur === "auth" ? "on" : ""}">Kirish</a>`;
  $("#nav").innerHTML = `<span class="logo" onclick="go('home')"><img src="logo.png" alt="Logo"></span><span>` +
    LINKS.map(l => `<a onclick="go('${l[0]}')" class="${cur === l[0] ? "on" : ""}">${l[1]}</a>`).join("") +
    acc + `<a onclick="toggleTheme()">🌓</a></span>`;
}
function logout() { localStorage.removeItem("session"); go("auth"); }

// ---------- Modal ----------
function openModal(title, html) {
  closeModal();
  document.body.insertAdjacentHTML("beforeend", `<div id="modal" onclick="if(event.target===this)closeModal()"><div class="card"><div class="row"><h2>${title}</h2><button class="ghost" onclick="closeModal()">✕</button></div>${html}</div></div>`);
}
function closeModal() { const m = $("#modal"); if (m) m.remove(); }
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// ---------- Ro'yxatdan o'tish / Kirish ----------
function setAuth(r, m) {
  role = r || role; mode = m || mode;
  $$("[data-role]").forEach(b => b.classList.toggle("on", b.dataset.role === role));
  $$("[data-mode]").forEach(b => b.classList.toggle("on", b.dataset.mode === mode));
  $("#nameRow").hidden = mode !== "register";
  $("#codeRow").hidden = !(mode === "register" && role === "admin");
  $("#authTitle").textContent = (role === "admin" ? "Admin " : "O'quvchi ") + (mode === "register" ? "ro'yxatdan o'tish" : "kirish");
  $("#msg").textContent = "";
}
function submitAuth() {
  const users = DB.get("users"), n = $("#name").value.trim(), e = $("#email").value.trim().toLowerCase(), p = $("#pass").value;
  const err = t => $("#msg").textContent = t;
  if (!e || !p) return err("Email va parolni kiriting");
  if (mode === "register") {
    if (!n) return err("Ismni kiriting");
    if (p.length < 4) return err("Parol kamida 4 belgi bo'lsin");
    if (role === "admin" && $("#code").value !== ADMIN_CODE) return err("Admin kodi noto'g'ri");
    if (users.find(x => x.email === e && x.role === role)) return err("Bu email allaqachon ro'yxatdan o'tgan");
    users.push({ name: n, email: e, pass: p, role }); DB.set("users", users);
    DB.set("session", { name: n, email: e, role });
  } else {
    const f = users.find(x => x.email === e && x.pass === p && x.role === role);
    if (!f) return err("Email yoki parol xato");
    DB.set("session", { name: f.name, email: e, role });
  }
  ["name", "email", "pass", "code"].forEach(i => $("#" + i).value = "");
  go(role);
}

// ---------- Admin panel ----------
function addQ() { draft.push({ q: "", o: ["", "", "", ""], c: 0 }); drawDraft(); }
function drawDraft() {
  $("#qs").innerHTML = draft.map((d, i) => `<div class="q"><b>${i + 1}-savol</b>
    <input placeholder="Savol matni" value="${esc(d.q)}" oninput="draft[${i}].q=this.value">
    ${d.o.map((o, j) => `<label><input type="radio" name="c${i}" ${d.c === j ? "checked" : ""} onchange="draft[${i}].c=${j}">
      <input type="text" placeholder="Variant ${j + 1}" value="${esc(o)}" oninput="draft[${i}].o[${j}]=this.value"></label>`).join("")}
    <p>To'g'ri javobni radio tugma bilan belgilang</p></div>`).join("");
}
function saveTest() {
  const t = $("#tTitle").value.trim(), qs = draft.filter(d => d.q.trim() && d.o.every(x => x.trim()));
  if (!t || !qs.length) return openModal("Diqqat", "<p>Test nomi va kamida 1 ta to'liq savol (4 ta variant bilan) kerak.</p>");
  const T = DB.get("tests"); T.push({ id: Date.now(), title: t, by: me().name, qs }); DB.set("tests", T);
  draft = []; $("#tTitle").value = ""; addQ(); drawAdmin();
  openModal("Tayyor! ✅", "<p>Test saqlandi va o'quvchilarga ko'rinadi.</p>");
}
function delTest(id) { DB.set("tests", DB.get("tests").filter(t => t.id !== id)); drawAdmin(); }
function drawAdmin() {
  const T = DB.get("tests"), R = DB.get("results"), M = DB.get("messages");
  $("#tests").innerHTML = T.length ? T.map(t => `<div class="row q"><span>${esc(t.title)} (${t.qs.length} savol)</span><button class="danger" onclick="delTest(${t.id})">O'chirish</button></div>`).join("") : "<p>Hali test yo'q</p>";
  $("#res").innerHTML = R.length ? R.map(r => `<tr><td>${esc(r.student)}</td><td>${esc(r.title)}</td><td>${r.score}/${r.total}</td><td>${r.date}</td></tr>`).join("") : "<tr><td colspan=4>Natijalar yo'q</td></tr>";
  $("#msgs").innerHTML = M.length ? M.map(m => `<div class="q"><b>${esc(m.n)}</b> · <small>${m.date}</small><p>${esc(m.m)}</p></div>`).join("") : "<p>Xabarlar yo'q</p>";
}

// ---------- O'quvchi paneli ----------
function drawStudent() {
  $("#take").innerHTML = ""; const T = DB.get("tests");
  $("#list").innerHTML = T.length ? T.map(t => `<div class="card"><h2>${esc(t.title)}</h2><p>${t.qs.length} ta savol · muallif: ${esc(t.by)}</p><br><button onclick="startTest(${t.id})">Boshlash</button></div>`).join("") : "<div class='card'><p>Hozircha testlar yo'q. Admin test yaratganda shu yerda paydo bo'ladi.</p></div>";
  const R = DB.get("results").filter(r => r.email === me().email);
  $("#my").innerHTML = R.length ? R.map(r => `<tr><td>${esc(r.title)}</td><td>${r.score}/${r.total}</td><td>${r.date}</td></tr>`).join("") : "<tr><td colspan=3>Natijalar yo'q</td></tr>";
}
function startTest(id) {
  const t = DB.get("tests").find(x => x.id === id); $("#list").innerHTML = "";
  $("#take").innerHTML = `<div class="card"><h2>${esc(t.title)}</h2>${t.qs.map((q, i) => `<div class="q"><b>${i + 1}. ${esc(q.q)}</b>${q.o.map((o, j) => `<label><input type="radio" name="a${i}" value="${j}">${esc(o)}</label>`).join("")}</div>`).join("")}<button onclick="finish(${id})">Yakunlash</button> <button class="ghost" onclick="drawStudent()">Bekor qilish</button></div>`;
  scrollTo({ top: 0, behavior: "smooth" });
}
function finish(id) {
  const t = DB.get("tests").find(x => x.id === id); let s = 0;
  t.qs.forEach((q, i) => { const a = $(`input[name=a${i}]:checked`); if (a && +a.value === q.c) s++; });
  const R = DB.get("results");
  R.push({ email: me().email, student: me().name, title: t.title, score: s, total: t.qs.length, date: new Date().toLocaleString() });
  DB.set("results", R); drawStudent();
  openModal("Natijangiz 🎉", `<p style="font-size:1.6rem;font-weight:700;color:var(--blue)">${s} / ${t.qs.length}</p>`);
}

// ---------- Kurslar, reyting, aloqa ----------
const COURSES = {
  "Manga chizish asoslari": "Chiziq, nisbat va personaj yaratish. 12 hafta, haftada 2 dars.",
  "Rang va tush": "Tush, marker va raqamli bo'yoq bilan ishlash. 8 hafta.",
  "Hikoya va storyboard": "Syujet, kadrlar ketma-ketligi va dialog yozish. 10 hafta.",
  "Yapon tili asoslari": "Manga o'qish uchun hiragana, katakana va oddiy so'zlar. 16 hafta."
};
$("#courseList").innerHTML = Object.keys(COURSES).map(n => `<div class="card"><h2>${n}</h2><button onclick="showCourse('${n}')">Batafsil</button></div>`).join("");
function showCourse(n) { openModal(n, `<p>${COURSES[n]}</p><br><button onclick="closeModal();go('auth')">Yozilish</button>`); }
function drawRating() {
  const A = {};
  DB.get("results").forEach(r => { A[r.student] = A[r.student] || { s: 0, t: 0, n: 0 }; A[r.student].s += r.score; A[r.student].t += r.total; A[r.student].n++; });
  const rows = Object.entries(A).sort((a, b) => b[1].s - a[1].s);
  $("#rt").innerHTML = rows.length ? rows.map((r, i) => `<tr><td>${["🥇", "🥈", "🥉"][i] || i + 1}</td><td>${esc(r[0])}</td><td>${r[1].n}</td><td>${r[1].s}/${r[1].t}</td></tr>`).join("") : "<tr><td colspan=4>Hali natijalar yo'q</td></tr>";
}
function sendContact() {
  const n = $("#cn").value.trim(), m = $("#cm").value.trim();
  if (!n || !m) return openModal("Diqqat", "<p>Ism va xabarni yozing.</p>");
  const L = DB.get("messages"); L.push({ n, m, date: new Date().toLocaleString() }); DB.set("messages", L);
  $("#cn").value = $("#cm").value = "";
  openModal("Rahmat!", "<p>Xabaringiz yuborildi. Tez orada javob beramiz.</p>");
}

// ---------- AI yordamchi bot ----------
// Hozir oddiy qoidalar asosida ishlaydi. Haqiqiy AI uchun shu funksiyaga API so'rovi qo'shiladi.
function ask() {
  const i = $("#botIn"), q = i.value.trim(); if (!q) return;
  const L = $("#botLog"); L.innerHTML += `<div class="me">${esc(q)}</div>`; i.value = "";
  const l = q.toLowerCase(); let a = "Buni tushunmadim. Test, ro'yxatdan o'tish yoki natija haqida so'rang.";
  if (l.includes("salom")) a = "Salom! Qanday yordam beray?";
  else if (l.includes("test") && (l.includes("qanday") || l.includes("yech"))) a = "O'quvchi sifatida kiring, testni tanlang, javoblarni belgilab 'Yakunlash' ni bosing.";
  else if (l.includes("admin")) a = "Admin ro'yxatdan o'tishi uchun maxsus kod kerak. Test yaratish admin panelida.";
  else if (l.includes("ro'yxat") || l.includes("royxat") || l.includes("registr")) a = "'Kirish' tugmasi orqali o'quvchi yoki admin rolini tanlab ro'yxatdan o'ting.";
  else if (l.includes("natija") || l.includes("ball")) a = "Natijalaringiz o'quvchi panelining pastida, umumiy jadval esa 'Reyting' sahifasida.";
  else if (l.includes("dark") || l.includes("tun") || l.includes("rejim")) a = "Menyudagi 🌓 tugmasi dark va light rejimni almashtiradi.";
  setTimeout(() => { L.innerHTML += `<div>${a}</div>`; L.scrollTop = L.scrollHeight; }, 300);
}

// ---------- Tugma bosilganda suyuq to'lqin ----------
document.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || b.id === "botBtn") return;
  const r = b.getBoundingClientRect(), s = document.createElement("span");
  s.className = "ripple"; s.style.left = e.clientX - r.left + "px"; s.style.top = e.clientY - r.top + "px";
  b.appendChild(s); setTimeout(() => s.remove(), 600);
});

// ---------- Boshlash: birinchi bo'lib ro'yxatdan o'tish ----------
go(me() ? me().role : "auth");
