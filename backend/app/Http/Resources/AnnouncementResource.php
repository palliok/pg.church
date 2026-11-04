<?php

namespace App\Http\Resources;

use App\Enums\AnnouncementAction;
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
        $action = $this->main_action ?? AnnouncementAction::None;
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
            // Строки с иконками: «когда», «где» и ссылки. Основное действие (крупная кнопка внизу) —
            // одна из ссылок или звонок контакту: у него primary.
            'details' => [
                ...($this->when_note ? [['type' => 'when', 'text' => $this->when_note]] : []),
                ...($this->place ? [['type' => 'where', 'text' => $this->place]] : []),
                ...array_map(fn (array $link, int $index) => [
                    'type' => 'link',
                    'text' => $link['text'],
                    'url' => $link['url'],
                    'primary' => $action === AnnouncementAction::Link && $index === $this->main_link,
                ], $links, array_keys($links)),
            ],
            'contact' => $this->contact_phone ? [
                'name' => $this->contact_name,
                'phone' => $this->contact_phone,
                'tel' => $this->contactTel(),
                'primary' => $action === AnnouncementAction::Contact,
            ] : null,
        ];
    }
}
