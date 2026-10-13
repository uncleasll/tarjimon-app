# Falaq Tarjima — tarjima trekeri

React + Vite + Tailwind. Bitta sahifa, uchta bo‘lim: **Umumiy** (dashboard), **Kitoblar** (filtr + tahrir), **Tarjimonlar**.

## Ishga tushirish
```bash
npm install
npm run dev        # http://localhost:5173 — ma’lumot localStorage’da; bo‘sh ekranda «Excel’dagi ma’lumotni yuklash» tugmasi bor
npm run build      # dist/index.html (to‘liq sayt) + dist/artifact.html (claude.ai artifact uchun fragment)
```

## Ma’lumot modeli
- `translators/{id}` — `{ name, telegram, aliases[] }`
- `books/{id}` — `{ titleAr, titleUz, author, publisher, segment, translatorId, totalPages, donePages, deadline (YYYY-MM-DD), status, note, logs[], createdAt, updatedAt }`
  - `status`: `navbatda | tarjimada | tugagan | toxtagan`
  - `logs`: `[{ d: 'YYYY-MM-DD', p: <jami qilingan sahifa> }]` — «Qilingan sahifa» o‘zgarganda avtomatik yoziladi; tezlik (sahifa/hafta) va taxminiy tugash sanasi shundan hisoblanadi

## Xavf mantig‘i (`src/logic.js` → `assess`)
- muddat o‘tgan → **Kechikdi**
- tarixga ko‘ra taxminiy tugash sanasi muddatdan keyin, yoki oxirgi haftalarda siljish yo‘q, yoki (tarix bo‘lmasa) kerakli tezlik > 60 sahifa/hafta → **Xavf ostida**
- aks holda → **Me’yorda**; muddatsiz / tarjimonsiz / to‘xtagan / tugagan alohida ko‘rsatiladi

## Backend
`src/store.js` — bitta adapter interfeysi: `subscribe, setBook, deleteBook, setTranslator, deleteTranslator`.
Hozir ikkita amalga oshirilgan: claude.ai `db` (umumiy, real vaqtda) va `localStorage` (dev). Supabase uchun shu beshta metodni `supabase-js` bilan yozish kifoya — UI o‘zgarmaydi.

`data/seed.json` — ikkala Excel’dan olingan boshlang‘ich ma’lumot (`scripts/make_seed.py` bilan qayta hosil qilinadi).
