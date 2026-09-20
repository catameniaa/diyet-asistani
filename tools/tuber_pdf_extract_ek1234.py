"""TÜBER 2022 Ek 1.2.1, 1.3.1, 1.4.1 -> mevcut data-tuber.js'e ek tablolar."""
import pdfplumber, json, re

SRC="/root/.claude/uploads/3c79e824-4b30-5818-9d83-09dbb74557f5/2100ba72-3.pdf"
BODY_MIN=7.0
def pg(pdf,i): return pdf.pages[i].filter(lambda o: o.get("object_type")!="char" or o.get("size",99)>=BODY_MIN)

def f(s):
    s=(s or "").strip().replace(",",".")
    m=re.search(r"-?\d+(?:\.\d+)?", s)
    return float(m.group()) if m else None

def rng(s):
    """'10-20' -> [10,20]; '0.5' -> 0.5; metin ise olduğu gibi"""
    s=(s or "").strip().replace(",",".")
    if not s: return None
    m=re.fullmatch(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)", s)
    if m: return [float(m.group(1)), float(m.group(2))]
    if re.fullmatch(r"\d+(?:\.\d+)?", s): return float(s)
    return s

out={}
with pdfplumber.open(SRC) as pdf:
    # --- Ek 1.2.1 protein (sayfa 5 erkek, sayfa 6 kadın) ---
    pro=[]
    for pi,sex in ((4,"E"),(5,"K")):
        for r in pg(pdf,pi).extract_tables()[0]:
            age=(r[1] or "").strip()
            if not re.fullmatch(r"(≥\s*\d+|\d+\s*[-–]\s*\d+|\d+)", age): continue
            pro.append([sex, age.replace(" ",""), f(r[2]), f(r[3]), f(r[4]), f(r[5]), f(r[6]), f(r[7]), f(r[8])])
    out["pro"]={"t":"Protein — önerilen yeterli alım (AR/PRI)","k":"PRI",
        "c":[["Vücut ağırlığı","kg"],["Protein (DIAAS=100)","g/kg/gün"],["Protein (DIAAS=100)","g/gün"],
             ["Protein (Türkiye diyeti)","g/kg/gün"],["Protein (Türkiye diyeti)","g/gün"],
             ["Protein/enerji alt sınır","E%"],["Protein/enerji üst sınır","E%"]],
        "r":pro}

    # --- Ek 1.3.1 makro aralıkları (sayfa 7, ikinci tablo) ---
    mak=[]; sex=None
    SEXM={"çocuk":"cocuk","erkek":"E","kadın":"K"}
    for r in pg(pdf,6).extract_tables()[1]:
        c0=(r[0] or "").strip(); low=c0.lower()
        if low in SEXM: sex=SEXM[low]; continue
        if not re.fullmatch(r"(≥\s*\d+|\d+\s*[-–]\s*\d+|\d+)", c0): continue
        mak.append([sex, c0.replace(" ",""), rng(r[1]), rng(r[2]), rng(r[3]), rng(r[4]), rng(r[5])])
    out["makro"]={"t":"Makro besin ögeleri — referans alım aralıkları","k":"RI/AI",
        "c":[["Protein","E%"],["Karbonhidrat","E%"],["Yağ","E%"],["ALA (omega-3)","E%"],["LA (omega-6)","E%"]],
        "ref":["RI","RI","RI","AI","AI"],"r":mak}

    # --- Ek 1.4.1 yağ asitleri, CHO, posa, su (sayfa 8) ---
    dig=[]; sex=None
    for r in pg(pdf,7).extract_tables()[0]:
        c0=(r[0] or "").strip(); low=c0.lower()
        if low in SEXM: sex=SEXM[low]; continue
        if low in ("gebe","emzikli"): sex=low; 
        elif not re.fullmatch(r"(≥\s*\d+|\d+\s*[-–]\s*\d+|\d+)", c0): continue
        age = "" if low in ("gebe","emzikli") else c0.replace(" ","")
        dig.append([sex, age, (r[1] or "").strip(), (r[2] or "").strip(),
                    f(r[3]), f(r[4]), (r[5] or "").strip().replace("\n"," ")])
    out["diger"]={"t":"Yağ asitleri, karbonhidrat, posa ve su","k":"AI/PRI",
        "c":[["EPA+DHA","mg"],["Doymuş yağ asitleri",""],["Karbonhidrat","g"],["Posa / lif","g"],["Su","L"]],
        "ref":["AI","AI","PRI","AI","AI"],"r":dig}

for k,v in out.items(): print(f"{k}: {len(v['r'])} satır")
json.dump(out, open("tuber_ek1234.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)

# mevcut data-tuber.js'e ekle
import io
p="/home/user/diyet-asistani/js/data-tuber.js"
s=io.open(p,encoding="utf-8").read()
old="  DA.data.tuber = "
i=s.index(old)+len(old); j=s.rindex(";\n})();")
cur=json.loads(s[i:j])
cur.update(out)
s2=s[:i]+json.dumps(cur,ensure_ascii=False,separators=(",",":"))+s[j:]
s2=s2.replace("Ek 1.5.1–1.5.5 (s. 254–258)","Ek 1.2.1, 1.3.1, 1.4.1 ve 1.5.1–1.5.5 (s. 250–258)")
io.open(p,"w",encoding="utf-8").write(s2)
import os; print("data-tuber.js:", round(os.path.getsize(p)/1024,1),"KB")
