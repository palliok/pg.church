import { tx } from '../i18n.js';
// Демонстрационные данные.
// В боевой версии этот модуль заменяется на запросы к Laravel API
// (см. src/api/*.js) — форма объектов ниже специально приближена
// к тому, что логично отдавать из REST-эндпоинтов бэкенда.

export const church = {
  name: tx('Поклонная гора'),
  city: tx('Санкт-Петербург'),
  address: tx('Большая Озёрная, 27'),
  metro: tx('Озерки · 7 минут пешком'),
  phone: '+7 911 123-43-43',
  phoneHref: 'tel:+79111234343',
  social: [
    { code: 'TG', label: 'Telegram', href: '#' },
    { code: 'YT', label: 'YouTube', href: '#' },
    { code: 'IG', label: 'Instagram', href: '#' },
  ],
};

export const duty = [
  { dow: tx('Вт'), name: tx('Синичкин Алексей') },
  { dow: tx('Ср'), name: tx('Третьяк Антон') },
  { dow: tx('Чт'), name: tx('Кузнецов Игорь') },
  { dow: tx('Пт'), name: tx('Швецов Павел') },
];

export const news = [
  {
    id: 'n1',
    date: tx('14 июня'),
    title: tx('Как прошёл выезд молодёжи на природу'),
    tags: [{ label: tx('Вера'), color: '#fff' }, { label: tx('Новичкам'), color: '#ffd60a' }],
    gradient: 'linear-gradient(150deg, #7c4dff, #4a1fd6)',
    excerpt: tx('Молодёжка выбралась на выходные за город: разговоры у костра, игры и время в слове.'),
  },
  {
    id: 'n2',
    date: tx('9 июня'),
    title: tx('Запустили курс для тех, кто только начинает'),
    tags: [{ label: tx('Вопросы'), color: '#fff' }, { label: tx('Церковь'), color: '#f9c9a5' }],
    gradient: 'linear-gradient(150deg, #ffd60a, #f0a500)',
    excerpt: tx('Шестинедельный курс об основах веры для новых прихожан и всех, кто хочет разобраться.'),
  },
  {
    id: 'n3',
    date: tx('1 июня'),
    title: tx('Детский праздник ко Дню защиты детей'),
    tags: [{ label: tx('Семья'), color: '#fff' }, { label: tx('Отношения'), color: '#7c4dff', text: '#fff' }],
    gradient: 'linear-gradient(150deg, #f9c9a5, #ef8f5a)',
    excerpt: tx('Игры, мастер-классы и много смеха — детский двор церкви устроил праздник для всех семей.'),
  },
];

export const blog = [
  {
    id: 'b1',
    title: tx('Как читать Библию, если только начал'),
    tags: [{ label: tx('Вера'), color: '#fff' }, { label: tx('Новичкам'), color: '#ffd60a' }],
    gradient: 'linear-gradient(150deg, #7c4dff, #4a1fd6)',
  },
  {
    id: 'b2',
    title: tx('Зачем вообще нужна церковь'),
    tags: [{ label: tx('Вопросы'), color: '#fff' }, { label: tx('Церковь'), color: '#f9c9a5' }],
    gradient: 'linear-gradient(150deg, #ffd60a, #f0a500)',
  },
  {
    id: 'b3',
    title: tx('О прощении — простыми словами'),
    tags: [{ label: tx('Семья'), color: '#fff' }, { label: tx('Отношения'), color: '#7c4dff', text: '#fff' }],
    gradient: 'linear-gradient(150deg, #f9c9a5, #ef8f5a)',
  },
];

export const sermons = {
  s1: {
    id: 's1',
    initial: tx('АС'),
    name: tx('Алексей Синичкин'),
    role: tx('Старший пастор'),
    topic: tx('Надежда, которая не разочаровывает'),
    ref: tx('Римлянам 5:1–5'),
    intro:
      tx('Разговор о том, почему христианская надежда — это не оптимизм и не самовнушение, а что-то более прочное.'),
    verse: tx('«А надежда не постыжает, потому что любовь Божия излилась в сердца наши Духом Святым, данным нам».'),
    verseRef: tx('Римлянам 5:5'),
    outline: [
      { n: 1, text: tx('Оправдание даёт нам мир с Богом') },
      { n: 2, text: tx('Скорби производят стойкость характера') },
      { n: 3, text: tx('Характер рождает надежду') },
      { n: 4, text: tx('Надежда держится не на нас, а на любви Божьей') },
    ],
    durationLabel: tx('Слушать 42 мин'),
  },
};

