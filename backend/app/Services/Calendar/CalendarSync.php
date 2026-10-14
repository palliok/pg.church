<?php

namespace App\Services\Calendar;

use App\Models\CalendarSource;
use App\Models\Event;
use DateTimeZone;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Sabre\VObject\Component\VCalendar;
use Sabre\VObject\Component\VEvent;
use Sabre\VObject\ParseException;
use Sabre\VObject\Reader;
use Throwable;

/**
 * Загружает события из внешнего календаря по ссылке в формате iCalendar.
 *
 * Синхронизируется окно от PAST_DAYS дней назад до FUTURE_DAYS дней вперёд;
 * повторяющиеся события разворачиваются в отдельные даты. Из календаря
 * берутся название, описание, место и время — они перезаписываются при
 * каждой синхронизации. Всё, что добавлено на сайте (метка, флаги, гимны,
 * проповедь, публикация), сохраняется. Событие, исчезнувшее из календаря или
 * отменённое в нём, удаляется с сайта; если к нему уже написана проповедь —
 * снимается с публикации. Личные события (CLASS:PRIVATE) не загружаются.
 */
class CalendarSync
{
    public const int PAST_DAYS = 30;

    public const int FUTURE_DAYS = 365;

    private const int MAX_BYTES = 5 * 1024 * 1024;

    public function sync(CalendarSource $source): SyncResult
    {
        try {
            $result = $this->import($source, $this->download((string) $source->url));
        } catch (Throwable $e) {
            $message = $e instanceof CalendarSyncFailed ? $e->getMessage() : 'Не удалось обработать календарь: '.$e->getMessage();
            $source->forceFill(['last_error' => Str::limit($message, 1000)])->save();

            throw $e instanceof CalendarSyncFailed ? $e : new CalendarSyncFailed($message, previous: $e);
        }

        $source->forceFill(['last_synced_at' => now(), 'last_error' => null])->save();

        return $result;
    }

    private function download(string $url): string
    {
        // webcal:// — то же, что https://: так ссылки на подписку отдают Apple и Outlook.
        $url = preg_replace('#^webcals?://#i', 'https://', trim($url));

        try {
            $response = Http::timeout(20)
                ->accept('text/calendar, */*')
                ->withUserAgent('PoklonnayaGora-CalendarSync/1.0')
                ->get($url);
        } catch (ConnectionException) {
            throw new CalendarSyncFailed('Не удалось подключиться к календарю. Проверьте ссылку и доступ сервера в интернет.');
        }

        if (! $response->successful()) {
            throw new CalendarSyncFailed("Календарь ответил ошибкой {$response->status()}. Проверьте, что ссылка верна и календарь доступен по ней.");
        }

        if (strlen($response->body()) > self::MAX_BYTES) {
            throw new CalendarSyncFailed('Календарь слишком большой (больше 5 МБ).');
        }

        return $response->body();
    }

