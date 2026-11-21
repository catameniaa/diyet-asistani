#!/usr/bin/env python3
"""
BLS 4.0 (Bundeslebensmittelschlüssel) → uygulama veri dosyaları

Kaynak: Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS),
Version 4.0. Karlsruhe. Belgenin 9.3 bölümüne göre veri "kostenfrei und ohne
Lizenzbarrieren" sunuluyor; uygulama ve yazılım geliştirme açıkça sayılmış.

Kullanım
    python3 tools/bls_cevir.py BLS_4_0_Daten_2025_DE.xlsx
    → js/data-bls.js        besinler ve seçili besin ögeleri (DA.data.bls)
    → js/data-bls-koken.js  her değerin veri kökeni (DA.data.blsKoken)

Neden ögelerin hepsi değil: dosyada 138 öge var (36 yağ asidi, 19 amino asit,
tek tek tokoferoller…). Telefonda 7.140 × 138 sayı açılışta değil ama ilk
aramada yüklenir; klinikte kullanılmayan ayrıntı yükü büyütüyor. Seçim
aşağıdaki OGE tablosundadır; yeni öge eklemek için tabloya satır eklemek
yeter.

Değerlerin kodlanması (belgenin 4.3–4.4 bölümü)
    sayı      kaynaktaki değer (birim çevrilmişse çevrilmiş)
    boş       "-" ya da hücre boş: veri yok. SIFIR DEĞİLDİR — belge açıkça
              "nicht als Null interpretieren" diyor; toplamda ayrıca sayılır.
    'iz'      TR (Spuren): var ama miktarı bilinmiyor
    '<'       <LOD / <LOQ: ölçüm sınırının altında
Birim çevirileri (TÜBER tablolarıyla aynı birime getirmek için):
    VITB6, CU, MN, FD   µg → mg  (÷1000)   TÜBER Ek 1.5.1/1.5.2 mg kullanır;
                                            BLS'de B6 µg, gözden kaçması kolay
    amino asitler       g → mg   (×1000)   PKU'da fenilalanin mg ile izlenir
Değerler yuvarlanmaz; çarpma ondalık aritmetikle yapılır.
"""

from __future__ import annotations

from decimal import Decimal
import json
import os
import re
import sys

try:
    import openpyxl
except ImportError:
    sys.exit("Eksik bağımlılık:  pip install openpyxl")

KAYNAK = "Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0. Karlsruhe."

