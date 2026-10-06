import { stories } from './stories.js';

// Story texts are keyed by their Russian originals (taken from stories.js).
const trStories = {
  jesus: {
    title: 'Who is Jesus?', lead: 'The story that changed the world — in pictures.',
    panels: [
      ['Beginning', 'God loves people', 'God made the world and people to live close to them. People drifted away from Him — and He promised to send a Savior.'],
      ['The news', 'An angel visits Mary', 'In little Nazareth an angel appears to young Mary: she will have a Son — Jesus, “God saves.” She answers: “Let it be so.”'],
      ['Birth', 'Born in Bethlehem', 'Not in a palace but in a stable: there was no room in the house for Mary and Joseph. This is how the King came into the world — quietly and simply.'],
      ['The road', 'The ministry begins', 'Thirty-year-old Jesus comes to the Jordan River and is baptized. A voice from heaven says: “You are My beloved Son.”'],
      ['Teacher', 'He taught and healed', 'By the Sea of Galilee and on the hills, Jesus taught people to love even their enemies, healed the sick and invited everyone to follow Him.'],
      ['The cross', 'He gave His life for us', 'Jesus was condemned and crucified. He went willingly, to take our mistakes on Himself and open the way to God.'],
      ['Victory', 'He is risen!', 'On the third day the women came to the tomb — and found it empty. Jesus is alive! Death is defeated.'],
      ['For you', 'He is calling you', 'Jesus is alive and today invites everyone: “Follow Me.” This is the start of a new story — yours.'],
    ],
  },
  christmas: {
    title: 'What is Christmas?', lead: 'The night God came to us.',
    panels: [
      ['The road', 'The long road to Bethlehem', 'Mary and Joseph travel to Bethlehem for the census. The road is long, and Mary is about to give birth.'],
      ['Night', 'Jesus is born', 'Every house is full — the Baby is laid in a manger. A special star lights up over Bethlehem.'],
      ['Shepherds', 'Good news', 'Angels tell the shepherds: “Do not be afraid! Today a Savior is born.” The shepherds run to see the Child.'],
      ['Wise men', 'A star leads to the King', 'Wise men from the east follow the star for many days and bring gifts: gold, frankincense and myrrh.'],
      ['Meaning', 'God with us', 'Christmas is not only gifts and a tree. It is the feast when God became a Man to be close to every one of us.'],
    ],
  },
  easter: {
    title: 'What is Easter?', lead: 'The feast of life’s victory over death.',
    panels: [
      ['Entry', 'The King on a donkey', 'Jesus rides into Jerusalem, and the crowd greets Him with palm branches: “Hosanna!”'],
      ['Supper', 'The last supper', 'At supper Jesus breaks bread and passes the cup — showing that He will give Himself for people.'],
      ['Friday', 'The cross', 'Jesus dies on the cross. His followers are in despair — it seems everything is over. But this is not the end.'],
      ['Sunday', 'The empty tomb', 'Early in the morning the women see: the stone is rolled away, the tomb is empty. “He is risen!” says the angel.'],
      ['Meaning', 'Christ is risen!', 'Easter is the main Christian feast. Death is defeated, and every one of us has hope for new life.'],
    ],
  },
};

const storyEN = {};
Object.entries(trStories).forEach(([slug, tr]) => {
  const s = stories[slug];
  storyEN[s.title] = tr.title;
  storyEN[s.lead] = tr.lead;
  s.panels.forEach((p, i) => {
    storyEN[p.tag] = tr.panels[i][0];
    storyEN[p.title] = tr.panels[i][1];
    storyEN[p.text] = tr.panels[i][2];
  });
});

// Only keys missing from the main dictionaries are added (see i18n.js).
export const EN_EXTRA = {
  ...storyEN,
  'Рождество': 'Christmas',
  'Пасха': 'Easter',
  'Кто': 'Who',
  'такой': 'is',
  'Читать как комикс': 'Read as a comic',
  'Фото · общение': 'Photos · fellowship',
  'Хорошая новость простыми словами — о том, почему это важно для тебя.': 'Good news in plain words — and why it matters to you.',
  'Ближайшее · 28 июня': 'Next · June 28',
  'Большая': 'Bolshaya',
  'Озёрная, 27': 'Ozernaya, 27',
  'Все новости': 'All news',
  'Смотреть': 'Watch',
  'Идёт богослужение': 'Service is live',
  'На главную': 'Home',
  'Читай дальше': 'Keep reading',
};

export const KY_EXTRA = {
  'Поклонная': 'Поклонная',
  'Читать как комикс': 'Комикс катары окуу',
  'Фото · общение': 'Сүрөт · баарлашуу',
  'Хорошая новость простыми словами — о том, почему это важно для тебя.': 'Жакшы кабар жөнөкөй сөздөр менен — бул сиз үчүн эмне үчүн маанилүү экенин билиңиз.',
  'Ближайшее · 28 июня': 'Жакынкы · 28-июнь',
  'Большая': 'Большая',
  'Озёрная, 27': 'Озёрная, 27',
  'Все новости': 'Бардык жаңылыктар',
  'Смотреть': 'Көрүү',
  'Идёт богослужение': 'Кызмат түз эфирде',
  'На главную': 'Башкы бет',
  'Читай дальше': 'Андан ары окуу',
};
