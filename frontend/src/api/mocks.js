// Моки публичного API для режима `npm run dev:mock` / `build:mock`: фронт работает без бэкенда.
// Ответы повторяют форматы /api/v1 (backend/README.md) и демо-наполнение DemoContentSeeder.
// Модуль подгружается из client.js динамически и в обычную сборку не попадает.

const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const MONTHS_SHORT = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
const MONTHS_GENITIVE = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const pad = (n) => String(n).padStart(2, '0');

// Дата через days дней от сегодня, в заданное время.
function fromToday(days, hours = 12, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// Ближайший день недели (0 — воскресенье) после сегодняшнего, как Carbon::next().
function nextWeekday(weekday, hours, minutes = 0) {
  const shift = (weekday - new Date().getDay() + 7) % 7 || 7;
  return fromToday(shift, hours, minutes);
}

const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00+03:00`;

const dateParts = (date) => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
  mon: MONTHS_SHORT[date.getMonth()],
});

const dayAndMonth = (date) => `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;

const ADDRESS = 'Большая Озёрная, 27';

// ===== Контакты и трансляция =====

const church = {
  name: 'Поклонная гора',
  city: 'Санкт-Петербург',
  address: ADDRESS,
  metro: 'Озерки · 7 минут пешком',
  phone: '+7 911 123-43-43',
  phoneHref: 'tel:+79111234343',
  social: [
    { code: 'TG', label: 'Telegram', href: 'https://t.me/' },
    { code: 'YT', label: 'YouTube', href: 'https://www.youtube.com/' },
  ],
  duty: {
    hours: '10:00–18:00',
    shifts: [
      { weekday: 2, dow: 'Вт', name: 'Алексей Синичкин' },
      { weekday: 3, dow: 'Ср', name: 'Антон Третьяк' },
      { weekday: 4, dow: 'Чт', name: 'Игорь Кузнецов' },
      { weekday: 5, dow: 'Пт', name: 'Павел Швецов' },
    ],
  },
  calendarFeed: { ics: '#', webcal: '#', google: '#' },
};

const LIVE_LINKS = [
  { url: 'https://www.youtube.com/', platform: 'youtube', name: 'YouTube' },
  { url: 'https://vkvideo.ru/', platform: 'vk', name: 'VK Видео' },
  { url: 'https://rutube.ru/', platform: 'rutube', name: 'Rutube' },
];

// Число площадок можно задать адресом страницы: `?live=1` или `?live=2` — чтобы посмотреть все варианты модалки,
// `?live=0` — эфира нет. signLink (сурдоперевод) бэкенд пока не отдаёт.
function live() {
  const count = new URLSearchParams(window.location.search).get('live');
  const links = count == null ? LIVE_LINKS : LIVE_LINKS.slice(0, Number(count));

  return {
    isLive: links.length > 0,
    links,
    signLink: links.length > 0 ? { url: 'https://www.youtube.com/', platform: 'youtube', name: 'YouTube' } : null,
    text: 'Идёт воскресное богослужение — присоединяйся онлайн',
  };
}

// ===== Песни =====

const CATEGORIES = [
  { id: 1, name: 'Поклонение' },
  { id: 2, name: 'Прославление' },
  { id: 3, name: 'Гимны' },
];

const SONG_TITLES = [
  'Свят, свят, свят', 'Ты верен', 'Хвалите Господа', 'Милость без границ',
  'Ближе к Тебе', 'Вечная любовь', 'Твой свет во мне', 'Я верю',
  'Господь — пастырь мой', 'Славлю Тебя', 'Дух Святой, приди', 'Ты — моя скала',
  'Аллилуйя навсегда', 'В руках Твоих', 'Милосердие Твоё', 'Царь царей',
  'Ты рядом', 'Песнь искупленных', 'Свобода во Христе', 'Твоя благодать',
  'Немеркнущий свет', 'Радость моя', 'Голгофский крест', 'Живая вода',
];

const LYRICS = [
  ['verse', 'Куплет 1', ['[E]Свят, свят, свят Гос[A]подь Вседержи[E]тель,', 'Вся зем[C#m]ля пол[A]на славы Тво[H7]ей.']],
  ['chorus', 'Припев', ['Те[A]бе поём хва[E]лу, Тебе одно[H7]му,', 'Дос[A]тоин Ты при[E]нять честь и [H7]си[E]лу.']],
  ['verse', 'Куплет 2', ['[E]Пред престолом Тво[A]им прекло[E]няюсь,', 'В серд[C#m]це ти[A]шина и по[H7]кой.']],
];

// Строка ChordPro → части { chord, text }, как отдаёт App\Support\ChordPro.
function chordLine(line) {
  const chunks = line.split(/\[([^\]]+)\]/);
  const parts = chunks[0] === '' ? [] : [{ chord: null, text: chunks[0] }];

  for (let i = 1; i < chunks.length; i += 2) parts.push({ chord: chunks[i], text: chunks[i + 1] });

  return parts;
}

