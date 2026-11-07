<?php

namespace Database\Seeders;

use App\Enums\AnnouncementAction;
use App\Enums\AnnouncementWhen;
use App\Models\Announcement;
use App\Models\Event;
use App\Models\Minister;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Листок «Расписание богослужений» № 489, 8–15 ноября 2026: расписание и объявления.
 * Повторный запуск обновляет записи, а не дублирует их.
 *
 * php artisan db:seed --class=Bulletin489Seeder
 */
class Bulletin489Seeder extends Seeder
{
    /** Объявления листка висят до конца его недели. */
    private const WEEK_END = '2026-11-15';

    public function run(): void
    {
        DB::transaction(function () {
            $this->seedEvents();
            $this->seedAnnouncements();
        });
    }

    private function seedEvents(): void
    {
        $ministers = [
            'Мищенко' => $this->minister('Мищенко', 'Мищенко Александр Иванович'),
            'Синичкин' => $this->minister('Синичкин', 'Синичкин Алексей Валерьевич'),
            'Третьяк' => $this->minister('Третьяк', 'Третьяк Антон Иванович'),
            'Швецов' => $this->minister('Швецов', 'Швецов Павел Борисович'),
        ];

        foreach ([
            // начало, конец, название, тег, главное, трансляция, описание, проповедь [служитель, место Писания]
            ['2026-11-08 11:00', '13:00', 'Богослужение', 'Воскресенье', true, true,
                'Проповедуют: Салонников Г. П., Пиманов В. В., Мищенко А. И.', ['Мищенко', 'Ефесянам 2:4–7']],
            ['2026-11-08 13:00', '13:15', 'Членское собрание', 'Воскресенье', false, false,
                'Сразу после утреннего богослужения.', null],
            ['2026-11-08 16:00', '18:00', 'Богослужение', 'Воскресенье', false, true,
                'Проповедуют: Шмелев Я. О., Тофан Ю. Н., Синичкин А. В.', ['Синичкин', 'Ефесянам 2:4–7']],
            ['2026-11-08 18:30', '21:00', 'Молодёжное общение', 'Молодёжь', false, false, null, null],
            ['2026-11-10 19:00', '21:00', 'Молитвенное богослужение', 'Будни', false, false,
                'Ведут: Паламарчук Д. В., Боровков С. Н.', null],
            ['2026-11-12 19:00', '21:00', 'Библейские уроки', 'Будни', false, false,
                '«Так говорит Библия»: Евангелие от Марка.', null],
            ['2026-11-15 11:00', '13:00', 'Богослужение', 'Воскресенье', true, true,
                'Проповедуют: Курманцев К. М., Неволин М. Т., Третьяк А. И.', ['Третьяк', 'Ефесянам 2:8–10']],
            ['2026-11-15 16:00', '18:00', 'Богослужение', 'Воскресенье', false, true,
                'Проповедуют: Антонов М. И., Беклемешев А. Ю., Швецов П. Б.', ['Швецов', 'Ефесянам 2:8–10']],
            ['2026-11-15 18:30', '21:00', 'Молодёжное общение', 'Молодёжь', false, false, null, null],
        ] as [$start, $end, $title, $tag, $main, $stream, $description, $sermon]) {
            $startsAt = Carbon::parse($start);

            $event = Event::query()->updateOrCreate(
                ['title' => $title, 'starts_at' => $startsAt, 'calendar_source_id' => null],
                [
                    'tag' => $tag,
                    'ends_at' => $startsAt->copy()->setTimeFromTimeString($end),
                    'all_day' => false,
                    'description' => $description,
                    'is_main' => $main,
                    'has_stream' => $stream,
                    'is_published' => true,
                ],
            );

            if ($sermon) {
                [$minister, $ref] = $sermon;

                // Темы проповедей в листке нет — пока тема совпадает с местом Писания.
                $event->sermon()->updateOrCreate([], [
                    'minister_id' => $ministers[$minister]->id,
                    'topic' => $ref,
                    'scripture_ref' => $ref,
                ]);
            }
        }
    }

