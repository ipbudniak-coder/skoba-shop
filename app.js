const PAGE = 24;
const phone = "tel:+375256981184";
const tg = "https://t.me/BudnyakDA";

let products = [];
let categories = [];
let cat = "all";
let query = "";
let page = 1;

const listEl = document.getElementById("list");
const catsEl = document.getElementById("cats");
const countEl = document.getElementById("count");
const pagerEl = document.getElementById("pager");
const qEl = document.getElementById("q");

function money(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "цена по запросу";
  return x.toFixed(2).replace(".", ",") + " BYN";
}

function filtered() {
  const q = query.trim().toLowerCase();
  return products.filter(p => {
    if (cat !== "all" && p.category !== cat) return false;
    if (!q) return true;
    return (p.name || "").toLowerCase().includes(q) ||
      String(p.article || "").toLowerCase().includes(q) ||
      String(p.id).includes(q);
  });
}

function renderCats() {
  const total = products.length;
  const items = [{ name: "Все товары", slug: "all", count: total }, ...categories];
  catsEl.innerHTML = items.map(c => {
    const active = (c.slug === "all" ? cat === "all" : cat === c.name) ? " is-active" : "";
    const key = c.slug === "all" ? "all" : c.name;
    return `<button type="button" class="cat-btn${active}" data-cat="${key.replace(/"/g, "&quot;")}">${c.name}<span>${c.count}</span></button>`;
  }).join("");
  catsEl.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      cat = btn.dataset.cat;
      page = 1;
      render();
    });
  });
}

function card(p) {
  const href = p.url || "#contacts";
  return `<article class="card">
    <a class="img" href="${href}" target="_blank" rel="noopener">
      <img src="${p.image}" alt="${p.name.replace(/"/g, "&quot;")}" loading="lazy" width="240" height="240">
    </a>
    <small>${p.category || ""}</small>
    <h3><a href="${href}" target="_blank" rel="noopener">${p.name}</a></h3>
    <div class="row">
      <b>${money(p.price)}</b>
      <button type="button" class="btn sm order-btn" data-name="${p.name.replace(/"/g, '&quot;')}">Заказать</button>
    </div>
    <div class="links">
      <a href="${href}" target="_blank" rel="noopener">Описание товара</a>
      <a href="${tg}" target="_blank" rel="noopener">Telegram</a>
    </div>
  </article>`;
}

function renderPager(totalPages) {
  if (totalPages <= 1) { pagerEl.innerHTML = ""; return; }
  let html = "";
  if (page > 1) html += `<button type="button" data-p="${page - 1}">← Назад</button>`;
  html += `<span>${page} / ${totalPages}</span>`;
  if (page < totalPages) html += `<button type="button" data-p="${page + 1}">Вперёд →</button>`;
  pagerEl.innerHTML = html;
  pagerEl.querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      page = Number(b.dataset.p);
      render();
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function render() {
  renderCats();
  const items = filtered();
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE));
  if (page > totalPages) page = totalPages;
  const slice = items.slice((page - 1) * PAGE, page * PAGE);
  listEl.innerHTML = slice.length ? slice.map(card).join("") :
    `<p class="empty">Ничего не найдено. Попробуйте другой запрос или <a href="${phone}">позвоните</a>.</p>`;
  countEl.textContent = `Показано ${slice.length ? ((page - 1) * PAGE + 1) : 0}–${(page - 1) * PAGE + slice.length} из ${items.length}`;
  renderPager(totalPages);
  listEl.querySelectorAll(".order-btn").forEach(btn => {
    btn.addEventListener("click", () => openOrder(btn.dataset.name));
  });
}

function openOrder(productName) {
  const input = document.getElementById("order-product");
  if (input) input.value = productName || "";
  const form = document.getElementById("order-form");
  if (form) form.hidden = false;
  const sent = document.getElementById("order-sent");
  if (sent) sent.hidden = true;
  document.getElementById("order").scrollIntoView({ behavior: "smooth", block: "start" });
  const name = document.querySelector("#order-form input[name=name]");
  if (name) setTimeout(() => name.focus(), 300);
}

if (location.hash === "#order-sent") {
  const form = document.getElementById("order-form");
  const sent = document.getElementById("order-sent");
  if (form) form.hidden = true;
  if (sent) sent.hidden = false;
}


qEl.addEventListener("input", () => {
  query = qEl.value;
  page = 1;
  render();
});

/* Прайс-лист */
const PPAGE = 50;
let price = [], pq = "", pstock = false, ppage = 1;
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
function renderPrice() {
  const q = pq.trim().toLowerCase();
  const items = price.filter(x => (!pstock || x.s) && (!q || x.n.toLowerCase().includes(q) || x.a.toLowerCase().includes(q) || String(x.id) === q));
  const tp = Math.max(1, Math.ceil(items.length / PPAGE));
  if (ppage > tp) ppage = tp;
  const sl = items.slice((ppage - 1) * PPAGE, ppage * PPAGE);
  const el = document.getElementById("plist");
  el.innerHTML = sl.length ? sl.map(x => `<div class="prow">
    <div class="pn">${esc(x.n)}<span class="pa">Арт. ${esc(x.a || "—")} · код ${x.id}${x.s ? "" : ' · <span class="no">нет в наличии</span>'}</span></div>
    <div class="pp"><small>Розничная цена</small>${money(x.p)}</div>
    <button type="button" class="btn sm porder" data-name="${esc(x.n + (x.a ? " (арт. " + x.a + ")" : "") + " — " + money(x.p))}">Заказать</button>
  </div>`).join("") : `<p class="empty">Ничего не найдено.</p>`;
  document.getElementById("pcount").textContent = `Показано ${sl.length ? (ppage - 1) * PPAGE + 1 : 0}–${(ppage - 1) * PPAGE + sl.length} из ${items.length}`;
  el.querySelectorAll(".porder").forEach(b => b.addEventListener("click", () => openOrder(b.dataset.name)));
  const pg = document.getElementById("ppager");
  let h = "";
  if (ppage > 1) h += `<button type="button" data-p="${ppage - 1}">← Назад</button>`;
  h += `<span>${ppage} / ${tp}</span>`;
  if (ppage < tp) h += `<button type="button" data-p="${ppage + 1}">Вперёд →</button>`;
  pg.innerHTML = tp > 1 ? h : "";
  pg.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    ppage = Number(b.dataset.p); renderPrice();
    document.getElementById("price").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}
