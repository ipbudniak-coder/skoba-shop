const PAGE = 24;
const phone = "tel:+375256981184";
const tg = "https://t.me/BudnyakDA";
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

let products = [];
let categories = [];
let cat = "all";
let series = "all";
let model = "all";
let color = "all";
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

function pageSize() {
  return series === "Vela Eco" ? 48 : PAGE;
}

function ecoProducts() {
  return products.filter(p => p.series === "Vela Eco");
}

function filtered() {
  const q = query.trim().toLowerCase();
  let items = products.filter(p => {
    if (cat !== "all" && p.category !== cat) return false;
    if (series !== "all" && p.series !== series) return false;
    if (model !== "all" && p.model !== model) return false;
    if (color !== "all" && p.color !== color) return false;
    if (!q) return true;
    return [p.name, p.article, p.id, p.model, p.color, p.series, p.category]
      .join(" ").toLowerCase().includes(q);
  });
  if (series === "Vela Eco") {
    items = items.slice().sort((a, b) => {
      const byModel = String(a.model || "").localeCompare(String(b.model || ""), "ru");
      if (byModel) return byModel;
      if (!!a.clearance !== !!b.clearance) return a.clearance ? 1 : -1;
      return String(a.color || "").localeCompare(String(b.color || ""), "ru");
    });
  }
  return items;
}

function chip(label, active, attr) {
  return `<button type="button" class="chip${active ? " is-active" : ""}" aria-pressed="${active ? "true" : "false"}" ${attr}>${esc(label)}</button>`;
}

function renderSeries() {
  const eco = ecoProducts();
  const models = new Set(eco.map(p => p.model));
  const clearance = eco.filter(p => p.clearance).length;
  const regular = eco.length - clearance;
  document.getElementById("series-btns").innerHTML = [
    chip("Все товары", series === "all", 'data-series="all"'),
    chip(`Vela Eco · ${eco.length}`, series === "Vela Eco", 'data-series="Vela Eco"')
  ].join("");
  const lead = document.getElementById("series-lead");
  if (series === "Vela Eco") {
    lead.textContent = `Vela Eco: ${models.size} моделей, ${regular} обычных артикулов и ${clearance} уценка. Цены розничные, BYN. Наличие — склад поставщика на 07.11.2026, это не полка павильона 73. Линейка Vela Prima сюда не входит.`;
  } else {
    lead.textContent = `Полная серия раздельных ручек Vela Eco: ${models.size} моделей, ${regular} артикулов и ${clearance} уценка. Откройте фильтр, чтобы смотреть только её.`;
  }
  const modelHost = document.getElementById("model-btns");
  const colorHost = document.getElementById("color-btns");
  const search = document.getElementById("q");
  if (search) search.placeholder = series === "Vela Eco" ? "Поиск внутри серии Vela Eco…" : "Поиск по названию или артикулу…";
  if (series !== "Vela Eco") { modelHost.innerHTML = ""; colorHost.innerHTML = ""; return; }
  const modelNames = [...models].sort((a, b) => String(a).localeCompare(String(b), "ru"));
  modelHost.innerHTML = [
    chip("Все модели", model === "all", 'data-model="all"'),
    ...modelNames.map(name => {
      const n = eco.filter(p => p.model === name).length;
      return chip(`${name} · ${n}`, model === name, `data-model="${esc(name)}"`);
    })
  ].join("");
  const pool = model === "all" ? eco : eco.filter(p => p.model === model);
  const colors = [...new Set(pool.map(p => p.color))].sort((a, b) => String(a).localeCompare(String(b), "ru"));
  colorHost.innerHTML = [
    chip("Все цвета", color === "all", 'data-color="all"'),
    ...colors.map(name => {
      const n = pool.filter(p => p.color === name).length;
      return chip(`${name} · ${n}`, color === name, `data-color="${esc(name)}"`);
    })
  ].join("");
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
      series = "all";
      model = "all";
      color = "all";
      page = 1;
      if (location.hash === "#vela-eco") history.replaceState(null, "", location.pathname + location.search);
      render();
    });
  });
}

function orderLabel(p) {
  const art = p.article || "";
  return p.name + (art ? " (арт. " + art + ")" : "") + " — " + money(p.price);
}

