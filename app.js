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
      <a class="btn sm" href="${phone}">Заказать</a>
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
}

qEl.addEventListener("input", () => {
  query = qEl.value;
  page = 1;
  render();
});

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
