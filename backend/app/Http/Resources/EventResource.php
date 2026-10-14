<?php

namespace App\Http\Resources;

use App\Models\Event;
use App\Services\Calendar\EventExporter;
use App\Support\RuDate;
use App\Support\Text;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Event
 */
class EventResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $weekday = RuDate::weekday($this->starts_at);
        $time = $this->all_day ? null : $this->starts_at->format('H:i');
        $calendar = app(EventExporter::class);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'tag' => $this->tag,
            'main' => $this->is_main,
            'live' => $this->has_stream,
            'streamUrl' => $this->stream_url,
            'startsAt' => $this->starts_at->toIso8601String(),
            'endsAt' => $this->ends_at?->toIso8601String(),
            'allDay' => $this->all_day,
            'year' => $this->starts_at->year,
            'month' => $this->starts_at->month,
            'day' => $this->starts_at->day,
            'mon' => RuDate::monthShort($this->starts_at),
            'dow' => $this->starts_at->dayOfWeekIso,
            'dowLabel' => $weekday,
            'timeLabel' => $time,
            'when' => implode(' · ', array_filter([$weekday, $time, $this->place])),
            'place' => $this->place,
            'addr' => $this->address,
            'desc' => Text::blocks($this->description),
            'sermon' => new SermonResource($this->whenLoaded('sermon')),
            'hymns' => SongResource::collection($this->whenLoaded('songs')),
            'hymnIds' => $this->whenLoaded('songs', fn () => $this->songs->pluck('id')),
            // Добавить событие в календарь: файл .ics (Apple, Outlook, Яндекс) и формы Google и Outlook.
            'calendar' => [
                'ics' => route('api.events.ics', $this->id),
                'google' => $calendar->googleUrl($this->resource),
                'outlook' => $calendar->outlookUrl($this->resource),
            ],
        ];
    }
}
