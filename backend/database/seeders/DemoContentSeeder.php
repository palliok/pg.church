<?php

namespace Database\Seeders;

use App\Enums\PostType;
use App\Models\DonationTarget;
use App\Models\Event;
use App\Models\Minister;
use App\Models\Post;
use App\Models\Song;
use App\Models\SongCategory;
use App\Models\Story;
use App\Models\Tag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Демонстрационное наполнение — то же, что было в моках фронтенда
 * (frontend/src/data/mockData.js и stories.js). В базу с уже заведёнными
 * песнями ничего не добавляет.
 */
class DemoContentSeeder extends Seeder
{
    public function run(): void
    {
        if (Song::query()->exists()) {
            $this->command?->info('В базе уже есть песни — демо-наполнение пропущено.');

            return;
        }

        $pastor = $this->seedMinisters();
        $songs = $this->seedSongs();
        $this->seedEvents($pastor, $songs);
        $this->seedPosts();
        $this->seedStories();
        $this->seedDonationTargets();
    }

    private function seedMinisters(): Minister
    {
        $pastor = Minister::query()->create(['name' => 'Алексей Синичкин', 'role' => 'Старший пастор']);
        $pastor->dutyShifts()->create(['weekday' => 2]);

        foreach ([3 => 'Антон Третьяк', 4 => 'Игорь Кузнецов', 5 => 'Павел Швецов'] as $weekday => $name) {
            Minister::query()->create(['name' => $name])->dutyShifts()->create(['weekday' => $weekday]);
        }

        return $pastor;
    }

