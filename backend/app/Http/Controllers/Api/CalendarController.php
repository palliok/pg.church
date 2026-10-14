<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Setting;
use App\Services\Calendar\EventExporter;
use Illuminate\Http\Response;

class CalendarController extends Controller
{
    /** Сколько дней прошедших событий оставлять в подписке. */
    private const int PAST_DAYS = 60;

    public function __construct(private readonly EventExporter $exporter) {}

    /**
     * Расписание как календарь для подписки (webcal://): Google, Apple, Outlook
     * и Яндекс сами перечитывают его и показывают новые события.
     */
    public function feed(): Response
    {
        $events = Event::query()
            ->published()
            ->where('starts_at', '>=', now()->subDays(self::PAST_DAYS)->startOfDay())
            ->orderBy('starts_at')
            ->limit(1000)
            ->get();

        return $this->ics($this->exporter->calendar($events, $this->calendarName()), 'inline', 'schedule.ics')
            ->header('Cache-Control', 'public, max-age=900');
    }

    /**
     * Одно событие файлом .ics — для кнопки «В календарь».
     */
    public function event(int $event): Response
    {
        $event = Event::query()->published()->findOrFail($event);

        return $this->ics($this->exporter->calendar([$event], $this->calendarName()), 'attachment', "event-{$event->id}.ics");
    }

    private function calendarName(): string
    {
        return Setting::query()->where('key', 'church_name')->value('value') ?: config('app.name');
    }

    private function ics(string $content, string $disposition, string $filename): Response
    {
        return response($content, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => "{$disposition}; filename=\"{$filename}\"",
        ]);
    }
}
