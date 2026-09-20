"""TÜBER 2022 Ek 1.5 tablolarını yapılandırılmış veriye çevirir.

Dikkat edilen iki nokta:
1. Dipnot işaretleri üst simge (5,25 punto) olarak gömülü ve sayıya yapışıyor:
   "950-10001" aslında 950-1000 + dipnot 1. Punto süzgeci ile ayıklanıyor.
2. Değerlerin bir kısmı ARALIK ("11-16" = premenopozal/postmenopozal demir).
   Aralık korunuyor; tek sayıya indirgenmiyor.
"""
import pdfplumber, json, re

SRC = "/root/.claude/uploads/3c79e824-4b30-5818-9d83-09dbb74557f5/9549ab88-1..pdf"
BODY_MIN = 7.0          # bu puntonun altı dipnot/üst simge sayılır

TABLES = [
 ("ek151","Vitaminler — önerilen günlük alım","PRI/AI",
  [("A vitamini","µg"),("B6 vitamini","mg"),("B12 vitamini","µg"),("C vitamini","mg"),
   ("D vitamini","µg"),("E vitamini","mg"),("K vitamini","µg"),("Folat","µg"),
   ("Niasin","mg/1000 kkal"),("Tiamin","mg/1000 kkal"),("Riboflavin","mg"),("Biotin","µg"),("Pantotenik asit","mg")]),
 ("ek152","Mineraller — önerilen günlük alım","PRI/AI",
  [("Kalsiyum","mg"),("Demir","mg"),("Bakır","mg"),("Magnezyum","mg"),("Fosfor","mg"),
   ("Sodyum","g"),("Potasyum","mg"),("Selenyum","µg"),("Çinko","mg"),("İyot","µg"),
   ("Flor","mg"),("Manganez","mg"),("Molibden","µg")]),
 ("ek153","Protein ve mikro besinler — ortalama tahmini gereksinim","EAR",
  [("Protein","g/kg"),("A vitamini","µg"),("B1 vitamini","mg/1000 kkal"),("B2 vitamini","mg"),
   ("B6 vitamini","mg"),("B6 vitamini (gün)","mg/gün"),("C vitamini","mg"),("D vitamini","µg"),
   ("Kalsiyum","mg"),("Demir","mg"),("Çinko","mg"),("Folat","µg")]),
 ("ek154","Vitaminler — tolere edilebilir üst düzey","UL",
  [("A vitamini","µg"),("B6 vitamini","mg"),("B12 vitamini","µg"),("C vitamini","mg"),
   ("D vitamini","µg"),("E vitamini","mg"),("K vitamini","µg"),("Folat","µg"),
   ("Nikotinik asit","mg"),("Nikotinamid","mg"),("Tiamin","mg"),("Riboflavin","mg")]),
 ("ek155","Mineraller — tolere edilebilir üst düzey","UL",
  [("Kalsiyum","mg"),("Demir","mg"),("Bakır","mg"),("Magnezyum","mg"),("Fosfor","mg"),
   ("Sodyum","g"),("Potasyum","g"),("Selenyum","µg"),("Çinko","mg"),("İyot","µg"),
   ("Flor","mg"),("Manganez","mg"),("Molibden","mg")]),
]
SEX_MARK = {"çocuk":"cocuk","erkek":"E","kadın":"K"}

def parse_val(s):
    """'11-16' -> [11,16] · '950' -> 950 · '' -> None"""
    s=(s or "").strip().replace(",",".")
    if not s or s in {"-","—","–"}: return None
    m=re.fullmatch(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)", s)
    if m: return [float(m.group(1)), float(m.group(2))]
    m=re.search(r"\d+(?:\.\d+)?", s)
    return float(m.group()) if m else None

def age_ok(s):
    return bool(re.fullmatch(r"(≥\s*\d+|\d+\s*[-–]\s*\d+|\d+)", (s or "").strip()))

out={}
with pdfplumber.open(SRC) as pdf:
    for pi,(tid,title,kind,cols) in enumerate(TABLES):
        # dipnot üst simgelerini at
        pg = pdf.pages[pi].filter(lambda o: o.get("object_type")!="char" or o.get("size",99) >= BODY_MIN)
        tb = pg.extract_tables()[0]
        rows=[]; sex=None; ref=None
        for r in tb[1:]:
            first=(r[0] or "").strip(); low=first.lower()
            if low.startswith("referans"):
                ref=[(c or "").strip() for c in r[1:len(cols)+1]]; continue
            if low in SEX_MARK: sex=SEX_MARK[low]; continue
            if not age_ok(first): continue
            rows.append({"sex":sex,"age":first.replace(" ",""),
                         "v":[parse_val(c) for c in r[1:len(cols)+1]]})
        out[tid]={"title":title,"kind":kind,"ref":ref,
                  "cols":[{"n":a,"u":b} for a,b in cols],"rows":rows}
        nr=sum(1 for r in rows for x in r["v"] if isinstance(x,list))
        print(f"{tid}: {len(rows)} satır · {len(cols)} öge · aralık içeren hücre: {nr}")

json.dump(out, open("tuber_ek15.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
print("\nyazıldı: tuber_ek15.json")