    /**
     * @return array<int, Song> песни по номерам
     */
    private function seedSongs(): array
    {
        $categories = [];
        foreach (['Поклонение', 'Прославление', 'Гимны'] as $sort => $name) {
            $categories[] = SongCategory::query()->create(['name' => $name, 'sort' => $sort]);
        }

        $titles = [
            'Свят, свят, свят', 'Ты верен', 'Хвалите Господа', 'Милость без границ',
            'Ближе к Тебе', 'Вечная любовь', 'Твой свет во мне', 'Я верю',
            'Господь — пастырь мой', 'Славлю Тебя', 'Дух Святой, приди', 'Ты — моя скала',
            'Аллилуйя навсегда', 'В руках Твоих', 'Милосердие Твоё', 'Царь царей',
            'Ты рядом', 'Песнь искупленных', 'Свобода во Христе', 'Твоя благодать',
            'Немеркнущий свет', 'Радость моя', 'Голгофский крест', 'Живая вода',
        ];

        $lyrics = <<<'TEXT'
            Куплет 1
            [E]Свят, свят, свят Гос[A]подь Вседержи[E]тель,
            Вся зем[C#m]ля пол[A]на славы Тво[H7]ей.

            Припев
            Те[A]бе поём хва[E]лу, Тебе одно[H7]му,
            Дос[A]тоин Ты при[E]нять честь и [H7]си[E]лу.

            Куплет 2
            [E]Пред престолом Тво[A]им прекло[E]няюсь,
            В серд[C#m]це ти[A]шина и по[H7]кой.
            TEXT;

        $songs = [];
        foreach ($titles as $index => $title) {
            $number = 60 + $index * 7;

            $songs[$number] = Song::query()->create([
                'number' => $number,
                'title' => $title,
                'song_category_id' => $categories[$index % 3]->id,
                'key' => 'E',
                'chordpro' => $lyrics,
            ]);
        }

        return $songs;
    }

    /**
     * @param  array<int, Song>  $songs
     */
    private function seedEvents(Minister $pastor, array $songs): void
    {
        $service = Event::query()->create([
            'title' => 'Богослужение',
            'tag' => 'Воскресенье',
            'starts_at' => Carbon::now()->next(Carbon::SUNDAY)->setTime(11, 0),
            'place' => 'Главный зал',
            'description' => <<<'TEXT'
                Воскресное богослужение — время совместного поклонения, молитвы и слова. Приходите заранее, чтобы найти место и познакомиться с теми, кто рядом.

                После служения — чай и общение в фойе. Детская программа проходит параллельно, для малышей открыта комната с 10:45.
                TEXT,
            'is_main' => true,
            'has_stream' => true,
        ]);

        $service->songs()->attach([$songs[214]->id, $songs[88]->id]);

        $service->sermon()->create([
            'minister_id' => $pastor->id,
            'topic' => 'Надежда, которая не разочаровывает',
            'scripture_ref' => 'Римлянам 5:1–5',
            'intro' => 'Разговор о том, почему христианская надежда — это не оптимизм и не самовнушение, а что-то более прочное.',
            'verse' => '«А надежда не постыжает, потому что любовь Божия излилась в сердца наши Духом Святым, данным нам».',
            'verse_ref' => 'Римлянам 5:5',
            'outline' => <<<'TEXT'
                Оправдание даёт нам мир с Богом
                Скорби производят стойкость характера
                Характер рождает надежду
                Надежда держится не на нас, а на любви Божьей
                TEXT,
            'duration_minutes' => 42,
        ]);

        Event::query()->create([
            'title' => 'Молитвенная встреча',
            'tag' => 'Будни',
            'starts_at' => Carbon::now()->next(Carbon::WEDNESDAY)->setTime(19, 0),
            'place' => 'Малый зал',
            'description' => 'Собираемся вместе, чтобы молиться друг за друга, за город и за тех, кто ищет Бога.',
        ]);

        Event::query()->create([
            'title' => 'Молодёжная встреча',
            'tag' => 'Молодёжь',
            'starts_at' => Carbon::now()->next(Carbon::FRIDAY)->setTime(19, 30),
            'place' => 'Молодёжный зал',
            'description' => 'Игры, обсуждение и время в слове для тех, кому от 14 до 25.',
        ]);
    }

    private function seedPosts(): void
    {
        $tags = [];
        foreach ([
            'Вера' => ['#ffffff', '#0d0d0d'],
            'Новичкам' => ['var(--c-main)', '#0d0d0d'],
            'Вопросы' => ['#ffffff', '#0d0d0d'],
            'Церковь' => ['#f9c9a5', '#0d0d0d'],
            'Семья' => ['#ffffff', '#0d0d0d'],
            'Отношения' => ['var(--c-second)', '#ffffff'],
        ] as $name => [$color, $textColor]) {
            $tags[$name] = Tag::query()->create(['name' => $name, 'color' => $color, 'text_color' => $textColor]);
        }

        $posts = [
            [PostType::News, 3, 'Как прошёл выезд молодёжи на природу', 'Молодёжка выбралась на выходные за город: разговоры у костра, игры и время в слове.', ['Вера', 'Новичкам']],
            [PostType::News, 8, 'Запустили курс для тех, кто только начинает', 'Шестинедельный курс об основах веры для новых прихожан и всех, кто хочет разобраться.', ['Вопросы', 'Церковь']],
            [PostType::News, 16, 'Детский праздник ко Дню защиты детей', 'Игры, мастер-классы и много смеха — детский двор церкви устроил праздник для всех семей.', ['Семья', 'Отношения']],
            [PostType::Blog, 5, 'Как читать Библию, если только начал', null, ['Вера', 'Новичкам']],
            [PostType::Blog, 12, 'Зачем вообще нужна церковь', null, ['Вопросы', 'Церковь']],
            [PostType::Blog, 20, 'О прощении — простыми словами', null, ['Семья', 'Отношения']],
        ];

        foreach ($posts as [$type, $daysAgo, $title, $excerpt, $tagNames]) {
            $post = Post::query()->create([
                'type' => $type,
                'title' => $title,
                'excerpt' => $excerpt,
                'published_at' => Carbon::now()->subDays($daysAgo)->setTime(12, 0),
            ]);

            $post->tags()->attach(array_map(fn (string $name) => $tags[$name]->id, $tagNames));
        }
    }

    private function seedStories(): void
    {
        $stories = [
            [
                'slug' => 'jesus', 'kicker' => 'Евангелие', 'title' => 'Кто такой Иисус?',
                'lead' => 'История, которая изменила мир — в картинках.',
                'cover_scene' => 'dawn', 'background' => 'linear-gradient(135deg,var(--c-second),var(--c-ink))',
                'panels' => [
                    ['river', 'Начало', 'Бог любит людей', 'Бог создал мир и людей, чтобы жить с ними рядом. Люди отдалились от Него — и Он пообещал прислать Спасителя.'],
                    ['field', 'Весть', 'Ангел приходит к Марии', 'В маленьком Назарете юной Марии является ангел: у неё родится Сын — Иисус, «Бог спасает». Она отвечает: «Да будет так».'],
                    ['bethlehem', 'Рождение', 'Родился в Вифлееме', 'Не во дворце, а в хлеву: для Марии и Иосифа не нашлось места в доме. Так Царь пришёл в мир — тихо и просто.'],
                    ['desert', 'Путь', 'Начало служения', 'Тридцатилетний Иисус приходит к реке Иордан и крещается. С неба звучит голос: «Ты Мой любимый Сын».'],
                    ['galilee', 'Учитель', 'Он учил и исцелял', 'У Галилейского моря и на горах Иисус учил любить даже врагов, исцелял больных и звал людей идти за Ним.'],
                    ['cross', 'Крест', 'Он отдал жизнь за нас', 'Иисуса осудили и распяли. Он сам пошёл на это, чтобы взять на Себя наши ошибки и открыть путь к Богу.'],
                    ['tomb', 'Победа', 'Он воскрес!', 'На третий день женщины пришли к гробнице — и нашли её пустой. Иисус жив! Смерть побеждена.'],
                    ['dawn', 'Для тебя', 'Он зовёт тебя', 'Иисус жив и сегодня приглашает каждого: «Иди за Мной». Это начало новой истории — твоей.'],
                ],
            ],
            [
                'slug' => 'christmas', 'kicker' => 'Рождество', 'title' => 'Что такое Рождество?',
                'lead' => 'Ночь, когда Бог пришёл к людям.',
                'cover_scene' => 'bethlehem', 'background' => 'linear-gradient(135deg,#1d1b5c,#4a3585)',
                'panels' => [
                    ['desert', 'Дорога', 'Долгий путь в Вифлеем', 'Мария и Иосиф идут в Вифлеем на перепись. Дорога дальняя, а Мария вот-вот родит.'],
                    ['bethlehem', 'Ночь', 'Родился Иисус', 'Все дома заняты — Младенца кладут в ясли. Над Вифлеемом загорается особая звезда.'],
                    ['field', 'Пастухи', 'Радостная весть', 'Ангелы говорят пастухам: «Не бойтесь! Сегодня родился Спаситель». Пастухи бегут посмотреть на Младенца.'],
                    ['magi', 'Мудрецы', 'Звезда ведёт к Царю', 'Мудрецы с востока идут за звездой много дней и приносят дары: золото, ладан и смирну.'],
                    ['dawn', 'Смысл', 'Бог с нами', 'Рождество — не только подарки и ёлка. Это праздник, когда Бог стал Человеком, чтобы быть рядом с каждым из нас.'],
                ],
            ],
            [
                'slug' => 'easter', 'kicker' => 'Пасха', 'title' => 'Что такое Пасха?',
                'lead' => 'Праздник победы жизни над смертью.',
                'cover_scene' => 'tomb', 'background' => 'linear-gradient(135deg,#f0784a,#7a2e4f)',
                'panels' => [
                    ['city', 'Вход', 'Царь на ослёнке', 'Иисус въезжает в Иерусалим, и толпа встречает Его пальмовыми ветвями: «Осанна!»'],
                    ['supper', 'Вечеря', 'Последний ужин', 'За ужином Иисус преломляет хлеб и подаёт чашу — так Он показывает, что отдаст Себя за людей.'],
                    ['cross', 'Пятница', 'Крест', 'Иисус умирает на кресте. Ученики в отчаянии — кажется, всё кончено. Но это не конец.'],
                    ['tomb', 'Воскресенье', 'Гробница пуста', 'Рано утром женщины видят: камень отвалён, гроб пуст. «Он воскрес!» — говорит ангел.'],
                    ['dawn', 'Смысл', 'Христос воскрес!', 'Пасха — главный христианский праздник. Смерть побеждена, и у каждого из нас есть надежда на новую жизнь.'],
                ],
            ],
        ];

        foreach ($stories as $sort => $data) {
            $panels = $data['panels'];
            unset($data['panels']);

            $story = Story::query()->create([...$data, 'sort' => $sort]);

            foreach ($panels as $index => [$scene, $tag, $title, $text]) {
                $story->panels()->create(['sort' => $index + 1, 'scene' => $scene, 'tag' => $tag, 'title' => $title, 'text' => $text]);
            }
        }
    }

    private function seedDonationTargets(): void
    {
        $targets = [
            ['Служение и аренда зала', 'Воскресные богослужения и будние встречи', 'var(--c-second)'],
            ['Помощь нуждающимся', 'Продукты, лекарства, адресная поддержка', '#f9c9a5'],
            ['Детское и молодёжное служение', 'Выезды, материалы, лагеря', 'var(--c-main)'],
        ];

        foreach ($targets as $sort => [$title, $description, $color]) {
            DonationTarget::query()->create([
                'title' => $title,
                'description' => $description,
                'color' => $color,
                'sort' => $sort,
            ]);
        }
    }
}