export const events = [
  {
    id: 'e28',
    title: tx('Богослужение'),
    tag: tx('Воскресенье'),
    main: true,
    live: true,
    when: tx('Воскресенье · 11:00 · Главный зал'),
    day: '29',
    mon: tx('ИЮН'),
    dow: 6,
    year: 2025,
    month: 5,
    timeLabel: '11:00',
    dowLabel: tx('Воскресенье'),
    place: tx('Главный зал'),
    addr: tx('Большая Озёрная, 27'),
    desc: [
      tx('Воскресное богослужение — время совместного поклонения, молитвы и слова. Приходите заранее, чтобы найти место и познакомиться с теми, кто рядом.'),
      tx('После служения — чай и общение в фойе. Детская программа проходит параллельно, для малышей открыта комната с 10:45.'),
    ],
    preachers: [{ id: 's1', ref: 'sermons.s1' }],
    hymnIds: [214, 87],
  },
  {
    id: 'e29',
    title: tx('Молитвенная встреча'),
    tag: tx('Будни'),
    live: false,
    when: tx('Среда · 19:00 · Малый зал'),
    day: '2',
    mon: tx('ИЮЛ'),
    dow: 3,
    year: 2025,
    month: 6,
    timeLabel: '19:00',
    dowLabel: tx('Среда'),
    place: tx('Малый зал'),
    addr: tx('Большая Озёрная, 27'),
    desc: [tx('Собираемся вместе, чтобы молиться друг за друга, за город и за тех, кто ищет Бога.')],
    preachers: [],
    hymnIds: [],
  },
  {
    id: 'e30',
    title: tx('Молодёжная встреча'),
    tag: tx('Молодёжь'),
    live: false,
    when: tx('Пятница · 19:30 · Молодёжный зал'),
    day: '4',
    mon: tx('ИЮЛ'),
    dow: 5,
    year: 2025,
    month: 6,
    timeLabel: '19:30',
    dowLabel: tx('Пятница'),
    place: tx('Молодёжный зал'),
    addr: tx('Большая Озёрная, 27'),
    desc: [tx('Игры, обсуждение и время в слове для тех, кому от 14 до 25.')],
    preachers: [],
    hymnIds: [],
  },
];

export const homeEvents = events.slice(0, 3).map((e) => ({
  id: e.id,
  day: e.day,
  mon: e.mon,
  title: e.title,
  sub: e.when,
}));

export const songs = Array.from({ length: 24 }).map((_, i) => {
  const num = 60 + i * 7;
  const titles = [
    tx('Свят, свят, свят'), tx('Ты верен'), tx('Хвалите Господа'), tx('Милость без границ'),
    tx('Ближе к Тебе'), tx('Вечная любовь'), tx('Твой свет во мне'), tx('Я верю'),
    tx('Господь — пастырь мой'), tx('Славлю Тебя'), tx('Дух Святой, приди'), tx('Ты — моя скала'),
    tx('Аллилуйя навсегда'), tx('В руках Твоих'), tx('Милосердие Твоё'), tx('Царь царей'),
    tx('Ты рядом'), tx('Песнь искупленных'), tx('Свобода во Христе'), tx('Твоя благодать'),
    tx('Немеркнущий свет'), tx('Радость моя'), tx('Голгофский крест'), tx('Живая вода'),
  ];
  return {
    id: num,
    num,
    title: titles[i % titles.length],
    sub: tx('Поклонение · тональность E'),
    category: i % 3 === 0 ? tx('Поклонение') : i % 3 === 1 ? tx('Прославление') : tx('Гимны'),
    lyrics: [
      tx('Куплет 1'),
      tx('Свят, свят, свят Господь Вседержитель,\\nВся земля полна славы Твоей.'),
      tx('Припев'),
      tx('Тебе поём хвалу, Тебе одному,\\nДостоин Ты принять честь и силу.'),
      tx('Куплет 2'),
      tx('Пред престолом Твоим преклоняюсь,\\nВ сердце тишина и покой.'),
    ],
  };
});

export const donationTargets = [
  { title: tx('Служение и аренда зала'), desc: tx('Воскресные богослужения и будние встречи'), color: '#7c4dff' },
  { title: tx('Помощь нуждающимся'), desc: tx('Продукты, лекарства, адресная поддержка'), color: '#f9c9a5' },
  { title: tx('Детское и молодёжное служение'), desc: tx('Выезды, материалы, лагеря'), color: '#ffd60a' },
];

export const donationAmounts = [500, 1000, 3000];

export const donationBankDetails = {
  fields: [
    { key: 'inn', label: 'ИНН', value: '7802038805' },
    { key: 'kpp', label: 'КПП', value: '780201001' },
    { key: 'bank', label: 'Банк', value: 'СЕВЕРО-ЗАПАДНЫЙ БАНК ПАО СБЕРБАНК' },
    { key: 'account', label: 'Расчётный счёт', value: '40703810555000000365' },
    { key: 'correspondentAccount', label: 'Корреспондентский счёт', value: '30101810500000000653' },
    { key: 'bic', label: 'БИК', value: '044030653' },
  ],
  paymentPurpose: 'Пожертвование на уставную деятельность',
  qrCode: '/donation-qr.svg',
};