# [anahtar, BLS kodu, Türkçe ad, uygulamadaki birim, BLS birimi, çarpan, grup]
OGE = [
    ["kcal", "ENERCC", "Enerji", "kcal", "kcal", 1, "makro"],
    ["su", "WATER", "Su", "g", "g", 1, "makro"],
    ["prot", "PROT625", "Protein", "g", "g", 1, "makro"],
    ["yag", "FAT", "Yağ", "g", "g", 1, "makro"],
    ["kh", "CHO", "Karbonhidrat (kullanılabilir)", "g", "g", 1, "makro"],
    ["lif", "FIBT", "Posa (diyet lifi)", "g", "g", 1, "makro"],
    ["alk", "ALC", "Alkol", "g", "g", 1, "makro"],

    ["seker", "SUGAR", "Şeker (mono + disakkarit)", "g", "g", 1, "kh"],
    ["sakaroz", "SUCS", "Sakaroz", "g", "g", 1, "kh"],
    ["glukoz", "GLUS", "Glukoz", "g", "g", 1, "kh"],
    ["fruktoz", "FRUS", "Fruktoz", "g", "g", 1, "kh"],
    ["laktoz", "LACS", "Laktoz", "g", "g", 1, "kh"],
    ["nisasta", "STARCH", "Nişasta", "g", "g", 1, "kh"],
    # Kaynak notu "blsOlsac": enerji formülü bunu iki kez sayıyor görünüyor; ayrıntı ekranı farkı gösterir
    ["oligo", "OLSAC", "Oligosakkarit (kullanılabilir)", "g", "g", 1, "kh"],
    ["lifCoz", "FIBSOL", "Suda çözünür posa", "g", "g", 1, "kh"],
    ["lifCozmez", "FIBINS", "Suda çözünmez posa", "g", "g", 1, "kh"],

    ["doymus", "FASAT", "Doymuş yağ asitleri", "g", "g", 1, "ya"],
    ["tekli", "FAMS", "Tekli doymamış yağ asitleri", "g", "g", 1, "ya"],
    ["coklu", "FAPU", "Çoklu doymamış yağ asitleri", "g", "g", 1, "ya"],
    ["n3", "FAPUN3", "Omega-3 (toplam)", "g", "g", 1, "ya"],
    ["n6", "FAPUN6", "Omega-6 (toplam)", "g", "g", 1, "ya"],
    ["la", "F18:2CN6", "Linoleik asit (LA)", "g", "g", 1, "ya"],
    ["ala", "F18:3CN3", "Alfa-linolenik asit (ALA)", "g", "g", 1, "ya"],
    ["epa", "F20:5CN3", "EPA", "g", "g", 1, "ya"],
    ["dha", "F22:6CN3", "DHA", "g", "g", 1, "ya"],
    ["kol", "CHORL", "Kolesterol", "mg", "mg", 1, "ya"],

    ["vitA", "VITA", "A vitamini (RE)", "µg", "µg", 1, "vit"],
    ["vitArae", "VITAA", "A vitamini (RAE)", "µg", "µg", 1, "vit"],
    ["retinol", "RETOL", "Retinol", "µg", "µg", 1, "vit"],
    ["bkaroten", "CARTB", "Beta-karoten", "µg", "µg", 1, "vit"],
    ["vitD", "VITD", "D vitamini", "µg", "µg", 1, "vit"],
    ["vitE", "VITE", "E vitamini (alfa-tokoferol)", "mg", "mg", 1, "vit"],
    ["vitK", "VITK", "K vitamini", "µg", "µg", 1, "vit"],
    ["b1", "THIA", "B1 vitamini (tiamin)", "mg", "mg", 1, "vit"],
    ["b2", "RIBF", "B2 vitamini (riboflavin)", "mg", "mg", 1, "vit"],
    ["niasinEs", "NIAEQ", "Niasin eşdeğeri", "mg", "mg", 1, "vit"],
    ["b5", "PANTAC", "Pantotenik asit", "mg", "mg", 1, "vit"],
    ["b6", "VITB6", "B6 vitamini", "mg", "µg", 0.001, "vit"],
    ["biotin", "BIOT", "Biotin", "µg", "µg", 1, "vit"],
    ["folat", "FOL", "Folat eşdeğeri (DFE)", "µg", "µg", 1, "vit"],
    ["folik", "FOLAC", "Folik asit (sentetik)", "µg", "µg", 1, "vit"],
    ["b12", "VITB12", "B12 vitamini", "µg", "µg", 1, "vit"],
    ["vitC", "VITC", "C vitamini", "mg", "mg", 1, "vit"],

    ["na", "NA", "Sodyum", "mg", "mg", 1, "min"],
    ["k", "K", "Potasyum", "mg", "mg", 1, "min"],
    ["ca", "CA", "Kalsiyum", "mg", "mg", 1, "min"],
    ["mg", "MG", "Magnezyum", "mg", "mg", 1, "min"],
    ["p", "P", "Fosfor", "mg", "mg", 1, "min"],
    ["cl", "CLD", "Klorür", "mg", "mg", 1, "min"],
    ["fe", "FE", "Demir", "mg", "mg", 1, "min"],
    ["zn", "ZN", "Çinko", "mg", "mg", 1, "min"],
    ["iyot", "ID", "İyot", "µg", "µg", 1, "min"],
    ["cu", "CU", "Bakır", "mg", "µg", 0.001, "min"],
    ["mn", "MN", "Manganez", "mg", "µg", 0.001, "min"],
    ["flor", "FD", "Florür", "mg", "µg", 0.001, "min"],
    ["cr", "CR", "Krom", "µg", "µg", 1, "min"],
    ["mo", "MO", "Molibden", "µg", "µg", 1, "min"],

    ["ile", "ILE", "İzolösin", "mg", "g", 1000, "aa"],
    ["leu", "LEU", "Lösin", "mg", "g", 1000, "aa"],
    ["lys", "LYS", "Lizin", "mg", "g", 1000, "aa"],
    ["met", "MET", "Metiyonin", "mg", "g", 1000, "aa"],
    ["cys", "CYSTE", "Sistein", "mg", "g", 1000, "aa"],
    ["phe", "PHE", "Fenilalanin", "mg", "g", 1000, "aa"],
    ["tyr", "TYR", "Tirozin", "mg", "g", 1000, "aa"],
    ["thr", "THR", "Treonin", "mg", "g", 1000, "aa"],
    ["trp", "TRP", "Triptofan", "mg", "g", 1000, "aa"],
    ["val", "VAL", "Valin", "mg", "g", 1000, "aa"],
    ["his", "HIS", "Histidin", "mg", "g", 1000, "aa"],
]

