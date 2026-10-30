<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SongResource;
use App\Models\Song;
use App\Models\SongCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SongController extends Controller
{
    /**
     * Сборник песен без текстов; `q` ищет по названию, строке текста и номеру.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'integer', 'between:1,2147483647'],
        ]);

        $term = trim($filters['q'] ?? '');

        $songs = Song::query()
            ->withoutLyrics()
            ->withLine($term)
            ->with('category')
            ->when($term !== '', fn ($query) => $query->search($term))
            ->when($filters['category'] ?? null, fn ($query, $category) => $query->where('song_category_id', $category))
            ->orderBy('number')
            ->get();

        return SongResource::collection($songs);
    }

    public function show(int $song): SongResource
    {
        return new SongResource(Song::query()->with('category')->findOrFail($song));
    }

    public function categories(): JsonResponse
    {
        $categories = SongCategory::query()->orderBy('sort')->orderBy('name')->get(['id', 'name']);

        return response()->json(['data' => $categories]);
    }
}
