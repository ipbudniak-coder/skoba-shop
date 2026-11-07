#!/usr/bin/env python3
"""Catalog checks for the published Vela Eco series."""
import hashlib
import html
import json
import re
import struct
import subprocess
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = json.loads(Path("/tmp/vela-eco/vela-eco.json").read_text())
MEMBERSHIP = json.loads(Path("/tmp/vela-eco/category-membership.json").read_text())

products = json.loads((ROOT / "data/products.json").read_text())
price = json.loads((ROOT / "data/price.json").read_text())
cats = json.loads((ROOT / "data/categories.json").read_text())

fails = []

def check(cond, msg):
    if not cond:
        fails.append(msg)

eco = [p for p in products if p.get("series") == "Vela Eco"]
src_by = {str(v["sku"]): v for v in SRC["products"]}
check(len(eco) == 41, f"expected 41 Vela Eco cards, got {len(eco)}")
check(len(src_by) == 41, "source dataset is not 41")
check(sum(1 for p in eco if p.get("clearance")) == 1, "clearance count")
check(sum(1 for p in eco if not p.get("clearance")) == 40, "regular count")
check(len({p["model"] for p in eco}) == 21, "model count")
check(len(products) == 676, f"catalog size {len(products)}")
check(len({str(p["article"]) for p in products}) == len(products), "duplicate articles")
check(len({p["id"] for p in products}) == len(products), "duplicate ids")

member = [sku for page in MEMBERSHIP["pages"] for sku in page["skus"]]
check(member == [str(v["sku"]) for v in SRC["products"]], "membership order drifted from dataset")
check(set(member) == {p["article"] for p in eco}, "published SKUs != category membership")
check("11170083" in member and member[0] == "11170083", "clearance sku membership")

missing_desc = {"00071193", "00071192", "00071194", "00071195", "00071189", "00070239"}
for p in eco:
    src = src_by[p["article"]]
    check(p["name"] == src["title"], f"name {p['article']}")
    check(abs(float(p["price"]) - float(src["retail_price_byn"])) < 0.001, f"price {p['article']}")
    check(p["supplier_availability"] == src["supplier_availability"], f"supplier {p['article']}")
    check(p["pavilion_availability"] == "Не проверено", f"pavilion {p['article']}")
    check(p["in_stock"] is None, f"in_stock must not copy supplier stock {p['article']}")
    check(p["category"] == "Дверные ручки", p["article"])
    check(p["series"] == "Vela Eco", p["article"])
    check((p.get("description") or None) == (src.get("description") or None), f"description {p['article']}")
    check(p.get("specifications") == src.get("specifications"), f"specs {p['article']}")
    check("опт" not in json.dumps(p, ensure_ascii=False).lower(), f"wholesale leak {p['article']}")
    check("wholesale" not in json.dumps(p, ensure_ascii=False).lower(), f"wholesale key {p['article']}")
    if p["article"] in missing_desc:
        check(p.get("description") in (None, ""), f"invented description {p['article']}")
    else:
        check(bool(p.get("description")), f"missing documented description {p['article']}")
    path = ROOT / p["image"]
    check(path.is_file(), f"missing photo {p['article']} {p['image']}")
    if path.is_file():
        blob = path.read_bytes()
        check(blob.startswith(b"RIFF") and blob[8:12] == b"WEBP", f"not webp {p['article']}")
        if blob[12:16] == b"VP8 ":
            i = blob.find(b"\x9d\x01\x2a")
            w = struct.unpack_from("<H", blob, i + 3)[0] & 0x3FFF
            h = struct.unpack_from("<H", blob, i + 5)[0] & 0x3FFF
        elif blob[12:16] == b"VP8X":
            w = 1 + int.from_bytes(blob[24:27], "little")
            h = 1 + int.from_bytes(blob[27:30], "little")
        else:
            w = h = 0
        check(w >= 400 and h >= 400, f"small photo {p['article']} {w}x{h}")

primaries = [hashlib.sha256((ROOT / p["image"]).read_bytes()).hexdigest() for p in eco]
check(len(primaries) == len(set(primaries)), "primary photo reused across SKUs")

