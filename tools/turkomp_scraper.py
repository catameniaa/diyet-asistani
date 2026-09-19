#!/usr/bin/env python3
"""
TürKomp — Ulusal Gıda Kompozisyon Veri Tabanı çekici (scraper)

Kaynak: https://turkomp.tarimorman.gov.tr  (T.C. Tarım ve Orman Bakanlığı / TAGEM)

Tasarım ilkeleri
----------------
1. Sunucuyu yorma. İstekler tek iş parçacığında, aralarında rastgele gecikmeyle atılır.
   İndirilen her sayfa diske önbelleklenir; ayrıştırmayı kaç kez tekrarlarsanız tekrarlayın
   sunucuya bir daha gidilmez. "Çek" ve "ayrıştır" bilerek ayrı adımlardır.
2. robots.txt'e uy. Varsayılan olarak kontrol edilir; izin yoksa program durur.
3. Yarıda kalırsa kaldığı yerden devam etsin. Önbellekteki sayfalar atlanır.
4. Tek bir gıda hata verirse program çökmesin; hata loglanıp bir sonrakine geçilir.
   Başarısızlar failed.json'a yazılır, --retry-failed ile tekrar denenir.

Kullanım
--------
    python3 turkomp_scraper.py --inspect URL     # tek sayfanın yapısını dök (seçici ayarı için)
    python3 turkomp_scraper.py --links-only      # yalnızca gıda linklerini topla
    python3 turkomp_scraper.py --limit 10        # deneme çekimi (10 gıda)
    python3 turkomp_scraper.py                   # tam çekim
    python3 turkomp_scraper.py --export-only     # ağa hiç çıkmadan önbellekten yeniden üret
    python3 turkomp_scraper.py --retry-failed    # yalnızca hata verenleri tekrar dene

Çıktılar (varsayılan ./turkomp_out):
    foods.json      ham veri, tüm bileşenler, birimleriyle ve kaynak URL'siyle
    foods.csv       her satır bir gıda, her sütun bir bileşen (gözle kontrol için)
    turkomp.sqlite  sorgulanabilir veritabanı (foods + components tabloları)
    data-foods-turkomp.js   uygulamaya girecek JS dosyası
    failed.json     çekilemeyen ya da ayrıştırılamayan sayfalar ve sebepleri
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import random
import re
import sqlite3
import sys
import time
import urllib.parse
import urllib.robotparser
from dataclasses import dataclass, field, asdict
from typing import Any

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Eksik bağımlılık. Kurulum:  pip install requests beautifulsoup4 lxml")


# ----------------------------------------------------------------------------
# Ayarlar — site yapısı değişirse önce burayı gözden geçirin
# ----------------------------------------------------------------------------

BASE = "https://turkomp.tarimorman.gov.tr"

# Link toplamaya buradan başlanır. Site yapısı değişirse yeni liste sayfaları eklenebilir.
SEED_PATHS = ["/main", "/food_group", "/foods", "/"]

# Gıda detay sayfası deseni: /food-<slug>-<id>
FOOD_URL_RE = re.compile(r"/food-[^/?#]+-(\d+)\s*$", re.I)

# Link toplarken izlenecek liste/gezinme sayfaları (gıda detayları dışındakiler)
LIST_URL_RE = re.compile(r"/(main|food_group|foods|component|component_result|search)", re.I)

# Gıda adı için denenecek seçiciler, sırayla. İlk dolu sonuç kullanılır.
NAME_SELECTORS = ["h1", "h2.food-name", ".food-title", "#foodName", "title"]

# Bileşen tablolarında sütun başlıklarının anlamı. Küçük harfe çevrilip aranır.
COL_HINTS = {
    "name": ["bileşen", "besin öge", "besin ögesi", "component", "öğe", "ad"],
    "value": ["değer", "ortalama", "miktar", "value", "mean", "içerik"],
    "unit": ["birim", "unit"],
}

# Ağ davranışı
DELAY_RANGE = (2.0, 4.0)      # istekler arası rastgele bekleme (saniye)
TIMEOUT = 30                  # tek istek zaman aşımı
MAX_RETRIES = 3               # ağ hatasında deneme sayısı
BACKOFF_BASE = 4.0            # yeniden denemede bekleme: BACKOFF_BASE * 2**(deneme-1)
MAX_LIST_PAGES = 400          # link toplarken gezilecek azami liste sayfası

# Gerçekçi tarayıcı başlıkları. Kimliğinizi gizlemeye değil, sıradan bir tarayıcı
# gibi davranmaya yarar; iletişim için bir e-posta eklemek iyi bir uygulamadır.
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
]

log = logging.getLogger("turkomp")


# ----------------------------------------------------------------------------
# Yardımcılar
# ----------------------------------------------------------------------------

def setup_logging(out_dir: str, verbose: bool = False) -> None:
    os.makedirs(out_dir, exist_ok=True)
    fmt = "%(asctime)s  %(levelname)-7s %(message)s"
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format=fmt,
        datefmt="%H:%M:%S",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(os.path.join(out_dir, "scrape.log"), encoding="utf-8"),
        ],
    )


def clean(s: str | None) -> str:
    """Boşlukları sadeleştir, görünmez karakterleri at."""
    if not s:
        return ""
    s = s.replace("\xa0", " ").replace("​", "")
    return re.sub(r"\s+", " ", s).strip()


def parse_number(raw: str) -> tuple[float | None, str]:
    """
    Türkçe sayıyı float'a çevirir. Dönen ikinci değer, sayıya çevrilemeyen
    ama anlamlı olan orijinal metindir ("iz", "<0,1", "-" gibi).

    '12,5'    -> (12.5,  '')
    '1.234,5' -> (1234.5, '')
    '<0,1'    -> (0.1,   '<')        eşik altı; işaret korunur
    'iz'      -> (None,  'iz')
    '-'       -> (None,  'veri yok')  kaynakta ölçülmemiş
    ''        -> (None,  '')          boş hücre, satır atlanır
    """
    t = clean(raw)
    if not t:
        return None, ""
    if t in {"-", "—", "–", "*"}:
        return None, "veri yok"   # kaynakta ölçülmemiş/bildirilmemiş

    low = t.lower()
    if low in {"iz", "eser", "tr", "trace"}:
        return None, "iz"

    prefix = ""
    if t[0] in "<>≤≥~":
        prefix, t = t[0], t[1:].strip()

    # 1.234,5 (binlik nokta + ondalık virgül)  ->  1234.5
    if re.fullmatch(r"\d{1,3}(\.\d{3})+(,\d+)?", t):
        t = t.replace(".", "").replace(",", ".")
    else:
        t = t.replace(",", ".")

    m = re.search(r"-?\d+(?:\.\d+)?", t)
    if not m:
        return None, clean(raw)
    try:
        return float(m.group()), prefix
    except ValueError:
        return None, clean(raw)


def slugify(s: str) -> str:
    """Türkçe karakterleri sadeleştirip kimlik üretir (uygulamadaki slug ile aynı mantık)."""
    tr = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")
    s = s.translate(tr).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def cache_path(cache_dir: str, url: str) -> str:
    """URL'den okunabilir, çakışmayan bir dosya adı üretir."""
    p = urllib.parse.urlparse(url)
    name = (p.path + ("?" + p.query if p.query else "")).strip("/") or "index"
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)[:120]
    return os.path.join(cache_dir, name + ".html")


