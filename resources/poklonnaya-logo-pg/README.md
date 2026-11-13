# Логотип «Церковь на Поклонной горе»

Знак ПГ-храм + надпись. Надпись переведена в кривые (Sofia Sans Condensed 800 / 600), шрифт подключать не нужно.
Цвета: #231f20, #ffffff, акцент #02b7e3.

## svg/ и png/
- logo-horizontal(.svg, -white) — основной, для шапки сайта и документов
- logo-vertical(.svg, -white) — для обложек, печати, заставок
- mark, mark-white — знак отдельно
- mark-small — знак для размеров меньше 40 px (крест толще)
- icon-dark, icon-light — иконка приложения; icon-maskable — для Android (PWA)
- avatar-dark, avatar-cyan — аватарки соцсетей (обрезаются кругом)
- favicon.svg, favicon.ico
- site.webmanifest — манифест для PWA
- preview.png — лист со всеми вариантами и примерами применения

## Правила
- Свободное поле вокруг — не меньше толщины ножки знака ×2.
- Минимальная высота горизонтального логотипа — 32 px; меньше — только знак (mark-small).
- Не менять пропорции, не перекрашивать строки в разные цвета.

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon-dark-180.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#231f20">
<a href="/" aria-label="Церковь на Поклонной горе"><img src="/logo-horizontal.svg" alt="" height="46"></a>
```
