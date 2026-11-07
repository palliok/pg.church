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

    /** Наименьшая длина слова, в котором ищутся опечатки, и порог похожести (0–1) для word_similarity. */
    public const int FUZZY_MIN_LENGTH = 4;

    private const float FUZZY_SIMILARITY = 0.3;

    /**
     * Название для поиска (search_title) обновляется вместе с названием.
     */
    protected static function booted(): void
    {
        static::saving(function (Song $song) {
            $song->search_title = Text::searchable($song->title);
        });
    }

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
     * Поиск: каждое слово запроса есть в названии или в тексте одного и того же варианта
     * (знаки препинания и разница «ё» и «е» не мешают), начало номера или номер с буквой
     * варианта («214б»). Сначала точный номер, потом песни, чьё название начинается
     * с запроса или содержит все слова, потом те, где слова стоят в тексте подряд,
     * и остальные найденные по тексту; внутри — по номеру.
     *
     * @param  Builder<Song>  $query
     */
    public function scopeSearch(Builder $query, string $term): void
    {
        $words = Text::searchWords($term);
        $phrase = implode(' ', $words);
        $digits = ctype_digit($term);
        $numbered = self::parseNumberWithLetter($term);

        $query->where(function (Builder $query) use ($words, $digits, $numbered, $term) {
            $query->whereRaw('false');

            if ($words !== []) {
                $query->orWhere(fn (Builder $query) => self::wordsIn($query, $words, 'songs.search_title'))
                    ->orWhereHas('variants', fn (Builder $query) => self::wordsIn($query, $words, "songs.search_title || ' ' || coalesce(song_variants.search_text, '')"));
            }

            if ($digits) {
                $query->orWhereRaw('CAST(number AS TEXT) LIKE ?', [$term.'%']);
            }

            if ($numbered) {
                [$number, $letter] = $numbered;
                $query->orWhere(fn (Builder $query) => $query->where('number', $number)
                    ->whereHas('variants', fn (Builder $query) => $query->where('letter', $letter)));
            }
        });

        if ($words !== []) {
            $titleHasAll = implode(' and ', array_fill(0, count($words), "' ' || songs.search_title like '% ' || ? || '%'"));

            $query->orderByRaw(
                'case when CAST(number AS TEXT) = ? then 0 when search_title = ? then 1 when search_title like ? then 2 '
                ."when $titleHasAll then 3 when exists (select 1 ".self::VARIANTS." and ' ' || v.search_text like ?) then 4 else 5 end",
                [$term, $phrase, $phrase.'%', ...$words, '% '.$phrase.'%'],
            );
        }

        $query->orderBy('number');
    }

    /**
     * Кандидаты для поиска с опечатками, когда обычный ничего не нашёл: в названии или тексте
     * варианта есть слова, похожие на каждое слово запроса от четырёх букв (pg_trgm, word_similarity),
     * короткие слова должны совпасть точно. Отбор грубый: точно проверяет App\Support\SongMatch::fits().
     *
     * @param  Builder<Song>  $query
     */
    public function scopeSearchFuzzy(Builder $query, string $term): void
    {
        $words = Text::searchWords($term);
        $long = array_values(array_filter($words, fn (string $word) => mb_strlen($word) >= self::FUZZY_MIN_LENGTH));

        if ($long === []) {
            $query->whereRaw('false');

            return;
        }

        $text = "songs.search_title || ' ' || coalesce(song_variants.search_text, '')";

        $query->where(fn (Builder $query) => $query
            ->where(fn (Builder $query) => self::wordsIn($query, $words, 'songs.search_title', fuzzy: true))
            ->orWhereHas('variants', fn (Builder $query) => self::wordsIn($query, $words, $text, fuzzy: true)));

        $query->orderBy('number');
    }

    /**
     * Каждое слово есть в тексте (SQL-выражение) — с начала какого-нибудь слова: «спас» находит
     * «спасенья», а «верен» не находит «Суверенный». С fuzzy длинные слова — похожие.
     *
     * @param  Builder<covariant Model>  $query
     * @param  list<string>  $words
     */
    private static function wordsIn(Builder $query, array $words, string $text, bool $fuzzy = false): void
    {
        foreach ($words as $word) {
            if ($fuzzy && mb_strlen($word) >= self::FUZZY_MIN_LENGTH) {
                $query->whereRaw("word_similarity(?, $text) >= ".self::FUZZY_SIMILARITY, [$word]);
            } else {
                $query->whereRaw("' ' || $text like '% ' || ? || '%'", [$word]);
            }
        }
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
     * Первая строка основного варианта (`line`) — для списка без поиска.
     * При поиске строку с совпадением подбирает App\Support\SongMatch.
     *
     * @param  Builder<Song>  $query
     */
    public function scopeWithLine(Builder $query): void
    {
        $query->selectRaw("(select split_part(v.lyrics, E'\\n', 1) ".self::VARIANTS.' order by v.is_default desc, v.letter limit 1) as line');
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