OGE_GRUP = [
    ["makro", "Enerji ve makro besin ögeleri"],
    ["kh", "Karbonhidratlar ve posa"],
    ["ya", "Yağ asitleri ve kolesterol"],
    ["vit", "Vitaminler"],
    ["min", "Mineraller"],
    ["aa", "Amino asitler"],
]

# BLS belgeleri kodun ilk harfinin anlamını vermiyor (yalnız "C = Getreide"
# örneği var). Adlar her harften rastgele örnekler okunarak çıkarıldı.
GRUP = {
    "B": "Ekmekler",
    "C": "Tahıllar",
    "D": "Kek, pasta ve unlu mamuller",
    "E": "Yumurta ve makarna",
    "F": "Meyveler",
    "G": "Sebzeler",
    "H": "Baklagiller, yağlı tohumlar, kuruyemiş",
    "K": "Patates ve mantarlar",
    "M": "Süt ve süt ürünleri",
    "N": "Alkolsüz içecekler",
    "P": "Alkollü içecekler",
    "Q": "Yağlar",
    "R": "Soslar, çeşniler ve dolgular",
    "S": "Şekerli ürünler ve dondurma",
    "T": "Balık ve deniz ürünleri",
    "U": "Kırmızı et",
    "V": "Kümes hayvanı, av eti, sakatat",
    "W": "Şarküteri ürünleri",
    "X": "Karışık yemekler ve çorbalar",
    "Y": "Yemekler (et, balık, tatlı)",
}

# Belgenin 4.2 bölümündeki 13 kategori + eksik değer. Bilinmeyen bir kategori
# çıkarsa dönüştürücü durur: sessizce '-' yazmak bir kaynağı "veri yok"a çevirirdi.
KOKEN = {
    "Analyse": "A",
    "Rezeptberechnung": "R",
    "Musterberechnung": "M",
    "Literatur": "L",
    "Aggregation": "G",
    "Labelangabe": "E",
    "Nährstoffdatenbank": "V",
    "Übernommener Wert": "B",
    "Reskalierung": "S",
    "Logische Null": "0",
    "Logische Annahme": "N",
    "Spuren": "T",
    "Formelberechnung": "F",
    "-": "-",
}


def sayi_yaz(x, carpan) -> str:
    """Kaynaktaki değer × çarpan, ondalık aritmetikle: kayan noktalı çarpma
    0.123 yerine 0.12300000000000001 yazıyordu. İlk sürüm 6 anlamlı basamağa
    yuvarlıyordu; kaynakta 7–8 basamaklı 54 değer çıktı, artık hiç yuvarlanmaz."""
    d = Decimal(repr(float(x))) * Decimal(str(carpan))
    if d == 0:
        return "0"
    s = format(d.normalize(), "f")
    return s[:-2] if s.endswith(".0") else s


def deger_kodla(ham, carpan) -> str:
    if ham is None:
        return ""
    if isinstance(ham, (int, float)):
        return sayi_yaz(ham, carpan)
    s = str(ham).strip()
    if s in ("", "-"):
        return ""
    if s.upper() == "TR":
        return "'iz'"
    if s.startswith("<"):
        return "'<'"
    # Ondalık virgüllü metin gelirse (belge 7.1: "Dezimaltrennzeichen Komma")
    try:
        return sayi_yaz(float(s.replace(",", ".")), carpan)
    except ValueError:
        raise SystemExit(f"Tanınmayan değer: {ham!r}")