clearance = next(p for p in eco if p["article"] == "11170083")
regular = next(p for p in eco if p["article"] == "00006798")
gone = next(p for p in eco if p["article"] == "00006799")
check(clearance["specifications"]["Длина квадрата"] == "150 мм", "clearance spindle")
check(clearance["specifications"]["Материал внутренней розетки"] == "алюминий", "clearance rose")
check("дефект" in clearance["description"], "clearance defects")
check(regular["specifications"]["Длина квадрата"] == "100 мм", "regular vita spindle")
check(regular["specifications"]["Материал внутренней розетки"] == "ЦАМ", "regular vita rose")
check(clearance["specifications"] != regular["specifications"], "clearance specs copied from regular")
check(gone["price"] == 26.5 and gone["supplier_availability"] == "Нет в наличии", "00006799 status")
check(gone["pavilion_availability"] == "Не проверено", "00006799 pavilion")
lime = next(p for p in eco if p["article"] == "00071193")
check("матовый никель/хром" in lime.get("spec_color_note", ""), "lime color note")
check(lime["color"] == "черный", "lime filter color")
check("Vela Prima" not in lime["name"], "prima line mixed in")

ruchki = next(c for c in cats if c["slug"] == "ruchki")
check(ruchki["count"] == sum(1 for p in products if p["category"] == "Дверные ручки") == 87, "handle count")
check(sum(c["count"] for c in cats) == len(products), "category sum")

check(price["count"] == 2470 == len(price["items"]), "price count")
series_rows = [x for x in price["items"] if x.get("series") == "Vela Eco"]
check(len(series_rows) == 41, "price series rows")
for p in eco:
    row = next(x for x in price["items"] if str(x["a"]) == p["article"])
    check(abs(float(row["p"]) - float(p["price"])) < 0.001, f"price.json {p['article']}")
    check(row["s"] == (0 if p["supplier_availability"] == "Нет в наличии" else 1), f"s flag {p['article']}")
    check("опт" not in json.dumps(row, ensure_ascii=False).lower(), f"wholesale price row {p['article']}")
gone_row = next(x for x in price["items"] if str(x["a"]) == "00006799")
check(gone_row["s"] == 0 and gone_row["p"] == 26.5, "price 00006799")

# Excel keeps retail prices and states supplier stock explicitly.
xml = zipfile.ZipFile(ROOT / "price/skoba-price.xlsx").read("xl/worksheets/sheet1.xml").decode("utf-8")
check("Оптовых цен в файле нет." in html.unescape(xml), "excel note")
check("Павильон 73: не проверено." in html.unescape(xml), "excel pavilion wording")
for p in eco:
    check(p["article"] in xml or p["article"].lstrip("0") in xml, f"excel missing {p['article']}")
check(html.unescape(xml).count("У поставщика: нет в наличии.") == 1, "only one supplier-out row")
row = re.search(r'<row r="2072">(.*?)</row>', xml)
check(row and "<v>11170083</v>" in row.group(1) and "<v>8.3</v>" in row.group(1), "clearance excel price")
check(row and "У поставщика: есть на складе." in html.unescape(row.group(1)), "clearance excel stock")

js = (ROOT / "app.js").read_text()
html_text = (ROOT / "index.html").read_text()
for needle in ["#referral", "id=\"ref-form\"", "id=\"word-quote\"", "id=\"psalm\"", "id=\"order-form\"", "data/quotes.json"]:
    blob = html_text + js
    check(needle.strip("#") in blob or needle in blob, f"missing preserved feature {needle}")
check("Пс. 126:1" in html_text, "psalm")
check("sendm8.com" in html_text and "sendm8.com" in js, "order endpoint")
check("skoba_ref_code" in js, "referral storage")
check(".github/workflows" not in subprocess.check_output(["git", "-C", str(ROOT), "status", "--porcelain"]).decode(), "workflow touched")

proc = subprocess.run(["node", "--check", str(ROOT / "app.js")], capture_output=True, text=True)
check(proc.returncode == 0, "node --check failed: " + proc.stderr)

if fails:
    print("FAIL", len(fails))
    for f in fails:
        print("-", f)
    raise SystemExit(1)
print("OK", len(eco), "cards,", len({p['model'] for p in eco}), "models, syntax and price checks passed")
