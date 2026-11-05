const PRODUCTS = [
  { name: "Замок врезной Punto LOCKSET25.ORION.5558-1 AB", cat: "Замки", price: 54, img: "img/p01.webp" },
  { name: "Ручки дверные Code Deco Fusion H-100154-A-BLM", cat: "Ручки", price: 62.5, img: "img/p02.webp" },
  { name: "Задвижка накладная СИ ЗТ-150 (черный)", cat: "Замки", price: 12.8, img: "img/p03.webp" },
  { name: "Доводчик дверной Vela DC-45-BL (черный)", cat: "Доводчики", price: 79, img: "img/p04.webp" },
  { name: "Ручки дверные Vela Steel Поло (черный)", cat: "Ручки", price: 45, img: "img/p05.webp" },
  { name: "Ручки дверные VSTE Амата (матовый никель)", cat: "Ручки", price: 49.9, img: "img/p06.webp" },
  { name: "Ручки дверные VSTE Арко (матовое золото)", cat: "Ручки", price: 114, img: "img/p07.webp" },
  { name: "Петля скрытой установки Vela 110×30-2.2 MSN", cat: "Петли", price: 49, img: "img/p08.webp" },
  { name: "Ручки дверные VSTE Арко (черный)", cat: "Ручки", price: 99, img: "img/p09.webp" },
  { name: "Петля скрытой установки Vela Satin Gold", cat: "Петли", price: 49, img: "img/p10.webp" },
  { name: "Накладка декоративная Apecs DP-14-S-G", cat: "Замки", price: 4, img: "img/p11.webp" },
  { name: "Петля врезная Apecs 100×70-B-Steel", cat: "Петли", price: 6, img: "img/p12.webp" },
  { name: "Ручки-купе Итарос для раздвижных дверей", cat: "Ручки", price: 13, img: "img/p13.webp" },
  { name: "Замок врезной Vettore 5523-4-CR (хром)", cat: "Замки", price: 44, img: "img/p15.webp" },
  { name: "Ручки дверные Vela Prima Комета BL", cat: "Ручки", price: 45, img: "img/p16.webp" },
  { name: "Доводчик дверной Apecs DC-340", cat: "Доводчики", price: 95, img: "img/p20.webp" }
];

const list = document.getElementById("list");
const count = document.getElementById("count");
const phone = "tel:+375296981184";
const tg = "https://t.me/BudnyakDA";
let current = "all";

function card(p) {
  const price = Number(p.price).toFixed(2);
  return `<article class="card" data-cat="${p.cat}">
    <a class="img" href="${phone}" aria-label="Заказать ${p.name}">
      <img src="${p.img}" alt="${p.name}" loading="lazy" width="280" height="280">
    </a>
    <small>${p.cat}</small>
    <h3>${p.name}</h3>
    <div class="row">
      <b>${price} BYN</b>
      <a class="btn sm" href="${phone}">Заказать</a>
    </div>
    <a class="link" href="${tg}" target="_blank" rel="noopener">Написать в Telegram</a>
  </article>`;
}

function render(cat) {
  current = cat;
  const items = cat === "all" ? PRODUCTS : PRODUCTS.filter(p => p.cat === cat);
  list.innerHTML = items.map(card).join("");
  count.textContent = items.length
    ? `Показано: ${items.length} из ${PRODUCTS.length}`
    : "В этой категории пока пусто — напишите, подберём под заказ.";
  document.querySelectorAll(".filter").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.cat === cat);
  });
}

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => render(btn.dataset.cat));
});

document.querySelectorAll(".cat").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    render(el.dataset.cat);
    document.getElementById("list").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

render("all");