# ----------------------------------------------------------------------------
# Veri modeli
# ----------------------------------------------------------------------------

@dataclass
class Component:
    name: str                       # bileşen adı, sitede yazdığı gibi
    value: float | None             # sayısal değer (100 g için)
    unit: str = ""                  # g, mg, µg, kcal, kJ ...
    note: str = ""                  # 'iz', '<' gibi sayıya sığmayan bilgi
    group: str = ""                 # tablonun başlığı (Makro besinler, Mineraller ...)
    raw: str = ""                   # hücrenin ham metni; hiçbir şey kaybolmasın


@dataclass
class Food:
    id: str                         # URL'deki sayısal kimlik
    name: str
    url: str
    group: str = ""                 # gıda grubu (biliniyorsa)
    scientific: str = ""
    components: list[Component] = field(default_factory=list)

    def by_name(self) -> dict[str, Component]:
        return {c.name.lower(): c for c in self.components}


# ----------------------------------------------------------------------------
# Çekici
# ----------------------------------------------------------------------------

class TurKompScraper:
    def __init__(self, out_dir: str, delay: tuple[float, float] = DELAY_RANGE,
                 obey_robots: bool = True, contact: str = "") -> None:
        self.out_dir = out_dir
        self.cache_dir = os.path.join(out_dir, "cache")
        os.makedirs(self.cache_dir, exist_ok=True)
        self.delay = delay
        self.session = requests.Session()
        ua = random.choice(USER_AGENTS)
        if contact:
            ua += f" (+{contact})"
        self.session.headers.update({
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
            "Connection": "keep-alive",
        })
        self.failed: list[dict[str, str]] = []
        self._last_request = 0.0
        self.robots = self._load_robots() if obey_robots else None

    # -- robots.txt ---------------------------------------------------------

    def _load_robots(self) -> urllib.robotparser.RobotFileParser | None:
        rp = urllib.robotparser.RobotFileParser()
        url = urllib.parse.urljoin(BASE, "/robots.txt")
        try:
            r = self.session.get(url, timeout=TIMEOUT)
            if r.status_code == 200:
                rp.parse(r.text.splitlines())
                log.info("robots.txt okundu.")
                return rp
            log.info("robots.txt bulunamadı (HTTP %s) — kısıtlama yok sayılıyor.", r.status_code)
        except requests.RequestException as e:
            log.warning("robots.txt alınamadı (%s) — kısıtlama yok sayılıyor.", e)
        return None

    def allowed(self, url: str) -> bool:
        if self.robots is None:
            return True
        return self.robots.can_fetch(self.session.headers["User-Agent"], url)

    # -- tek sayfa ----------------------------------------------------------

    def _sleep(self) -> None:
        """Bir önceki isteğin üstünden yeterli süre geçmediyse bekler."""
        wait = random.uniform(*self.delay) - (time.monotonic() - self._last_request)
        if wait > 0:
            time.sleep(wait)

    def get(self, url: str, use_cache: bool = True, record_failure: bool = True) -> str | None:
        """
        Sayfayı getirir. Önbellekte varsa ağa hiç çıkmaz.
        Ağ/sunucu hatasında üstel geri çekilmeyle yeniden dener; yine olmazsa None döner.
        """
        path = cache_path(self.cache_dir, url)
        if use_cache and os.path.exists(path):
            log.debug("önbellek: %s", url)
            with open(path, encoding="utf-8") as f:
                return f.read()

        if not self.allowed(url):
            log.warning("robots.txt izin vermiyor, atlanıyor: %s", url)
            if record_failure:
                self.failed.append({"url": url, "reason": "robots.txt disallow"})
            return None

        for attempt in range(1, MAX_RETRIES + 1):
            self._sleep()
            try:
                self._last_request = time.monotonic()
                r = self.session.get(url, timeout=TIMEOUT)

                # 429/503: sunucu "yavaşla" diyor. Retry-After'a uy.
                if r.status_code in (429, 503):
                    wait = float(r.headers.get("Retry-After", BACKOFF_BASE * 2 ** (attempt - 1)))
                    log.warning("HTTP %s — %.0f sn bekleniyor (%s)", r.status_code, wait, url)
                    time.sleep(wait)
                    continue

                if r.status_code == 404:
                    log.log(logging.WARNING if record_failure else logging.DEBUG, "404: %s", url)
                    if record_failure:
                        self.failed.append({"url": url, "reason": "HTTP 404"})
                    return None

                r.raise_for_status()
                r.encoding = r.apparent_encoding or r.encoding
                html = r.text
                with open(path, "w", encoding="utf-8") as f:
                    f.write(html)
                log.debug("indirildi: %s", url)
                return html

            except requests.RequestException as e:
                wait = BACKOFF_BASE * 2 ** (attempt - 1)
                if attempt == MAX_RETRIES:
                    log.error("başarısız (%d deneme): %s — %s", attempt, url, e)
                    if record_failure:
                        self.failed.append({"url": url, "reason": str(e)})
                    return None
                log.warning("hata (%d/%d): %s — %s · %.0f sn sonra tekrar",
                            attempt, MAX_RETRIES, url, e, wait)
                time.sleep(wait)
        return None

    # -- link toplama -------------------------------------------------------

    def collect_food_links(self, max_pages: int = MAX_LIST_PAGES) -> list[str]:
        """
        Liste sayfalarında gezinerek /food-<slug>-<id> biçimindeki detay linklerini toplar.
        Site yapısını bilmeye gerek kalmasın diye genişlik öncelikli gezinme kullanılır:
        yalnızca aynı alan adındaki liste/gezinme sayfaları izlenir.
        """
        seen_pages: set[str] = set()
        foods: dict[str, str] = {}          # id -> url (aynı gıdayı iki kez almayalım)
        queue = [urllib.parse.urljoin(BASE, p) for p in SEED_PATHS]

        while queue and len(seen_pages) < max_pages:
            url = queue.pop(0)
            if url in seen_pages:
                continue
            seen_pages.add(url)

            html = self.get(url, record_failure=False)
            if not html:
                continue

            soup = BeautifulSoup(html, "html.parser")
            for a in soup.find_all("a", href=True):
                link = urllib.parse.urljoin(url, a["href"].strip())
                link, _ = urllib.parse.urldefrag(link)
                if urllib.parse.urlparse(link).netloc != urllib.parse.urlparse(BASE).netloc:
                    continue

                m = FOOD_URL_RE.search(urllib.parse.urlparse(link).path)
                if m:
                    foods.setdefault(m.group(1), link)
                elif LIST_URL_RE.search(link) and link not in seen_pages and link not in queue:
                    queue.append(link)

            log.info("link taraması: %d sayfa gezildi, %d gıda bulundu", len(seen_pages), len(foods))

        if not foods:
            if self.robots is not None and not self.allowed(urllib.parse.urljoin(BASE, SEED_PATHS[0])):
                log.error("robots.txt bu sayfaların taranmasına izin vermiyor. Çekim durduruldu. "
                          "Verinin başka yolla (resmî indirme, kurum izni) sağlanması gerekir.")
            else:
                log.error(
                    "Hiç gıda linki bulunamadı. Muhtemel sebepler: liste sayfası JavaScript ile "
                    "yükleniyor, ya da SEED_PATHS/FOOD_URL_RE güncel değil. "
                    "Yapıyı görmek için:  --inspect %s", urllib.parse.urljoin(BASE, SEED_PATHS[0])
                )
        return sorted(foods.values())

    # -- detay ayrıştırma ---------------------------------------------------

    @staticmethod
    def _food_name(soup: BeautifulSoup) -> str:
        for sel in NAME_SELECTORS:
            el = soup.select_one(sel)
            if el:
                txt = clean(el.get_text())
                # <title> genelde "Veri Bankası - Ad - Türkomp | ..." biçiminde
                if sel == "title" and txt:
                    parts = [clean(p) for p in re.split(r"[-|–]", txt)]
                    parts = [p for p in parts if p and not re.search(r"türkomp|veri bankası|ulusal gıda", p, re.I)]
                    txt = max(parts, key=len) if parts else txt
                if txt:
                    return txt
        return ""

    @staticmethod
    def _column_map(headers: list[str]) -> dict[str, int]:
        """Başlık metinlerinden hangi sütunun ne olduğunu çıkarır."""
        out: dict[str, int] = {}
        for i, h in enumerate(headers):
            hl = h.lower()
            for key, hints in COL_HINTS.items():
                if key not in out and any(x in hl for x in hints):
                    out[key] = i
        return out

    def parse_food(self, html: str, url: str) -> Food | None:
        """
        Detay sayfasındaki tüm <table>'ları okur. Sütun başlıkları tanınırsa ona göre,
        tanınmazsa konuma göre (ad | değer | birim) yorumlanır. Ham hücre metni her
        durumda saklanır, böylece yanlış yorumlansa bile veri kaybolmaz.
        """
        soup = BeautifulSoup(html, "html.parser")
        m = FOOD_URL_RE.search(urllib.parse.urlparse(url).path)
        food_id = m.group(1) if m else slugify(url)[-12:]

        name = self._food_name(soup)
        if not name:
            log.warning("ad bulunamadı: %s", url)
            self.failed.append({"url": url, "reason": "ad bulunamadı"})
            return None

        food = Food(id=food_id, name=name, url=url)

        for table in soup.find_all("table"):
            # Tablonun başlığı: en yakın önceki başlık etiketi ya da <caption>
            group = ""
            cap = table.find("caption")
            if cap:
                group = clean(cap.get_text())
            else:
                prev = table.find_previous(["h1", "h2", "h3", "h4", "th", "strong"])
                if prev:
                    group = clean(prev.get_text())[:60]

            rows = table.find_all("tr")
            if not rows:
                continue

            headers = [clean(c.get_text()) for c in rows[0].find_all(["th", "td"])]
            cmap = self._column_map(headers)
            # Başlık satırı tanındıysa veri ikinci satırdan başlar
            body = rows[1:] if (cmap or any(c.name == "th" for c in rows[0].find_all(["th", "td"]))) else rows

            for tr in body:
                cells = [clean(c.get_text()) for c in tr.find_all(["td", "th"])]
                if len(cells) < 2 or not cells[0]:
                    continue

                i_name = cmap.get("name", 0)
                i_val = cmap.get("value", 1)
                i_unit = cmap.get("unit", 2 if len(cells) > 2 else -1)

                if i_name >= len(cells) or i_val >= len(cells):
                    continue

                cname = cells[i_name]
                raw = cells[i_val]
                value, note = parse_number(raw)
                unit = cells[i_unit] if 0 <= i_unit < len(cells) else ""

                # Birim ayrı sütunda değilse değerin içinde olabilir: "12,5 mg"
                if not unit:
                    um = re.search(r"(kcal|kJ|µg|mcg|mg|g|IU|%)\b", raw, re.I)
                    if um:
                        unit = um.group(1)
                # Bileşen adının sonundaki parantezli birim: "Protein (g)"
                if not unit:
                    um = re.search(r"\(([^)]{1,8})\)\s*$", cname)
                    if um:
                        unit = um.group(1)

                if value is None and not note:
                    continue  # tamamen boş satır

                food.components.append(Component(
                    name=re.sub(r"\s*\([^)]{1,8}\)\s*$", "", cname).strip() or cname,
                    value=value, unit=clean(unit), note=note, group=group, raw=raw,
                ))

        if not food.components:
            log.warning("bileşen bulunamadı: %s (%s)", name, url)
            self.failed.append({"url": url, "reason": "bileşen tablosu bulunamadı"})
            return None

        return food

    # -- toplu çekim --------------------------------------------------------

    def scrape(self, urls: list[str], limit: int | None = None) -> list[Food]:
        if limit:
            urls = urls[:limit]
        foods: list[Food] = []
        total = len(urls)
        t0 = time.monotonic()

        for i, url in enumerate(urls, 1):
            try:
                html = self.get(url)
                if not html:
                    continue
                food = self.parse_food(html, url)
                if food:
                    foods.append(food)
                    log.info("[%d/%d] %s — %d bileşen", i, total, food.name, len(food.components))
            except KeyboardInterrupt:
                log.warning("Kullanıcı durdurdu. %d gıda çekilmişti; önbellek korunuyor.", len(foods))
                break
            except Exception as e:  # tek gıda yüzünden tüm çekim durmasın
                log.exception("beklenmeyen hata (%s): %s", url, e)
                self.failed.append({"url": url, "reason": f"{type(e).__name__}: {e}"})

        dt = time.monotonic() - t0
        log.info("Bitti: %d/%d gıda, %d hata, %.1f dk", len(foods), total, len(self.failed), dt / 60)
        return foods


