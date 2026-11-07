<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SongResource;
use App\Models\Song;
use App\Models\SongCategory;
use App\Models\SongVariant;
use App\Support\SongMatch;
use App\Support\Text;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Collection;

class SongController extends Controller
{
    /**
     * Сборник песен без текстов. `q` — поиск (Song::search): по словам названия и текста,
     * началу номера или номеру с буквой варианта; самые подходящие — первыми. Если ничего
     * не нашлось, ищутся слова с опечатками. У найденной песни `line` — строка с совпадением,
     * `variant` — буква варианта, где она нашлась (или из запроса «214б»), если он не основной.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'integer', 'between:1,2147483647'],
        ]);

        $term = trim($filters['q'] ?? '');
        $query = Song::query()
            ->withoutLyrics()
            ->with('category')
            ->when($filters['category'] ?? null, fn ($query, $category) => $query->where('song_category_id', $category));

        if ($term === '') {
            return SongResource::collection($query->withLine()->orderBy('number')->get());
        }

        $words = Text::searchWords($term);
        $songs = (clone $query)->search($term)->get();
        $variants = $this->variants($songs);
        $fuzzy = $songs->isEmpty();

        if ($fuzzy) {
            // Кандидаты от pg_trgm проверяются точно; совпавшие в названии — первыми.
            $candidates = $query->searchFuzzy($term)->get();
            $variants = $this->variants($candidates);
            $songs = $candidates
                ->filter(fn (Song $song) => SongMatch::fits($song->title, $variants->get($song->id, []), $words))
                ->sortBy([fn (Song $a, Song $b) => SongMatch::titleScore($b->title, $words) <=> SongMatch::titleScore($a->title, $words), ['number', 'asc']])
                ->values();
        }

        $this->attachLines($songs, $variants, $term, $fuzzy);

        return SongResource::collection($songs);
    }

    public function show(int $song): SongResource
    {
        return new SongResource(Song::query()->withKey()->with(['category', 'variants' => fn ($query) => $query->defaultFirst()])->findOrFail($song));
    }

    public function categories(): JsonResponse
    {
        $categories = SongCategory::query()->orderBy('sort')->orderBy('name')->get(['id', 'name']);

        return response()->json(['data' => $categories]);
    }

    /**
     * Строка с совпадением и буква варианта для каждой найденной песни.
     *
     * @param  EloquentCollection<int, Song>  $songs
     * @param  Collection<int, Collection<int, SongVariant>>  $variants  варианты по id песни
     */
    private function attachLines(EloquentCollection $songs, Collection $variants, string $term, bool $fuzzy): void
    {
        $words = Text::searchWords($term);
        $numbered = Song::parseNumberWithLetter($term);

        foreach ($songs as $song) {
            $songVariants = collect($variants->get($song->id, []));

            // «214б» — первая строка именно этого варианта.
            $match = $numbered && $song->number === $numbered[0]
                ? ['line' => SongMatch::line($songVariants->where('letter', $numbered[1]), [])['line'], 'variant' => $numbered[1]]
                : SongMatch::line($songVariants, $words, $fuzzy);

            $song->setAttribute('line', $match['line']);
            $song->setAttribute('variant', $match['variant']);
        }
    }

    /**
     * Тексты вариантов найденных песен, основной первым, — по id песни.
     *
     * @param  EloquentCollection<int, Song>  $songs
     * @return Collection<int, Collection<int, SongVariant>>
     */
    private function variants(EloquentCollection $songs): Collection
    {
        return SongVariant::query()
            ->whereIn('song_id', $songs->modelKeys())
            ->defaultFirst()
            ->get(['song_id', 'letter', 'is_default', 'lyrics'])
            ->groupBy('song_id');
    }
}