document.getElementById("pq").addEventListener("input", e => { pq = e.target.value; ppage = 1; renderPrice(); });
document.getElementById("pstock").addEventListener("change", e => { pstock = e.target.checked; ppage = 1; renderPrice(); });
fetch("data/price.json").then(r => r.json()).then(d => {
  price = d.items;
  document.getElementById("price-total").textContent = d.count;
  renderPrice();
}).catch(() => { document.getElementById("pcount").textContent = "Не удалось загрузить прайс. Обновите страницу."; });

Promise.all([
  fetch("data/products.json").then(r => r.json()),
  fetch("data/categories.json").then(r => r.json())
]).then(([p, c]) => {
  products = p;
  categories = c;
  render();
}).catch(() => {
  countEl.textContent = "Не удалось загрузить каталог. Обновите страницу.";
});

/* ===== Реферальная программа ===== */
(function () {
  const SITE = "https://ipbudniak-coder.github.io/skoba-shop/";
  const KEY = "skoba_ref_code", MY = "skoba_my_partner", SENT = "skoba_ref_sent";
  const TTL = 90 * 864e5;
  const ls = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
               set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const clean = v => { const d = String(v || "").toUpperCase().replace(/[^0-9]/g, ""); return d.length === 5 ? "SK-" + d : ""; };
  const fromUrl = clean(new URLSearchParams(location.search).get("ref"));
  if (fromUrl) ls.set(KEY, { code: fromUrl, date: Date.now() });
  let saved = ls.get(KEY);
  if (saved && Date.now() - saved.date > TTL) { localStorage.removeItem(KEY); saved = null; }
  const code = saved && saved.code;
  if (code) {
    const b = document.getElementById("ref-banner");
    b.innerHTML = "🎁 Вы перешли по рекомендации партнёра (код <b>" + code + "</b>) — ваша <b>скидка 5%</b> на покупку в павильоне „Скоба“ уже активирована! Оформите заказ на сайте или назовите этот код на кассе.";
    b.hidden = false;
    const f = document.getElementById("order-ref"); if (f && !f.value) f.value = code;
  }
  function hash5(digits) {
    let h = 2166136261;
    const s = "skoba:" + digits;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return String(10000 + (h % 90000));
  }
  function normPhone(p) { let d = String(p).replace(/\D/g, ""); if (d.length === 9) d = "375" + d; if (d.startsWith("80") && d.length === 11) d = "375" + d.slice(2); return d; }
  const msg = t => { document.getElementById("ref-msg").textContent = t; };
  function copy(t, ok) {
    const done = () => msg(ok);
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, () => { prompt("Скопируйте:", t); });
    else prompt("Скопируйте:", t);
  }
  function show(p) {
    const link = SITE + "?ref=" + p.code;
    const text = "Скидка 5% на дверную фурнитуру в павильоне «Скоба» (Витебск) по моему коду " + p.code + ": ";
    document.getElementById("ref-code").textContent = p.code;
    document.getElementById("ref-link").textContent = link;
    document.getElementById("share-tg").href = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(text);
    document.getElementById("share-wa").href = "https://wa.me/?text=" + encodeURIComponent(text + link);
    document.getElementById("share-viber").href = "viber://forward?text=" + encodeURIComponent(text + link);
    document.getElementById("copy-code").onclick = () => copy(p.code, "Код скопирован ✔");
    document.getElementById("copy-link").onclick = () => copy(link, "Ссылка скопирована ✔");
    const n = document.getElementById("share-native");
    if (navigator.share) { n.hidden = false; n.onclick = () => navigator.share({ title: "Скоба", text, url: link }).catch(() => {}); }
    document.getElementById("ref-result").hidden = false;
    document.getElementById("ref-name").value = p.name; document.getElementById("ref-phone").value = p.phone;
  }
  const mine = ls.get(MY); if (mine && mine.code) show(mine);
  document.getElementById("ref-form").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("ref-name").value.trim();
    const phone = document.getElementById("ref-phone").value.trim();
    const digits = normPhone(phone);
    if (!name || digits.length < 9) { alert("Пожалуйста, введите имя и телефон полностью."); return; }
    const p = { code: "SK-" + hash5(digits), name, phone, date: new Date().toISOString() };
    ls.set(MY, p); show(p);
    document.getElementById("ref-result").scrollIntoView({ behavior: "smooth", block: "center" });
    const sent = ls.get(SENT) || [];
    if (sent.includes(p.code)) return;
    try {
      fetch("https://formsubmit.co/ajax/ipbudniak@gmail.com", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: "СКОБА ПАРТНЕР: " + p.code + " (" + name + ")", "Тип заявки": "Регистрация партнёра",
          "Код партнёра": p.code, "Имя партнёра": name, "Телефон": phone, _captcha: "false", _template: "table" })
      }).then(r => { if (r.ok) { sent.push(p.code); ls.set(SENT, sent); } }).catch(() => {});
    } catch (err) {}
  });
})();