def js_dizi(parcalar: list[str]) -> str:
    """Boş parça JS dizisinde delik olur ([1,,3]); son parça boşsa delik kaybolmasın
    diye sona bir virgül daha eklenir ([1,,] uzunluğu 2'dir, [1,] uzunluğu 1)."""
    s = ",".join(parcalar)
    if parcalar and parcalar[-1] == "":
        s += ","
    return "[" + s + "]"


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    kok = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
    ws = wb.worksheets[0]
    satirlar = ws.iter_rows(values_only=True)
    baslik = list(next(satirlar))

    if baslik[:3] != ["BLS Code", "Lebensmittelbezeichnung", "Food name"]:
        raise SystemExit(f"Beklenmeyen başlık: {baslik[:3]}")
    # Sütunu koddan bul: "VITB6 Vitamin B6 [µg/100g]" — kod ve birim ikisi de denetlenir
    sutun = {}
    for o in OGE:
        kod, birim = o[1], o[4]
        bul = [i for i, h in enumerate(baslik)
               if isinstance(h, str) and h.split(" ")[0] == kod and "[" in h]
        if len(bul) != 1:
            raise SystemExit(f"{kod} sütunu bulunamadı ya da birden fazla: {bul}")
        i = bul[0]
        m = re.search(r"\[([^/\]]+)/100g\]", baslik[i])
        if not m or m.group(1) != birim:
            raise SystemExit(f"{kod} birimi beklenen '{birim}' değil: {baslik[i]}")
        if baslik[i + 1] != kod + " Datenherkunft":
            raise SystemExit(f"{kod} köken sütunu yerinde değil: {baslik[i + 1]}")
        sutun[kod] = i

    besin_satirlari, koken_satirlari, kodlar = [], [], set()
    for r in satirlar:
        if not r or not r[0]:
            continue
        kod, ad = str(r[0]).strip(), str(r[2] or "").strip()
        if not re.fullmatch(r"[A-Z][0-9A-Z]{6}", kod):
            raise SystemExit(f"Beklenmeyen BLS kodu: {kod!r}")
        if kod in kodlar:
            raise SystemExit(f"Yinelenen kod: {kod}")
        if kod[0] not in GRUP:
            raise SystemExit(f"Grup adı tanımlanmamış: {kod}")
        kodlar.add(kod)
        degerler, koken = [], []
        for o in OGE:
            i = sutun[o[1]]
            degerler.append(deger_kodla(r[i], o[5]))
            k = r[i + 1] if r[i + 1] is not None else "-"
            if k not in KOKEN:
                raise SystemExit(f"Tanınmayan veri kökeni '{k}' ({kod} {o[1]})")
            # Hücre boşsa köken ne derse desin "veri yok" yazılır
            koken.append("-" if degerler[-1] == "" else KOKEN[k])
        besin_satirlari.append(js_dizi([json.dumps(kod), json.dumps(ad, ensure_ascii=False)] + degerler))
        koken_satirlari.append(json.dumps(kod) + ":" + json.dumps("".join(koken)))

    oge_js = json.dumps([[o[0], o[1], o[2], o[3], o[6]] for o in OGE], ensure_ascii=False)
    bas = (
        "/* BLS 4.0 — Bundeslebensmittelschlüssel (Alman ulusal besin veri tabanı)\n"
        f"   Kaynak: {KAYNAK}\n"
        "   Kullanım koşulu (belge 9.3): ücretsiz, lisans engeli yok; uygulama ve yazılım\n"
        "   geliştirme açıkça sayılmış; yayında kaynak gösterilmeli.\n\n"
        "   Bu dosya tools/bls_cevir.py ile üretildi; elle düzenlemeyin.\n"
        "   Satır: [BLS kodu, İngilizce ad, ...ögeler (oge sırasıyla, 100 g yenilebilir kısım)]\n"
        "   Boş hücre = veri yok (sıfır değil) · 'iz' = eser miktar · '<' = ölçüm sınırı altı\n"
        "   Birim çevirileri: B6, bakır, manganez, florür µg→mg; amino asitler g→mg. */\n"
    )
    veri = (
        bas + "(function () {\n  'use strict';\n  DA.data.bls = {\n"
        f"    kaynak: {json.dumps(KAYNAK, ensure_ascii=False)},\n"
        f"    oge: {oge_js},\n"
        f"    ogeGrup: {json.dumps(OGE_GRUP, ensure_ascii=False)},\n"
        f"    grup: {json.dumps(GRUP, ensure_ascii=False)},\n"
        "    b: [\n" + ",\n".join(besin_satirlari) + "\n    ]\n  };\n})();\n"
    )
    koken_js = (
        "/* BLS 4.0 — her değerin veri kökeni (belge 4.2). Kaynak: " + KAYNAK + "\n"
        "   Bu dosya tools/bls_cevir.py ile üretildi; elle düzenlemeyin.\n"
        "   Kod başına bir karakter dizisi, DA.data.bls.oge sırasıyla:\n"
        "   A analiz · R tarif hesabı · M örüntü hesabı · L literatür · G birleştirme ·\n"
        "   E etiket · V başka veri tabanı · B benzer besinden alındı · S yeniden ölçekleme ·\n"
        "   0 mantıksal sıfır · N mantıksal varsayım · T eser · F formülle hesap · - veri yok */\n"
        "(function () {\n  'use strict';\n  DA.data.blsKoken = {\n" + ",\n".join(koken_satirlari) + "\n  };\n})();\n"
    )
    with open(os.path.join(kok, "js", "data-bls.js"), "w", encoding="utf-8") as f:
        f.write(veri)
    with open(os.path.join(kok, "js", "data-bls-koken.js"), "w", encoding="utf-8") as f:
        f.write(koken_js)
    print(f"{len(besin_satirlari)} besin, {len(OGE)} öge → js/data-bls.js ({len(veri.encode()) // 1024} KB), "
          f"js/data-bls-koken.js ({len(koken_js.encode()) // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
