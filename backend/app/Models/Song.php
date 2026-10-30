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

#[Fillable(['number', 'title', 'song_category_id', 'key', 'chordpro'])]
class Song extends Model
{
    use CrudTrait;

    /**
     * @return BelongsTo<SongCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(SongCategory::class, 'song_category_id');
    }

    /**
     * @return BelongsToMany<Event, $this>
     */
    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class);
    }

    /**
     * Поиск по названию, строке текста или началу номера.
     *
     * @param  Builder<Song>  $query
     */
    public function scopeSearch(Builder $query, string $term): void
    {
        $like = '%'.Text::escapeLike($term).'%';

        $query->where(function (Builder $query) use ($term, $like) {
            $query->where('title', 'ilike', $like)
                ->orWhere('lyrics', 'ilike', $like);

            if (ctype_digit($term)) {
                $query->orWhereRaw('CAST(number AS TEXT) LIKE ?', [$term.'%']);
            }
        });
    }

    /**
     * Для списков: всё, кроме текста песни.
     *
     * @param  Builder<Song>  $query
     */
    public function scopeWithoutLyrics(Builder $query): void
    {
        $query->select($query->qualifyColumns(['id', 'number', 'title', 'song_category_id', 'key']));
    }

    /**
     * Строка текста для списка (`line`): первая, где встречается term, иначе первая строка песни.
     * По ней в сборнике видно, почему песня нашлась.
     *
     * @param  Builder<Song>  $query
     */
    public function scopeWithLine(Builder $query, string $term = ''): void
    {
        $first = "split_part(lyrics, E'\\n', 1)";

        if ($term === '') {
            $query->selectRaw("$first as line");

            return;
        }

        $query->selectRaw(
            "coalesce((select l from regexp_split_to_table(lyrics, E'\\n') with ordinality as t(l, n) where l ilike ? order by n limit 1), $first) as line",
            ['%'.Text::escapeLike($term).'%'],
        );
    }

    /**
     * «214 · Свят, свят, свят» — подпись в выпадающих списках админки.
     */
    protected function displayName(): Attribute
    {
        return Attribute::get(fn () => $this->number.' · '.$this->title);
    }

    /**
     * «Поклонение · тональность E»
     */
    protected function subtitle(): Attribute
    {
        return Attribute::get(fn () => implode(' · ', array_filter([
            $this->category?->name,
            $this->key ? 'тональность '.$this->key : null,
        ])));
    }

    /**
     * Текст с аккордами в формате ChordPro. При записи вставленные «аккорды над
     * строкой» приводятся к ChordPro, а в lyrics сохраняются одни слова — по ним
     * идёт поиск: в исходном тексте аккорды разрывают слова.
     */
    protected function chordpro(): Attribute
    {
        return Attribute::set(function (?string $value) {
            $chordpro = ChordPro::normalize($value);

            return ['chordpro' => $chordpro, 'lyrics' => ChordPro::plainText($chordpro) ?: null];
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
