<?php

namespace App\Http\Resources;

use App\Models\Sermon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Sermon
 */
class SermonResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'initial' => $this->minister?->initials,
            'name' => $this->minister?->name,
            'role' => $this->minister?->role,
            'topic' => $this->topic,
            'ref' => $this->scripture_ref,
            'intro' => $this->intro,
            'verse' => $this->verse,
            'verseRef' => $this->verse_ref,
            'outline' => collect($this->outline_points)
                ->map(fn (string $text, int $index) => ['n' => $index + 1, 'text' => $text])
                ->all(),
            'audioUrl' => $this->audio_url,
            'durationMinutes' => $this->duration_minutes,
            'durationLabel' => $this->duration_minutes ? "Слушать {$this->duration_minutes} мин" : null,
        ];
    }
}