    private function import(CalendarSource $source, string $ics): SyncResult
    {
        try {
            $calendar = Reader::read($ics, Reader::OPTION_FORGIVING);
        } catch (ParseException) {
            $calendar = null;
        }

        if (! $calendar instanceof VCalendar) {
            throw new CalendarSyncFailed('По ссылке не календарь в формате iCalendar (.ics). Нужна ссылка именно на iCal/ICS, а не на страницу календаря.');
        }

        $timezone = new DateTimeZone(config('app.timezone'));
        $from = now()->subDays(self::PAST_DAYS)->startOfDay();
        $to = now()->addDays(self::FUTURE_DAYS)->endOfDay();

        // Повторяющиеся события → отдельные даты, всё время → UTC; время без
        // пояса считается временем церкви.
        $instances = $calendar->expand($from, $to, $timezone)->select('VEVENT');

        $result = new SyncResult;

        DB::transaction(function () use ($source, $instances, $timezone, $from, $to, $result) {
            $seen = [];

            foreach ($instances as $vevent) {
                $data = $this->eventData($vevent, $timezone);

                if ($data === null) {
                    continue;
                }

                $uid = $this->uid($vevent);
                $seen[] = $uid;

                $event = Event::query()->firstOrNew(['calendar_source_id' => $source->id, 'external_uid' => $uid]);
                $event->fill($data);

                if (! $event->exists) {
                    $event->is_published = $source->publish_events;
                    $event->save();
                    $result->created++;
                } elseif ($event->isDirty()) {
                    $event->save();
                    $result->updated++;
                }
            }

            $gone = Event::query()
                ->where('calendar_source_id', $source->id)
                ->whereBetween('starts_at', [$from, $to])
                ->whereNotIn('external_uid', $seen)
                ->withExists('sermon')
                ->get();

            foreach ($gone as $event) {
                if (! $event->sermon_exists) {
                    $event->delete();
                    $result->deleted++;
                } elseif ($event->is_published) {
                    $event->update(['is_published' => false]);
                    $result->hidden++;
                }
            }
        });

        return $result;
    }

    /**
     * Поля события из VEVENT; null — событие на сайт не попадает.
     *
     * @return array<string, mixed>|null
     */
    private function eventData(VEvent $vevent, DateTimeZone $timezone): ?array
    {
        if (! isset($vevent->DTSTART)
            || strtoupper((string) $vevent->STATUS) === 'CANCELLED'
            || in_array(strtoupper((string) $vevent->CLASS), ['PRIVATE', 'CONFIDENTIAL'], true)) {
            return null;
        }

        $allDay = ! $vevent->DTSTART->hasTime();
        $start = Carbon::instance($vevent->DTSTART->getDateTime($timezone))->setTimezone($timezone);

        $end = match (true) {
            isset($vevent->DTEND) => Carbon::instance($vevent->DTEND->getDateTime($timezone))->setTimezone($timezone),
            isset($vevent->DURATION) => $start->copy()->add($vevent->DURATION->getDateInterval()),
            default => null,
        };

        if ($allDay) {
            // В календарях конец события на весь день — следующий день после последнего.
            $lastDay = $end?->copy()->subDay()->startOfDay();
            $end = $lastDay?->greaterThan($start) ? $lastDay : null;
        } elseif ($end?->lessThanOrEqualTo($start)) {
            $end = null;
        }

        return [
            'title' => Str::limit($this->line((string) $vevent->SUMMARY) ?: 'Без названия', 255, ''),
            'description' => $this->text((string) $vevent->DESCRIPTION),
            'place' => Str::limit($this->line((string) $vevent->LOCATION), 255, '') ?: null,
            'starts_at' => $start,
            'ends_at' => $end,
            'all_day' => $allDay,
        ];
    }

    /**
     * Ключ события в календаре. У каждой даты повторяющегося события свой ключ:
     * UID плюс дата повтора (RECURRENCE-ID).
     */
    private function uid(VEvent $vevent): string
    {
        $uid = trim((string) $vevent->UID) ?: sha1($vevent->DTSTART->getValue().(string) $vevent->SUMMARY);

        if (isset($vevent->{'RECURRENCE-ID'})) {
            $uid .= '#'.$vevent->{'RECURRENCE-ID'}->getValue();
        }

        return strlen($uid) > 255 ? sha1($uid) : $uid;
    }

    private function line(string $value): string
    {
        return trim(preg_replace('/\s+/u', ' ', $value));
    }

    /**
     * Описание как обычный текст: Google Календарь кладёт в него HTML.
     */
    private function text(string $value): ?string
    {
        if (preg_match('#</?[a-z][^>]*>#i', $value)) {
            $value = preg_replace('#<br\s*/?>|</p>|</div>|</li>#i', "\n", $value);
            $value = html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        $value = preg_replace("/\n{3,}/", "\n\n", trim(str_replace("\r\n", "\n", $value)));

        return $value === '' ? null : $value;
    }
}
