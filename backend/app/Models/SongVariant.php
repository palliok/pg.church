<?php

namespace App\Models;

use App\Support\ChordPro;
use App\Support\Text;
use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['song_id', 'letter', 'label', 'is_default', 'key', 'capo', 'artist', 'composer', 'lyricist', 'chordpro'])]
class SongVariant extends Model
{
    use CrudTrait;

    /** Буквы вариантов по порядку: 214а, 214б… */
    private const string LETTERS = 'абвгдежзиклмнопрстуфхцчшщэюя';

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'capo' => 'integer',
        ];
    }

    /**
     * Основной вариант у песни один: отмеченный снимает отметку с остальных.
     */
    protected static function booted(): void
    {
        static::saving(function (SongVariant $variant) {
            if ($variant->is_default && $variant->isDirty(['is_default', 'song_id'])) {
                static::query()
                    ->where('song_id', $variant->song_id)
                    ->when($variant->exists, fn (Builder $query) => $query->whereKeyNot($variant->getKey()))
                    ->update(['is_default' => false]);
            }
        });
    }

    /**
     * @return BelongsTo<Song, $this>
     */
    public function song(): BelongsTo
    {
        return $this->belongsTo(Song::class);
    }

    /**
     * @return BelongsToMany<Event, $this>
     */
    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class);
    }

    /**
     * По номеру песни, затем по букве — порядок гимнов служения и списков в админке.
     *
     * @param  Builder<SongVariant>  $query
     */
    public function scopeOrderBySong(Builder $query): void
    {
        $query->orderBy(Song::query()->select('number')->whereColumn('songs.id', 'song_variants.song_id'))->orderBy('letter');
    }

    /**
     * Песня с тональностью этого варианта и его буквой (`variant`, если вариант
     * не основной) — для списков песен вроде гимнов служения.
     */
    public function asSong(): Song
    {
        return (clone $this->song)->forceFill([
            'key' => $this->key,
            'variant' => $this->is_default ? null : $this->letter,
        ]);
    }

    /**
     * Основной вариант первым, остальные по букве. Если основной не отмечен,
     * им считается первый по букве.
     *
     * @param  Builder<SongVariant>  $query
     */
    public function scopeDefaultFirst(Builder $query): void
    {
        $query->orderByDesc('is_default')->orderBy('letter');
    }

    /**
     * Первая свободная буква для нового варианта песни.
     */
    public static function nextLetter(int $songId): string
    {
        $used = static::query()->where('song_id', $songId)->pluck('letter')->all();

        return collect(mb_str_split(self::LETTERS))->first(fn (string $letter) => ! in_array($letter, $used, true)) ?? '';
    }

    /**
     * «214б · Свят, свят, свят · PG music» — подпись в выпадающих списках админки.
     * Если у песни один вариант (`variants_count` подгружен), буквы нет: «214 · Свят, свят, свят».
     */
    protected function displayName(): Attribute
    {
        return Attribute::get(function () {
            $single = ($this->song?->variants_count ?? 2) < 2;

            return implode(' · ', array_filter([
                $this->song?->number.($single ? '' : $this->letter),
                $this->song?->title,
                $single ? null : $this->label,
            ]));
        });
    }

    /**
     * Текст с аккордами в формате ChordPro. При записи вставленные «аккорды над
     * строкой» приводятся к ChordPro, а в lyrics сохраняются одни слова: в исходном
     * тексте аккорды разрывают слова. По lyrics подбирается строка для списка,
     * а поиск идёт по search_text — тем же словам без знаков препинания.
     */
    protected function chordpro(): Attribute
    {
        return Attribute::set(function (?string $value) {
            $chordpro = ChordPro::normalize($value);
            $lyrics = ChordPro::plainText($chordpro) ?: null;

            return ['chordpro' => $chordpro, 'lyrics' => $lyrics, 'search_text' => Text::searchable($lyrics) ?: null];
        });
    }

    /**
     * Текст, разобранный на секции (куплеты, припевы) со строками и аккордами.
     *
     * @return Attribute<list<array{type: ?string, label: ?string, lines: list<list<array{chord: ?string, text: string}>>}>, never>
     */
    protected function sections(): Attribute
    {
        return Attribute::get(fn () => ChordPro::parse($this->chordpro));
    }
}
