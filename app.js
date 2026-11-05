const P=[
  ["Замок врезной Punto LOCKSET25.ORION.5558-1 AB","Замки",54,"img/p01.webp"],
  ["Ручки дверные Code Deco Fusion H-100154-A-BLM","Ручки",62.5,"img/p02.webp"],
  ["Задвижка накладная СИ ЗТ-150 (черный)","Замки",12.8,"img/p03.webp"],
  ["Доводчик дверной Vela DC-45-BL (черный)","Доводчики",79,"img/p04.webp"],
  ["Ручки дверные Vela Steel Поло (черный)","Ручки",45,"img/p05.webp"],
  ["Ручки дверные VSTE Амата (матовый никель)","Ручки",49.9,"img/p06.webp"],
  ["Ручки дверные VSTE Арко (матовое золото)","Ручки",114,"img/p07.webp"],
  ["Петля скрытой установки Vela 110×30-2.2 MSN","Петли",49,"img/p08.webp"]
];
document.getElementById("list").innerHTML=P.map(([n,c,p,img])=>
  `<div class="card"><div class="img"><img src="${img}" alt="${n}" loading="lazy"></div><small>${c}</small><h3>${n}</h3><div class="row"><b>${p.toFixed(2)} BYN</b><a class="btn sm" href="#contacts">Заказать</a></div></div>`
).join("");
