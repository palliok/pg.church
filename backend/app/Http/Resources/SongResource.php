<?php

namespace App\Http\Resources;

use App\Models\Song;
use App\Models\SongVariant;
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
            // Тональность основного варианта.
            'key' => $this->key,
            // Строка текста для списка: с совпадением при поиске, иначе первая.
            'line' => $this->whenHas('line'),
            // Буква варианта, где нашлась строка, если это не основной вариант.
            'variant' => $this->whenHas('variant'),
            // Тексты отдаются только там, где варианты загружены (страница песни).
            'variants' => $this->whenLoaded('variants', fn () => $this->variants->map($this->variant(...))->all()),
        ];
    }

    /**
     * @return array{letter: string, label: ?string, isDefault: bool, key: ?string, capo: ?int, tempo: ?int, time: ?string, artist: ?string, composer: ?string, lyricist: ?string, hasChords: bool, sections: list<array<string, mixed>>}
     */
    private function variant(SongVariant $variant, int $index): array
    {
        $sections = $variant->sections;
        $hasChords = false;

        foreach ($sections as &$section) {
            $section['label'] ??= self::DEFAULT_LABELS[$section['type'] ?? ''] ?? null;

            foreach ($section['lines'] as $parts) {
                $hasChords = $hasChords || array_filter(array_column($parts, 'chord')) !== [];
            }
        }

        return [
            'letter' => $variant->letter,
            'label' => $variant->label,
            // Если основной не отмечен, им считается первый в списке.
            'isDefault' => $index === 0,
            'key' => $variant->key,
            // Лад каподастра, темп, размер и авторы — как {capo}, {tempo}, {time}, {artist}, {composer}, {lyricist} в ChordPro.
            'capo' => $variant->capo,
            'tempo' => $variant->tempo,
            'time' => $variant->time,
            'artist' => $variant->artist,
            'composer' => $variant->composer,
            'lyricist' => $variant->lyricist,
            'hasChords' => $hasChords,
            'sections' => $sections,
        ];
    }
}