# ----------------------------------------------------------------------------
# İnceleme modu — sayfa yapısını görmek için
# ----------------------------------------------------------------------------

def inspect(scraper: TurKompScraper, url: str) -> None:
    html = scraper.get(url)
    if not html:
        print("Sayfa alınamadı.")
        return
    soup = BeautifulSoup(html, "html.parser")
    print(f"\n=== {url} ===")
    print(f"HTML uzunluğu: {len(html)}")
    print(f"<title>: {clean(soup.title.get_text()) if soup.title else '—'}")
    for sel in NAME_SELECTORS:
        el = soup.select_one(sel)
        if el:
            print(f"Ad adayı  {sel:16} -> {clean(el.get_text())[:80]}")
    tables = soup.find_all("table")
    print(f"\n{len(tables)} tablo bulundu:")
    for i, t in enumerate(tables, 1):
        rows = t.find_all("tr")
        head = [clean(c.get_text()) for c in rows[0].find_all(["th", "td"])] if rows else []
        print(f"\n  Tablo {i}: {len(rows)} satır · sınıf={t.get('class')} id={t.get('id')}")
        print(f"    başlık: {head}")
        print(f"    sütun eşlemesi: {TurKompScraper._column_map(head)}")
        for r in rows[1:4]:
            print(f"    örnek : {[clean(c.get_text()) for c in r.find_all(['td', 'th'])]}")
    links = {a['href'] for a in soup.find_all('a', href=True) if FOOD_URL_RE.search(a['href'])}
    print(f"\nSayfadaki /food-... link sayısı: {len(links)}")
    for l in list(links)[:5]:
        print("   ", l)
    print("\nBu çıktıya göre ayarlar bölümündeki NAME_SELECTORS / COL_HINTS / FOOD_URL_RE düzeltilebilir.")