    private function seedAnnouncements(): void
    {
        foreach ([
            [
                'title' => '«Мамы в молитве»',
                'body' => 'Приглашаем на сестринское общение по теме «Мудрость построила себе дом».',
                'when_type' => AnnouncementWhen::Date,
                'event_date' => '2026-11-08',
                'when_note' => 'с 13:30, после членского собрания',
                'place' => '4 класс',
                'links' => [['text' => 'Сайт «Мамы в молитве»', 'url' => 'https://www.momsinprayer.ru']],
                'main_action' => AnnouncementAction::None,
                'contact_name' => 'Мамы в молитве',
                'contact_phone' => '8 (981) 725-88-09',
            ],
            [
                'title' => 'Раздача вещей и обуви',
                'body' => 'Социальное служение раздаёт вещи и обувь. Подходите, смотрите, забирайте!',
                'when_type' => AnnouncementWhen::Date,
                'event_date' => '2026-11-08',
                'when_note' => 'после членского собрания',
                'place' => 'возле офиса «Добрый самарянин»',
            ],
            [
                'title' => 'Встреча Выборгского района',
                'body' => "Приглашаем на общение братьев и сестёр, живущих в Выборгском районе.\n\n"
                    .'Регистрация по телефону: 8 (952) 226-55-92 — Андрей, 8 (951) 682-13-81 — Николай, 8 (952) 381-16-89 — Алексей.',
                'when_type' => AnnouncementWhen::Date,
                'event_date' => '2026-11-14',
                'when_note' => '11:00–15:00',
                'place' => 'зал церкви',
                'main_action' => AnnouncementAction::Contact,
                'contact_name' => 'Андрей',
                'contact_phone' => '8 (952) 226-55-92',
            ],
            [
                'title' => 'Молитвенная группа «24 часа»',
                'body' => 'Встреча служителей для совместной молитвы. Приглашаем всех желающих сестёр!',
                'when_type' => AnnouncementWhen::Date,
                'event_date' => '2026-11-14',
                'when_note' => 'с 11:00',
                'place' => '4 класс',
                'contact_name' => 'Молитвенная группа «24 часа»',
                'contact_phone' => '8 (981) 040-19-18',
            ],
            [
                'title' => 'Воскресная чайная ищет помощников',
                'body' => 'Приглашаем помощников в команду служения — приходите в чайную после утреннего богослужения.',
                'when_type' => AnnouncementWhen::None,
                'when_note' => 'после утреннего богослужения',
                'place' => 'чайная',
                'visible_until' => self::WEEK_END,
            ],
            [
                'title' => 'Осенний субботник',
                'body' => 'Дорогие друзья, приглашаем всех принять участие в уборке осенней листвы на территории Дома молитвы. '
                    .'Приходите в удобное вам время и обращайтесь к дежурному администратору. Грабли и горячий кофе и чай ждут вас!',
                'when_type' => AnnouncementWhen::None,
                'when_note' => 'в удобное время',
                'place' => 'территория Дома молитвы',
                'main_action' => AnnouncementAction::Contact,
                'contact_name' => 'Дежурный администратор',
                'contact_phone' => '8 (911) 123-43-43',
                'visible_until' => self::WEEK_END,
            ],
        ] as $data) {
            $data += ['event_id' => null, 'links' => null, 'main_action' => AnnouncementAction::None, 'is_published' => true];

            Announcement::query()->updateOrCreate(
                ['title' => $data['title'], 'event_date' => $data['event_date'] ?? null],
                $data,
            );
        }
    }

    /**
     * Служитель ищется по фамилии: в админке имя могут записать и «Синичкин Алексей», и «Алексей Синичкин».
     */
    private function minister(string $surname, string $fullName): Minister
    {
        return Minister::query()
            ->where(fn ($query) => $query->where('name', 'ilike', $surname.' %')->orWhere('name', 'ilike', '% '.$surname))
            ->first()
            ?? Minister::query()->create(['name' => $fullName]);
    }
}
