<?php

namespace App\Http\Resources;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Announcement
 */
class AnnouncementResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $links = $this->links ?? [];
        $event = $this->upcomingEvent();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'important' => $this->important,
            'publishedAt' => $this->published_at->toIso8601String(),
            'eventDate' => $this->event_date?->toDateString(),
            'eventDateEnd' => $this->event_date_end?->toDateString(),
            'deadline' => $this->deadline?->toDateString(),
            'weekly' => $this->weekday ? ['dow' => $this->weekday, 'time' => $this->weekly_time] : null,
            'event' => $event ? new EventResource($event) : null,
            // Строки с иконками: «когда», «где» и ссылки; первая ссылка может быть главной кнопкой.
            'details' => [
                ...($this->when_note ? [['type' => 'when', 'text' => $this->when_note]] : []),
                ...($this->place ? [['type' => 'where', 'text' => $this->place]] : []),
                ...array_map(fn (array $link, int $index) => [
                    'type' => 'link',
                    'text' => $link['text'],
                    'url' => $link['url'],
                    'primary' => $index === 0 && $this->primary_link,
                ], $links, array_keys($links)),
            ],
            'contact' => $this->contact_phone ? [
                'name' => $this->contact_name,
                'phone' => $this->contact_phone,
                'tel' => $this->contactTel(),
            ] : null,
        ];
    }
}