# ----------------------------------------------------------------------------
# Dışa aktarma
# ----------------------------------------------------------------------------

def export_json(foods: list[Food], path: str) -> None:
    data = {
        "kaynak": "TürKomp — Ulusal Gıda Kompozisyon Veri Tabanı, T.C. Tarım ve Orman Bakanlığı",
        "kaynak_url": BASE,
        "cekim_tarihi": time.strftime("%Y-%m-%d"),
        "gida_sayisi": len(foods),
        "birim_notu": "Değerler aksi belirtilmedikçe 100 g yenebilir kısım içindir.",
        "gidalar": [asdict(f) for f in foods],
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    log.info("JSON yazıldı: %s", path)


def export_csv(foods: list[Food], path: str) -> None:
    """Her satır bir gıda; sütunlar tüm gıdalarda görülen bileşenlerin birleşimi."""
    comp_names: list[str] = []
    seen: set[str] = set()
    units: dict[str, str] = {}
    for f in foods:
        for c in f.components:
            if c.name not in seen:
                seen.add(c.name)
                comp_names.append(c.name)
            if c.unit and c.name not in units:
                units[c.name] = c.unit

    header = ["id", "ad", "url"] + [f"{n} ({units[n]})" if n in units else n for n in comp_names]
    with open(path, "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh, delimiter=";")     # Excel TR için noktalı virgül
        w.writerow(header)
        for f in foods:
            m = {c.name: c for c in f.components}
            row = [f.id, f.name, f.url]
            for n in comp_names:
                c = m.get(n)
                if c is None:
                    row.append("")
                elif c.value is None:
                    row.append(c.note)
                else:
                    row.append(str(c.value).replace(".", ","))
            w.writerow(row)
    log.info("CSV yazıldı: %s (%d sütun)", path, len(header))


def export_sqlite(foods: list[Food], path: str) -> None:
    if os.path.exists(path):
        os.remove(path)
    con = sqlite3.connect(path)
    cur = con.cursor()
    cur.executescript("""
        CREATE TABLE foods (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, food_group TEXT, scientific TEXT
        );
        CREATE TABLE components (
            food_id TEXT NOT NULL REFERENCES foods(id),
            name TEXT NOT NULL, value REAL, unit TEXT, note TEXT, comp_group TEXT, raw TEXT
        );
        CREATE INDEX idx_comp_food ON components(food_id);
        CREATE INDEX idx_comp_name ON components(name);
    """)
    cur.executemany("INSERT INTO foods VALUES (?,?,?,?,?)",
                    [(f.id, f.name, f.url, f.group, f.scientific) for f in foods])
    cur.executemany("INSERT INTO components VALUES (?,?,?,?,?,?,?)",
                    [(f.id, c.name, c.value, c.unit, c.note, c.group, c.raw)
                     for f in foods for c in f.components])
    con.commit()
    con.close()
    log.info("SQLite yazıldı: %s", path)


# Uygulamanın beklediği çekirdek alanlar için bileşen adı eşleşmeleri.
# Sitedeki adlar farklıysa buraya ekleyin; küçük harfe çevrilip "içeriyor mu" diye bakılır.
CORE_MATCH = {
    "kcal": ["enerji, hesaplanmış", "enerji (kcal)", "enerji"],
    "p": ["protein"],
    "c": ["karbonhidrat, toplam", "karbonhidrat"],
    "f": ["yağ, toplam", "toplam yağ", "yağ"],
    "fib": ["diyet lifi", "lif, toplam", "posa", "lif"],
}


def _pick(comps: dict[str, Component], keys: list[str]) -> Component | None:
    """Verilen adaylardan ilk eşleşen bileşeni döner (önce birebir, sonra içerme)."""
    for k in keys:
        if k in comps:
            return comps[k]
    for k in keys:
        for name, c in comps.items():
            if k in name:
                return c
    return None


def export_app_js(foods: list[Food], path: str) -> None:
    """
    Uygulamanın data-foods.js biçimine yakın bir JS dosyası üretir.

    Çekirdek alanlar (kcal, p, c, f, fib) uygulamanın bugünkü modeliyle birebir;
    tüm bileşenler ayrıca `comp` altında ad/değer/birim olarak taşınır.
    Dosya büyük olacağı için uygulamada ayrı bir modül olarak, besin detayı
    açıldığında yüklenmesi önerilir.
    """
    out_foods = []
    skipped = 0
    for f in foods:
        comps = {c.name.lower(): c for c in f.components}
        core = {}
        for key, names in CORE_MATCH.items():
            c = _pick(comps, names)
            core[key] = round(c.value, 2) if (c and c.value is not None) else 0
        if not core["kcal"]:
            skipped += 1
            continue
        out_foods.append({
            "id": "tk-" + f.id,
            "n": f.name,
            "cat": f.group or "TürKomp",
            "src": "TürKomp",
            "url": f.url,
            **core,
            "u": [],
            "comp": [[c.name, c.value if c.value is not None else c.note, c.unit]
                     for c in f.components],
        })

    body = ",\n    ".join(json.dumps(x, ensure_ascii=False) for x in out_foods)
    js = f"""/* TürKomp — Ulusal Gıda Kompozisyon Veri Tabanı (T.C. Tarım ve Orman Bakanlığı)
   Kaynak: {BASE}
   Çekim tarihi: {time.strftime('%Y-%m-%d')} · {len(out_foods)} gıda
   Değerler aksi belirtilmedikçe 100 g yenebilir kısım içindir.
   Bu dosya tools/turkomp_scraper.py tarafından üretilir; elle düzenlemeyin.

   Alanlar: id, n (ad), cat (grup), src (kaynak), url, kcal, p, c, f, fib,
            comp = [[bileşen adı, değer, birim], ...] (tüm bileşenler) */
(function () {{
  'use strict';
  DA.data.turkomp = [
    {body}
  ];
}})();
"""
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(js)
    size_mb = os.path.getsize(path) / 1048576
    log.info("Uygulama JS yazıldı: %s (%d gıda, %.1f MB)", path, len(out_foods), size_mb)
    if skipped:
        log.warning("%d gıda enerji değeri bulunamadığı için JS'e alınmadı "
                    "(CORE_MATCH eşlemesini kontrol edin).", skipped)
    if size_mb > 2:
        log.warning("Dosya %.1f MB. Telefonda ilk açılışı yavaşlatmamak için bu modülü "
                    "ana pakete koymayın; besin detayı açıldığında yükleyin.", size_mb)


# ----------------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------------

def main() -> int:
    global BASE
    ap = argparse.ArgumentParser(
        description="TürKomp gıda kompozisyon verisi çekici",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__.split("Kullanım")[-1],
    )
    ap.add_argument("--out", default="turkomp_out", help="çıktı klasörü")
    ap.add_argument("--base", default=BASE, help="site kök adresi (alan adı değişirse ya da test için)")
    ap.add_argument("--limit", type=int, help="yalnızca ilk N gıda (deneme için)")
    ap.add_argument("--delay", type=float, nargs=2, metavar=("MIN", "MAX"),
                    default=list(DELAY_RANGE), help="istekler arası rastgele gecikme (sn)")
    ap.add_argument("--inspect", metavar="URL", help="tek sayfanın yapısını dök")
    ap.add_argument("--links-only", action="store_true", help="yalnızca linkleri topla ve yaz")
    ap.add_argument("--export-only", action="store_true", help="ağa çıkma, önbellekten üret")
    ap.add_argument("--retry-failed", action="store_true", help="önceki hataları tekrar dene")
    ap.add_argument("--no-robots", action="store_true", help="robots.txt kontrolünü atla")
    ap.add_argument("--contact", default="", help="User-Agent'a eklenecek iletişim (e-posta/URL)")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    setup_logging(args.out, args.verbose)
    BASE = args.base.rstrip("/")
    scraper = TurKompScraper(args.out, tuple(args.delay), not args.no_robots, args.contact)

    if args.inspect:
        inspect(scraper, args.inspect)
        return 0

    links_file = os.path.join(args.out, "food_links.json")
    failed_file = os.path.join(args.out, "failed.json")

    # 1) Linkler
    if args.retry_failed:
        if not os.path.exists(failed_file):
            log.error("failed.json yok.")
            return 1
        with open(failed_file, encoding="utf-8") as f:
            links = [x["url"] for x in json.load(f)]
        log.info("%d başarısız link tekrar denenecek.", len(links))
    elif os.path.exists(links_file) and (args.export_only or not args.links_only):
        with open(links_file, encoding="utf-8") as f:
            links = json.load(f)
        log.info("%d link dosyadan okundu (yeniden taramak için %s dosyasını silin).",
                 len(links), links_file)
    else:
        links = scraper.collect_food_links()
        with open(links_file, "w", encoding="utf-8") as f:
            json.dump(links, f, ensure_ascii=False, indent=1)
        log.info("%d link yazıldı: %s", len(links), links_file)

    if args.links_only:
        return 0
    if not links:
        log.error("İşlenecek link yok.")
        return 1

    # 2) Çekim / ayrıştırma
    if args.export_only:
        log.info("--export-only: yalnızca önbellekteki sayfalar ayrıştırılacak.")
        foods = []
        for url in links:
            path = cache_path(scraper.cache_dir, url)
            if not os.path.exists(path):
                continue
            try:
                with open(path, encoding="utf-8") as f:
                    food = scraper.parse_food(f.read(), url)
                if food:
                    foods.append(food)
            except Exception as e:
                log.exception("ayrıştırma hatası (%s): %s", url, e)
        log.info("Önbellekten %d gıda ayrıştırıldı.", len(foods))
    else:
        foods = scraper.scrape(links, args.limit)

    if not foods:
        log.error("Hiç gıda ayrıştırılamadı. Bir sayfayı --inspect ile inceleyin.")
        if scraper.failed:
            with open(failed_file, "w", encoding="utf-8") as f:
                json.dump(scraper.failed, f, ensure_ascii=False, indent=1)
        return 1

    # 3) Çıktılar
    export_json(foods, os.path.join(args.out, "foods.json"))
    export_csv(foods, os.path.join(args.out, "foods.csv"))
    export_sqlite(foods, os.path.join(args.out, "turkomp.sqlite"))
    export_app_js(foods, os.path.join(args.out, "data-foods-turkomp.js"))

    with open(failed_file, "w", encoding="utf-8") as f:
        json.dump(scraper.failed, f, ensure_ascii=False, indent=1)
    if scraper.failed:
        log.warning("%d sayfa alınamadı; ayrıntı: %s (--retry-failed ile tekrar deneyin)",
                    len(scraper.failed), failed_file)

    all_comps = {c.name for f in foods for c in f.components}
    log.info("Özet: %d gıda · %d farklı bileşen · çıktılar %s", len(foods), len(all_comps), args.out)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nDurduruldu.")
        sys.exit(130)