function bindImgError(img) {
  img.addEventListener("error", () => {
    const d = document.createElement("div");
    d.className = "no-photo";
    d.textContent = "Фото недоступно";
    img.replaceWith(d);
  });
}

function supplierText(p) {
  if (p.supplier_availability === "Нет в наличии") {
    return `<p class="status status-out">У поставщика: нет в наличии. Последняя розничная цена сохранена.</p>`;
  }
  const label = p.supplier_availability === "Есть на складе" ? "есть на складе" : p.supplier_availability;
  return `<p class="status status-ok">У поставщика: ${esc(label)}.</p>`;
}

function velaCard(p) {
  const href = p.url || "#contacts";
  const spindle = (p.specifications || {})["Длина квадрата"] || "";
  const photo = p.image
    ? `<button type="button" class="img-btn more-btn" data-id="${esc(p.id)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="320" height="320"></button>`
    : `<div class="no-photo">Фото недоступно</div>`;
  const clearance = p.clearance
    ? `<p class="warn">${esc(p.description || "Уценка")} Длина квадрата: ${esc(spindle)}.</p>`
    : (p.description ? "" : `<p class="warn">Описание у поставщика не опубликовано.</p>`);
  return `<article class="card card-vela" data-sku="${esc(p.article)}" data-series="Vela Eco" data-model="${esc(p.model)}" data-color="${esc(p.color)}">
    ${photo}
    <small>Vela Eco · ${esc(p.category || "")}</small>
    <h3><a href="${esc(href)}" target="_blank" rel="noopener">${esc(p.name)}</a></h3>
    <p class="meta">Модель ${esc(p.model)} · ${esc(p.color)} · арт. ${esc(p.article)}</p>
    ${clearance}
    ${supplierText(p)}
    <p class="status">Павильон 73: не проверено.</p>
    <div class="row">
      <b class="price">${money(p.price)}</b>
      <button type="button" class="btn sm order-btn" data-name="${esc(orderLabel(p))}">Заказать</button>
    </div>
    <div class="links">
      <button type="button" class="btn sm more-btn" data-id="${esc(p.id)}">Характеристики</button>
      <a href="${esc(href)}" target="_blank" rel="noopener">Сайт поставщика</a>
    </div>
  </article>`;
}

function card(p) {
  if (p.series === "Vela Eco") return velaCard(p);
  const href = p.url || "#contacts";
  return `<article class="card" data-sku="${esc(p.article || "")}">
    <a class="img" href="${esc(href)}" target="_blank" rel="noopener">
      <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="240" height="240">
    </a>
    <small>${esc(p.category || "")}</small>
    <h3><a href="${esc(href)}" target="_blank" rel="noopener">${esc(p.name)}</a></h3>
    <div class="row">
      <b class="price">${money(p.price)}</b>
      <button type="button" class="btn sm order-btn" data-name="${esc(orderLabel(p))}">Заказать</button>
    </div>
    <div class="links">
      <a href="${esc(href)}" target="_blank" rel="noopener">Описание товара</a>
      <a href="${tg}" target="_blank" rel="noopener">Telegram</a>
    </div>
  </article>`;
}

function detailHtml(p) {
  const specs = p.specifications || {};
  const spindle = specs["Длина квадрата"] || "";
  const rose = specs["Материал внутренней розетки"] || "";
  const gallery = (p.gallery && p.gallery.length ? p.gallery : (p.image ? [{ src: p.image, alt: p.name, kind: "product" }] : []))
    .map(g => `<figure><img src="${esc(g.src)}" alt="${esc(g.alt || p.name)}"><figcaption>${g.kind === "pack" ? "Упаковка. Цвет ручки на этом фото не виден." : "Фото этого артикула с сайта поставщика."}</figcaption></figure>`)
    .join("") || `<div class="no-photo">Фото недоступно</div>`;
  let about;
  if (p.clearance) {
    about = `<p class="warn">${esc(p.description || "Уценка.")} Длина квадрата: ${esc(spindle)}. Материал внутренней розетки: ${esc(rose)}.</p>`;
  } else if (p.description) {
    about = `<h4>Описание поставщика</h4><p>${esc(p.description)}</p>`;
  } else {
    about = `<p class="warn">Описание у поставщика не опубликовано. Текст не добавлен.</p>`;
  }
  const rows = Object.entries(specs).map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("");
  return `<p class="pdp-price">${money(p.price)}</p>
    <p>Модель ${esc(p.model)} · цвет ${esc(p.color)} · арт. ${esc(p.article)}</p>
    <p>Серия Vela Eco, раздел поставщика vela-standart, сверено 07.11.2026. Это не линейка Vela Prima.</p>
    ${supplierText(p)}
    <p class="status">Павильон 73: не проверено. Заказ нужен, чтобы уточнить витрину.</p>
    ${about}
    ${p.spec_color_note ? `<p class="warn">${esc(p.spec_color_note)}</p>` : ""}
    <div class="pdp-gallery">${gallery}</div>
    <table class="specs"><caption>Характеристики со страницы поставщика</caption><tbody>${rows}</tbody></table>
    <div class="pdp-actions">
      <button type="button" class="btn order-btn" data-name="${esc(orderLabel(p))}">Заказать</button>
      <a class="btn ghost dark" href="${esc(p.url)}" target="_blank" rel="noopener">Сайт поставщика</a>
    </div>`;
}

