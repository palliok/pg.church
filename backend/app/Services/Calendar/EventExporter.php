<?php

namespace App\Services\Calendar;

use App\Models\Event;
use App\Models\Setting;
use DateTimeZone;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Sabre\VObject\Component\VCalendar;

/**
 * События в форматах, которые понимают календари: файл iCalendar (.ics,
 * RFC 5545) для Apple, Outlook, Яндекса и подписки, и ссылки «добавить
 * событие» для Google Календаря и Outlook в браузере.
 */
class EventExporter
{
    /** Адрес церкви из настроек: подставляется событиям без своего адреса. */
    private ?string $churchAddress = null;

    /**
     * Календарь из событий в формате iCalendar. Время пишется в UTC, поэтому
     * описание часовых поясов (VTIMEZONE) не нужно — календарь сам переведёт
     * его в пояс пользователя.
     *
     * @param  iterable<Event>  $events
     */
    public function calendar(iterable $events, string $name): string
    {
        $calendar = new VCalendar([
            'PRODID' => '-//'.$name.'//Расписание//RU',
            'CALSCALE' => 'GREGORIAN',
            'METHOD' => 'PUBLISH',
            'X-WR-CALNAME' => $name,
            'X-WR-TIMEZONE' => config('app.timezone'),
            // Как часто подписанным календарям перечитывать расписание.
            'X-PUBLISHED-TTL' => 'PT1H',
        ]);
        $calendar->add('REFRESH-INTERVAL', 'PT1H', ['VALUE' => 'DURATION']);

        foreach ($events as $event) {
            $this->addEvent($calendar, $event);
        }

        return $calendar->serialize();
    }

    /**
     * Ссылка, открывающая в Google Календаре форму нового события.
     */
    public function googleUrl(Event $event): string
    {
        [$start, $end] = $event->all_day
            ? [$event->starts_at->format('Ymd'), $event->endsAtOrDefault()->addDay()->format('Ymd')]
            : [$this->utc($event->starts_at)->format('Ymd\THis\Z'), $this->utc($event->endsAtOrDefault())->format('Ymd\THis\Z')];

        return 'https://calendar.google.com/calendar/render?'.http_build_query([
            'action' => 'TEMPLATE',
            'text' => $event->title,
            'dates' => $start.'/'.$end,
            'details' => Str::limit($this->description($event), 1000),
            'location' => $this->location($event),
        ], '', '&', PHP_QUERY_RFC3986);
    }

    /**
     * Ссылка, открывающая в Outlook (outlook.com и Microsoft 365) форму нового события.
     */
    public function outlookUrl(Event $event): string
    {
        [$start, $end] = $event->all_day
            ? [$event->starts_at->format('Y-m-d'), $event->endsAtOrDefault()->addDay()->format('Y-m-d')]
            : [$this->utc($event->starts_at)->format('Y-m-d\TH:i:s\Z'), $this->utc($event->endsAtOrDefault())->format('Y-m-d\TH:i:s\Z')];

        return 'https://outlook.live.com/calendar/0/deeplink/compose?'.http_build_query([
            'path' => '/calendar/action/compose',
            'rru' => 'addevent',
            'subject' => $event->title,
            'startdt' => $start,
            'enddt' => $end,
            'allday' => $event->all_day ? 'true' : 'false',
            'body' => Str::limit($this->description($event), 1000),
            'location' => $this->location($event),
        ], '', '&', PHP_QUERY_RFC3986);
    }

    /**
     * Страница события на сайте.
     */
    public function siteUrl(Event $event): string
    {
        return config('church.site_url').'/schedule/'.$event->id;
    }

    private function addEvent(VCalendar $calendar, Event $event): void
    {
        $vevent = $calendar->add('VEVENT', [
            'UID' => 'event-'.$event->id.'@'.(parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost'),
            'DTSTAMP' => $this->utc(now()),
            'SUMMARY' => $event->title,
            'STATUS' => 'CONFIRMED',
            'URL' => $this->siteUrl($event),
        ]);

        if ($event->all_day) {
            // У событий на весь день DTEND — следующий день после последнего.
            $vevent->add('DTSTART', $event->starts_at->toDateTimeImmutable(), ['VALUE' => 'DATE']);
            $vevent->add('DTEND', $event->endsAtOrDefault()->addDay()->toDateTimeImmutable(), ['VALUE' => 'DATE']);
        } else {
            $vevent->add('DTSTART', $this->utc($event->starts_at));
            $vevent->add('DTEND', $this->utc($event->endsAtOrDefault()));
        }

        if ($location = $this->location($event)) {
            $vevent->add('LOCATION', $location);
        }

        $vevent->add('DESCRIPTION', $this->description($event));

        if ($event->updated_at) {
            $vevent->add('LAST-MODIFIED', $this->utc($event->updated_at));
        }
    }

    private function location(Event $event): string
    {
        $this->churchAddress ??= (string) Setting::query()->where('key', 'church_address')->value('value');

        return implode(', ', array_filter([$event->place, $event->address ?: $this->churchAddress]));
    }

    private function description(Event $event): string
    {
        return trim($event->description."\n\n".$this->siteUrl($event));
    }

    private function utc(Carbon $date): \DateTimeImmutable
    {
        return $date->toDateTimeImmutable()->setTimezone(new DateTimeZone('UTC'));
    }
}
