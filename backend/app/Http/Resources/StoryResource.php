<?php

namespace App\Http\Resources;

use App\Models\Story;
use App\Models\StoryPanel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Story
 */
class StoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'kicker' => $this->kicker,
            'title' => $this->title,
            'lead' => $this->lead,
            'cover' => $this->cover_scene,
            'bg' => $this->background,
            'panels' => $this->whenLoaded('panels', fn () => $this->panels->map(fn (StoryPanel $panel) => [
                'scene' => $panel->scene,
                'tag' => $panel->tag,
                'title' => $panel->title,
                'text' => $panel->text,
            ])),
        ];
    }
}