let pdpReturn = null;
function openDetail(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  pdpReturn = document.activeElement;
  document.getElementById("pdp-title").textContent = p.name;
  document.getElementById("pdp-body").innerHTML = detailHtml(p);
  const box = document.getElementById("pdp");
  box.hidden = false;
  document.getElementById("pdp-close").focus();
  box.querySelectorAll(".order-btn").forEach(btn => {
    btn.addEventListener("click", () => { closeDetail(); openOrder(btn.dataset.name); });
  });
  box.querySelectorAll("img").forEach(bindImgError);
}
function closeDetail() {
  const box = document.getElementById("pdp");
  if (!box || box.hidden) return;
  box.hidden = true;
  if (pdpReturn && pdpReturn.focus) pdpReturn.focus();
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
  renderSeries();
  const size = pageSize();
  const items = filtered();
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  if (page > totalPages) page = totalPages;
  const slice = items.slice((page - 1) * size, page * size);
  listEl.classList.toggle("series-on", series === "Vela Eco");
  listEl.innerHTML = slice.length ? slice.map(card).join("") :
    `<p class="empty">Ничего не найдено. Попробуйте другой запрос или <a href="${phone}">позвоните</a>.</p>`;
  countEl.textContent = `Показано ${slice.length ? ((page - 1) * size + 1) : 0}–${(page - 1) * size + slice.length} из ${items.length}`;
  renderPager(totalPages);
  listEl.querySelectorAll("img").forEach(bindImgError);
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

(function () {
  const form = document.getElementById("order-form");
  if (!form || !window.fetch || !window.FormData) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const btn = form.querySelector("button");
    if (btn) btn.disabled = true;
    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(r => r.json().catch(() => ({})).then(j => {
        if (!(r.ok && j && j.ok === true)) throw new Error("send failed");
        form.reset(); form.hidden = true;
        const sent = document.getElementById("order-sent");
        if (sent) { sent.hidden = false; sent.scrollIntoView({ behavior: "smooth", block: "center" }); }
      }))
      .catch(() => { if (btn) btn.disabled = false; HTMLFormElement.prototype.submit.call(form); });
  });
})();

if (location.hash === "#order-sent") {
  const form = document.getElementById("order-form");
  const sent = document.getElementById("order-sent");
  if (form) form.hidden = true;
  if (sent) sent.hidden = false;
}


qEl.addEventListener("input", () => {
  query = qEl.value;
  if (query.trim()) { model = "all"; color = "all"; }
  page = 1;
  render();
});

