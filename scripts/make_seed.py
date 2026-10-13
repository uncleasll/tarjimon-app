import openpyxl, json, re, sys, datetime
UP = sys.argv[1]
files = [
    (UP + "/03ac1c05-________________________diniy.xlsx", "diniy"),
    (UP + "/bf8afd0c-____________________.xlsx", "badiiy"),
]
# raw translator spelling -> (id, canonical latin name)
TR = {
    "Абдулҳамид Умар Али": ("t-abdulhamid", "Abdulhamid Umar Ali"),
    "Элдорбек": ("t-eldorbek", "Eldorbek"),
    "Муҳйиддин Эргашев": ("t-muhyiddin", "Muhyiddin Ergashev"),
    "Абдулбосит Мелибоев": ("t-abdulbosit", "Abdulbosit Meliboyev"),
    "Abdulbosit": ("t-abdulbosit", "Abdulbosit Meliboyev"),
    "Мурод": ("t-murod", "Murod"),
    "Murod": ("t-murod", "Murod"),
    "Абдуқодир Абдуқаҳҳоров": ("t-abduqodir", "Abduqodir Abduqahhorov"),
    "Komron": ("t-komron", "Komron"),
    "Комрон": ("t-komron", "Komron"),
    "Najmiddinov Baxtiyor": ("t-baxtiyor", "Baxtiyor Najmiddinov"),
    "Ҳумоюн Нодиров": ("t-humoyun", "Humoyun Nodirov"),
    "Саодат опа": ("t-saodat", "Saodat opa"),
    "Илҳомжон Тўхтаев": ("t-ilhomjon", "Ilhomjon To‘xtayev"),
    "Abdulloh Hasan": ("t-abdulloh", "Abdulloh Hasan"),
    "Аҳмадхон Атоуллоҳ": ("t-ahmadxon", "Ahmadxon Atoulloh"),
    "Оятуллоҳ Абдукадиров": ("t-oyatulloh", "Oyatulloh Abduqodirov"),
    "Abdussami": ("t-abdussami", "Abdussami"),
    "Абу Бакр Икром": ("t-abubakr", "Abu Bakr Ikrom"),
    "Саййидмаҳмуд": ("t-sayyidmahmud", "Sayyidmahmud"),
    "Маҳмуджон Мухторов": ("t-mahmudjon", "Mahmudjon Muxtorov"),
    "Fayzulloh": ("t-fayzulloh", "Fayzulloh"),
}
def clean(v):
    if v is None: return ""
    return re.sub(r"\s+", " ", str(v).replace("\xa0", " ")).strip()

translators = {}
books = []
n = 0
TODAY = "2026-10-13"
for path, segment in files:
    ws = openpyxl.load_workbook(path).worksheets[0]
    for row in ws.iter_rows(min_row=2, values_only=True):
        title = clean(row[1])
        if not title: continue
        n += 1
        author, publisher, tr_raw, pages, muddat = clean(row[2]), clean(row[3]), clean(row[4]), row[5], row[6]
        seg = segment; note = ""
        tid = ""
        if tr_raw in TR:
            tid, name = TR[tr_raw]
            t = translators.setdefault(tid, {"name": name, "telegram": "", "aliases": []})
            if tr_raw != name and tr_raw not in t["aliases"]: t["aliases"].append(tr_raw)
        elif tr_raw == "bolalar adabiyoti":
            seg = "bolalar"; note = "bolalar adabiyoti"
        total = done = 0
        if isinstance(pages, (int, float)): total = int(pages)
        elif isinstance(pages, str) and "/" in pages:
            a, b = pages.split("/"); total, done = int(a), int(b)
        deadline = ""; status = "tarjimada" if tid else "navbatda"
        if isinstance(muddat, datetime.datetime):
            deadline = muddat.strftime("%Y-%m-%d")
        elif isinstance(muddat, str):
            m = muddat.strip().lower()
            if m == "tugagan":
                status = "tugagan"; done = total
            elif m:
                note = (note + "; " if note else "") + muddat.strip()
        logs = [{"d": TODAY, "p": done}] if done > 0 and status != "tugagan" else []
        books.append({
            "id": f"b{n:02d}", "titleAr": title, "titleUz": "", "author": author, "publisher": publisher,
            "segment": seg, "translatorId": tid, "totalPages": total, "donePages": done,
            "deadline": deadline, "status": status, "note": note, "logs": logs,
            "createdAt": TODAY, "updatedAt": TODAY,
        })
json.dump({"translators": [{"id": k, **v} for k, v in translators.items()], "books": books},
          open("public/seed.json", "w"), ensure_ascii=False, indent=1)
print(len(books), "books,", len(translators), "translators")
