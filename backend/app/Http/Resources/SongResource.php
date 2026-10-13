<?php

namespace App\Http\Resources;

use App\Models\Song;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Song
 */
class SongResource extends JsonResource
{
    /** Подпись секции, у которой в тексте нет своей: {soc} без метки — это «Припев». */
    private const array DEFAULT_LABELS = ['chorus' => 'Припев', 'prechorus' => 'Предприпев', 'bridge' => 'Бридж'];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'num' => $this->number,
            'title' => $this->title,
            'sub' => $this->subtitle,
            'category' => $this->category?->name,
            'categoryId' => $this->song_category_id,
            'key' => $this->key,
            // Текст отдаётся только там, где он выбран из базы (страница песни).
            $this->mergeWhen(array_key_exists('chordpro', $this->resource->getAttributes()), fn () => $this->text()),
        ];
    }

    /**
     * @return array{hasChords: bool, sections: list<array<string, mixed>>}
     */
    private function text(): array
    {
        $sections = $this->sections;
        $hasChords = false;

        foreach ($sections as &$section) {
            $section['label'] ??= self::DEFAULT_LABELS[$section['type'] ?? ''] ?? null;

            foreach ($section['lines'] as $parts) {
                $hasChords = $hasChords || array_filter(array_column($parts, 'chord')) !== [];
            }
        }

        return ['hasChords' => $hasChords, 'sections' => $sections];
    }
}