/* Прайс-лист */
const PPAGE = 50;
let price = [], pq = "", pstock = false, ppage = 1;
function priceAvailability(x) {
  if (x.series === "Vela Eco") {
    return x.s
      ? '<span class="pa note">У поставщика: есть на складе. Павильон 73: не проверено.</span>'
      : '<span class="pa note"><span class="no">У поставщика: нет в наличии.</span> Последняя розничная цена сохранена. Павильон 73: не проверено.</span>';
  }
  return x.s ? "" : ' · <span class="no">нет в наличии</span>';
}
function renderPrice() {
  const q = pq.trim().toLowerCase();
  const items = price.filter(x => (!pstock || x.s) && (!q || x.n.toLowerCase().includes(q) || String(x.a || "").toLowerCase().includes(q) || String(x.id) === q || String(x.series || "").toLowerCase().includes(q)));
  const tp = Math.max(1, Math.ceil(items.length / PPAGE));
  if (ppage > tp) ppage = tp;
  const sl = items.slice((ppage - 1) * PPAGE, ppage * PPAGE);
  const el = document.getElementById("plist");
  el.innerHTML = sl.length ? sl.map(x => `<div class="prow" data-sku="${esc(x.a || "")}" data-series="${esc(x.series || "")}">
    <div class="pn">${esc(x.n)}<span class="pa">Арт. ${esc(x.a || "—")} · код ${x.id}${x.series === "Vela Eco" ? "" : priceAvailability(x)}</span>${x.series === "Vela Eco" ? priceAvailability(x) : ""}</div>
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
  if (location.hash === "#vela-eco") {
    series = "Vela Eco";
    cat = "all";
    model = "all";
    color = "all";
    page = 1;
  }
  render();
}).catch(() => {
  countEl.textContent = "Не удалось загрузить каталог. Обновите страницу.";
});

listEl.addEventListener("click", e => {
  const more = e.target.closest(".more-btn");
  const order = e.target.closest(".order-btn");
  if (more) openDetail(more.dataset.id);
  else if (order) openOrder(order.dataset.name);
});
document.getElementById("series-btns").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.series === "Vela Eco") {
    if (location.hash !== "#vela-eco") location.hash = "vela-eco";
    else if (series !== "Vela Eco") {
      series = "Vela Eco"; cat = "all"; model = "all"; color = "all"; page = 1; render();
    }
    return;
  }
  series = "all"; model = "all"; color = "all"; page = 1;
  if (location.hash === "#vela-eco") history.replaceState(null, "", location.pathname + location.search);
  render();
});
document.getElementById("model-btns").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  model = b.dataset.model;
  color = "all";
  page = 1;
  render();
});
document.getElementById("color-btns").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  color = b.dataset.color;
  page = 1;
  render();
});
document.getElementById("pdp-close").addEventListener("click", closeDetail);
document.getElementById("pdp").addEventListener("click", e => { if (e.target.id === "pdp") closeDetail(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeDetail();
});
window.addEventListener("hashchange", () => {
  if (location.hash !== "#vela-eco") return;
  series = "Vela Eco";
  cat = "all";
  model = "all";
  color = "all";
  page = 1;
  render();
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
      fetch("https://sendm8.com/f/ipbudniak@gmail.com", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: "СКОБА ПАРТНЕР: " + p.code + " (" + name + ")", "Тип заявки": "Регистрация партнёра",
          "Код партнёра": p.code, "Имя партнёра": name, "Телефон": phone, _gotcha: "" })
      }).then(r => r.json().catch(() => ({})).then(j => {
        // ok:true (incl. pending:"confirmation") = stored by sendm8, delivered after email confirm
        if (r.ok && j && j.ok === true) { sent.push(p.code); ls.set(SENT, sent); }
      })).catch(() => {});
    } catch (err) {}
  });
})();

/* ===== Слово на сегодня ===== */
(function () {
  const quoteEl = document.getElementById("word-quote");
  const refEl = document.getElementById("word-ref");
  const btn = document.getElementById("word-next");
  if (!quoteEl || !refEl || !btn) return;
  let quotes = [];
  let idx = 0;

  function dayIndex(n) {
    const d = new Date();
    const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const day = Math.floor(utc / 864e5);
    return ((day % n) + n) % n;
  }

  function show(i) {
    if (!quotes.length) return;
    idx = ((i % quotes.length) + quotes.length) % quotes.length;
    const q = quotes[idx];
    quoteEl.textContent = "«" + q.text + "»";
    refEl.textContent = q.ref;
  }

  fetch("data/quotes.json")
    .then(r => r.json())
    .then(list => {
      quotes = Array.isArray(list) ? list : [];
      if (!quotes.length) throw new Error("empty");
      show(dayIndex(quotes.length));
    })
    .catch(() => {
      quoteEl.textContent = "Не удалось загрузить цитату. Обновите страницу.";
      refEl.textContent = "";
    });

  btn.addEventListener("click", () => {
    if (quotes.length < 2) { show(idx); return; }
    let next = Math.floor(Math.random() * quotes.length);
    if (next === idx) next = (idx + 1) % quotes.length;
    show(next);
  });
})();