const SECTIONS = LYRICS.map(([type, label, lines]) => ({ type, label, lines: lines.map(chordLine) }));

const songs = SONG_TITLES.map((title, index) => {
  const category = CATEGORIES[index % 3];

  return { id: index + 1, num: 60 + index * 7, title, sub: null, category: category.name, categoryId: category.id, key: 'E' };
});

const songWithText = (song) => ({ ...song, hasChords: true, sections: SECTIONS });

function searchSongs(term) {
  const query = term.trim().toLowerCase();
  const inLyrics = LYRICS.some(([, , lines]) => lines.some((line) => line.replace(/\[[^\]]+\]/g, '').toLowerCase().includes(query)));

  return songs.filter((song) => inLyrics || song.title.toLowerCase().includes(query) || String(song.num) === query);
}

// ===== События =====

const sermon = {
  id: 1,
  initial: 'АС',
  name: 'Алексей Синичкин',
  role: 'Старший пастор',
  topic: 'Надежда, которая не разочаровывает',
  ref: 'Римлянам 5:1–5',
  intro: 'Разговор о том, почему христианская надежда — это не оптимизм и не самовнушение, а что-то более прочное.',
  verse: '«А надежда не постыжает, потому что любовь Божия излилась в сердца наши Духом Святым, данным нам».',
  verseRef: 'Римлянам 5:5',
  outline: [
    'Оправдание даёт нам мир с Богом',
    'Скорби производят стойкость характера',
    'Характер рождает надежду',
    'Надежда держится не на нас, а на любви Божьей',
  ].map((text, index) => ({ n: index + 1, text })),
  audioUrl: null,
  durationMinutes: 42,
  durationLabel: 'Слушать 42 мин',
};

function event(id, { title, tag, startsAt, place, desc, main = false, live: hasStream = false, withSermon = false, hymnNums = [] }) {
  const weekday = WEEKDAYS[startsAt.getDay()];
  const time = `${pad(startsAt.getHours())}:${pad(startsAt.getMinutes())}`;
  const hymns = songs.filter((song) => hymnNums.includes(song.num));

  return {
    id,
    title,
    tag,
    main,
    live: hasStream,
    streamUrl: null,
    startsAt: iso(startsAt),
    endsAt: null,
    allDay: false,
    ...dateParts(startsAt),
    dow: startsAt.getDay() || 7,
    dowLabel: weekday,
    timeLabel: time,
    when: [weekday, time, place].join(' · '),
    place,
    addr: ADDRESS,
    desc,
    sermon: withSermon ? sermon : null,
    hymns,
    hymnIds: hymns.map((song) => song.id),
    calendar: { ics: '#', google: '#', outlook: '#' },
  };
}

