<?php

namespace App\Http\Controllers\Api;

use App\Enums\PostType;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class PostController extends Controller
{
    /**
     * Новости и блог без полного текста, от новых к старым.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'type' => ['nullable', Rule::enum(PostType::class)],
            'per_page' => ['nullable', 'integer', 'between:1,50'],
        ]);

        $posts = Post::query()
            ->published()
            ->select(['id', 'type', 'title', 'excerpt', 'image', 'published_at'])
            ->with('tags')
            ->when($filters['type'] ?? null, fn ($query, string $type) => $query->where('type', $type))
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 12)
            ->withQueryString();

        return PostResource::collection($posts);
    }

    public function show(int $post): PostResource
    {
        return new PostResource(Post::query()->published()->with('tags')->findOrFail($post));
    }
}
