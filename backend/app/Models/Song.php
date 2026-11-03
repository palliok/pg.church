<?php

namespace App\Models;

use App\Support\Text;
use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['number', 'title', 'song_category_id'])]
class Song extends Model
{
    use CrudTrait;

    /** Варианты этой песни — для подзапросов в selectRaw. */
    private const string VARIANTS = 'from song_variants v where v.song_id = songs.id';

    /**
     * @return BelongsTo<SongCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(SongCategory::class, 'song_category_id');
    }

    /**
     * Варианты текста; порядок «основной первым» — скоуп SongVariant::defaultFirst().
     *
     * @return HasMany<SongVariant, $this>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(SongVariant::class);
    }

    /**
     * Номер с буквой варианта: «214б», «214 б», «214Б» → [214, 'б']; иначе null.
     *
     * @return array{int, string}|null
     */
    public static function parseNumberWithLetter(string $term): ?array
    {
        if (! preg_match('/^(\d{1,9})\s*(\p{Cyrillic})$/u', $term, $match)) {
            return null;
        }

        return [(int) $match[1], mb_strtolower($match[2])];
    }

    /**
     * Поиск по названию, строке текста любого варианта, началу номера
     * или номеру с буквой варианта («214б»).
     *
     * @param  Builder<Song>  $query
     */
    public function scopeSearch(Builder $query, string $term): void
    {
        $like = '%'.Text::escapeLike($term).'%';

        $query->where(function (Builder $query) use ($term, $like) {
            $query->where('title', 'ilike', $like)
                ->orWhereHas('variants', fn (Builder $query) => $query->where('lyrics', 'ilike', $like));

            if (ctype_digit($term)) {
                $query->orWhereRaw('CAST(number AS TEXT) LIKE ?', [$term.'%']);
            }

            if ($numbered = self::parseNumberWithLetter($term)) {
                [$number, $letter] = $numbered;
                $query->orWhere(fn (Builder $query) => $query->where('number', $number)
                    ->whereHas('variants', fn (Builder $query) => $query->where('letter', $letter)));
            }
        });
    }

    /**
     * Для списков: песня без текстов, но с тональностью основного варианта (`key`).
     *
     * @param  Builder<Song>  $query
     */
    public function scopeWithoutLyrics(Builder $query): void
    {
        $query->select($query->qualifyColumns(['id', 'number', 'title', 'song_category_id']))->withKey();
    }

    /**
     * Тональность основного варианта (`key`).
     *
     * @param  Builder<Song>  $query
     */
    public function scopeWithKey(Builder $query): void
    {
        $query->addSelect(['key' => SongVariant::query()->select('key')->whereColumn('song_id', 'songs.id')->defaultFirst()->limit(1)]);
    }

    /**
     * Строка текста для списка (`line`): первая, где встречается term, иначе первая строка
     * основного варианта. По ней в сборнике видно, почему песня нашлась. `variant` — буква
     * варианта, где нашлась строка, если он не основной, или буква из запроса «214б»:
     * песня откроется сразу на этом варианте.
     *
     * @param  Builder<Song>  $query
     */
    public function scopeWithLine(Builder $query, string $term = ''): void
    {
        $first = "(select split_part(v.lyrics, E'\\n', 1) ".self::VARIANTS.' order by v.is_default desc, v.letter limit 1)';

        if ($term === '') {
            $query->selectRaw("$first as line");

            return;
        }

        // «214б» — первая строка и буква именно этого варианта.
        if ($numbered = self::parseNumberWithLetter($term)) {
            $query->selectRaw(
                "(select split_part(v.lyrics, E'\\n', 1) ".self::VARIANTS.' and v.letter = ?) as line, '
                .'(select v.letter '.self::VARIANTS.' and v.letter = ?) as variant',
                [$numbered[1], $numbered[1]],
            );

            return;
        }

        $match = "from song_variants v, regexp_split_to_table(v.lyrics, E'\\n') with ordinality as t(l, n) "
            .'where v.song_id = songs.id and l ilike ? order by v.is_default desc, v.letter, n limit 1';
        $like = '%'.Text::escapeLike($term).'%';

        $query->selectRaw(
            "coalesce((select l $match), $first) as line, (select case when v.is_default then null else v.letter end $match) as variant",
            [$like, $like],
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
}