// Расписание на четыре недели вперёд: воскресное служение, молитва по средам, молодёжь по пятницам.
function buildEvents() {
  const list = [];

  for (let week = 0; week < 4; week += 1) {
    const sunday = nextWeekday(0, 11);
    sunday.setDate(sunday.getDate() + week * 7);
    const wednesday = nextWeekday(3, 19);
    wednesday.setDate(wednesday.getDate() + week * 7);
    const friday = nextWeekday(5, 19, 30);
    friday.setDate(friday.getDate() + week * 7);

    list.push(event(list.length + 1, {
      title: 'Богослужение',
      tag: 'Воскресенье',
      startsAt: sunday,
      place: 'Главный зал',
      desc: [
        'Воскресное богослужение — время совместного поклонения, молитвы и слова. Приходите заранее, чтобы найти место и познакомиться с теми, кто рядом.',
        'После служения — чай и общение в фойе. Детская программа проходит параллельно, для малышей открыта комната с 10:45.',
      ],
      main: true,
      live: true,
      withSermon: week === 0,
      hymnNums: week === 0 ? [88, 214] : [],
    }));
    list.push(event(list.length + 1, {
      title: 'Молитвенная встреча',
      tag: 'Будни',
      startsAt: wednesday,
      place: 'Малый зал',
      desc: ['Собираемся вместе, чтобы молиться друг за друга, за город и за тех, кто ищет Бога.'],
    }));
    list.push(event(list.length + 1, {
      title: 'Молодёжная встреча',
      tag: 'Молодёжь',
      startsAt: friday,
      place: 'Молодёжный зал',
      desc: ['Игры, обсуждение и время в слове для тех, кому от 14 до 25.'],
    }));
  }

  return list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

const events = buildEvents();

// В списке расписания проповедь и гимны не загружаются — как в EventController::index.
const eventSummary = ({ sermon: _sermon, hymns: _hymns, hymnIds: _hymnIds, ...rest }) => rest;

// ===== Объявления =====
// Формат опережает бэкенд: дата, isNew, when, where и contact пока есть только здесь,
// /api/v1/announcements отдаёт { id, title, body }.

function announcement(id, isNew, daysAgo, title, body, { when = null, where = null, contact = null } = {}) {
  const date = fromToday(-daysAgo);
  const tel = contact ? `tel:+${contact.phone.replace(/\D/g, '').replace(/^8(\d{10})$/, '7$1')}` : null;

  return {
    id,
    title,
    body,
    isNew,
    ...dateParts(date),
    date: dayAndMonth(date),
    when,
    where,
    contact: contact ? { ...contact, tel } : null,
  };
}

const announcements = [
  announcement(1, true, 0, 'Сбор продуктов для нуждающихся', 'Приносите крупы, консервы и средства гигиены. Всё передадим семьям нашего района.', {
    when: 'До конца месяца, после служений', where: 'Фойе, стол у входа', contact: { name: 'Ольга', phone: '+7 911 000-12-34' },
  }),
  announcement(2, true, 2, 'Запись в детский лагерь', 'Открыта запись на летнюю смену для детей 7–12 лет. Мест: 30.', {
    when: '14–20 июля', where: 'База «Сосновый бор», Ленобласть', contact: { name: 'Марина', phone: '8 911 000-45-67' },
  }),
  announcement(3, true, 4, 'Нужны волонтёры на кухню', 'Ищем помощников для воскресных обедов. Можно прийти один раз и попробовать.', {
    where: 'Кухня, цокольный этаж',
  }),
  announcement(4, false, 12, 'Членское собрание после богослужения', 'В воскресенье после богослужения — членское собрание церкви в главном зале.\nПросим членов церкви остаться.', {
    where: 'Главный зал',
  }),
  announcement(5, false, 25, 'Субботник на территории церкви', 'Берите перчатки и хорошее настроение — приведём двор в порядок к лету.', {
    when: 'Суббота, 10:00', where: 'Двор церкви', contact: { name: 'Игорь', phone: '+7 911 000-77-88' },
  }),
];

// ===== Новости и блог =====

const TAGS = {
  Вера: { label: 'Вера', color: '#ffffff', text: '#0d0d0d' },
  Новичкам: { label: 'Новичкам', color: 'var(--c-main)', text: '#0d0d0d' },
  Вопросы: { label: 'Вопросы', color: '#ffffff', text: '#0d0d0d' },
  Церковь: { label: 'Церковь', color: '#f9c9a5', text: '#0d0d0d' },
  Семья: { label: 'Семья', color: '#ffffff', text: '#0d0d0d' },
  Отношения: { label: 'Отношения', color: 'var(--c-second)', text: '#ffffff' },
};

const posts = [
  ['news', 3, 'Как прошёл выезд молодёжи на природу', 'Молодёжка выбралась на выходные за город: разговоры у костра, игры и время в слове.', ['Вера', 'Новичкам']],
  ['news', 8, 'Запустили курс для тех, кто только начинает', 'Шестинедельный курс об основах веры для новых прихожан и всех, кто хочет разобраться.', ['Вопросы', 'Церковь']],
  ['news', 16, 'Детский праздник ко Дню защиты детей', 'Игры, мастер-классы и много смеха — детский двор церкви устроил праздник для всех семей.', ['Семья', 'Отношения']],
  ['blog', 5, 'Как читать Библию, если только начал', null, ['Вера', 'Новичкам']],
  ['blog', 12, 'Зачем вообще нужна церковь', null, ['Вопросы', 'Церковь']],
  ['blog', 20, 'О прощении — простыми словами', null, ['Семья', 'Отношения']],
].map(([type, daysAgo, title, excerpt, tags], index) => {
  const date = fromToday(-daysAgo);

  return { id: index + 1, type, title, excerpt, image: null, publishedAt: iso(date), date: dayAndMonth(date), tags: tags.map((name) => TAGS[name]) };
});

// ===== Пожертвования =====

// Заглушка вместо QR-кода: настоящий строит бэкенд по ГОСТ Р 56042-2014.
const QR_PLACEHOLDER = `data:image/svg+xml;base64,${btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29"><rect width="29" height="29" fill="#fff"/>'
  + '<path d="M2 2h7v7H2zM20 2h7v7h-7zM2 20h7v7H2z" fill="none" stroke="#0d0d0d" stroke-width="2"/>'
  + '<path d="M4 4h3v3H4zM22 4h3v3h-3zM4 22h3v3H4zM12 3h2v2h-2zM15 6h2v2h-2zM12 10h5v2h-5zM11 14h2v4h-2zM15 15h4v2h-4zM20 12h2v2h-2zM23 14h3v2h-3zM14 20h2v5h-2zM18 19h2v2h-2zM21 22h5v2h-5zM18 24h2v2h-2zM3 12h4v2H3zM6 15h2v3H6z" fill="#0d0d0d"/></svg>',
)}`;

const donation = {
  targets: [
    { title: 'Служение и аренда зала', desc: 'Воскресные богослужения и будние встречи', color: 'var(--c-second)' },
    { title: 'Помощь нуждающимся', desc: 'Продукты, лекарства, адресная поддержка', color: '#f9c9a5' },
    { title: 'Детское и молодёжное служение', desc: 'Выезды, материалы, лагеря', color: 'var(--c-main)' },
  ],
  amounts: [500, 1000, 3000],
  accounts: [{
    id: 1,
    title: 'Пожертвование на уставную деятельность',
    fields: [
      { key: 'recipient', label: 'Получатель', value: 'Местная религиозная организация Санкт-Петербургская Церковь евангельских христиан-баптистов' },
      { key: 'inn', label: 'ИНН', value: '7802038805' },
      { key: 'kpp', label: 'КПП', value: '780201001' },
      { key: 'bank', label: 'Банк', value: 'СЕВЕРО-ЗАПАДНЫЙ БАНК ПАО СБЕРБАНК' },
      { key: 'account', label: 'Расчётный счёт', value: '40703810555000000365' },
      { key: 'correspondentAccount', label: 'Корреспондентский счёт', value: '30101810500000000653' },
      { key: 'bic', label: 'БИК', value: '044030653' },
    ],
    paymentPurpose: 'Пожертвование на уставную деятельность',
    qrCode: QR_PLACEHOLDER,
  }],
};

// ===== Маршруты =====

const findById = (list, id) => list.find((item) => item.id === Number(id));

const ROUTES = [
  [/^\/church$/, () => church],
  [/^\/live$/, live],
  [/^\/announcements$/, () => announcements],
  [/^\/donation$/, () => donation],
  [/^\/events$/, (params) => events.slice(0, Number(params.get('limit')) || 50).map(eventSummary)],
  [/^\/events\/(\d+)$/, (_params, id) => findById(events, id)],
  [/^\/events\/(\d+)\/sermon$/, (_params, id) => findById(events, id)?.sermon],
  [/^\/songs$/, (params) => (params.get('q') ? searchSongs(params.get('q')) : songs)],
  [/^\/songs\/(\d+)$/, (_params, id) => {
    const song = findById(songs, id);
    return song && songWithText(song);
  }],
  [/^\/song-categories$/, () => CATEGORIES],
  [/^\/posts$/, (params) => posts.filter((post) => !params.get('type') || post.type === params.get('type'))],
  [/^\/posts\/(\d+)$/, (_params, id) => {
    const post = findById(posts, id);
    return post && { ...post, body: post.excerpt };
  }],
];

// Ответ мока по пути API: { status, data }. Небольшая задержка — чтобы были видны состояния загрузки.
export async function mockGet(path) {
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);

  await new Promise((resolve) => { setTimeout(resolve, 250); });

  for (const [pattern, handler] of ROUTES) {
    const match = pathname.match(pattern);
    if (!match) continue;

    const data = handler(params, ...match.slice(1));
    return data == null ? { status: 404 } : { status: 200, data: structuredClone(data) };
  }

  return { status: 404 };
}
