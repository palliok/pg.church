<?php

namespace App\Http\Resources;

use App\Models\Post;
use App\Models\Tag;
use App\Support\RuDate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin Post
 */
class PostResource extends JsonResource
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
            'type' => $this->type->value,
            'title' => $this->title,
            'excerpt' => $this->excerpt,
            // Полный текст отдаётся только там, где он выбран из базы (страница записи).
            'body' => $this->whenHas('body'),
            'image' => $this->image ? Storage::disk('public')->url($this->image) : null,
            'publishedAt' => $this->published_at?->toIso8601String(),
            'date' => $this->published_at ? RuDate::dayAndMonth($this->published_at) : null,
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->map(fn (Tag $tag) => [
                'label' => $tag->name,
                'color' => $tag->color,
                'text' => $tag->text_color,
            ])),
        ];
    }
}
