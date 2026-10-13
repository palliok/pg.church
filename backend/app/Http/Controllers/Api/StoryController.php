<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StoryResource;
use App\Models\Story;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StoryController extends Controller
{
    /**
     * Список историй-комиксов без кадров.
     */
    public function index(): AnonymousResourceCollection
    {
        return StoryResource::collection(
            Story::query()->published()->orderBy('sort')->orderBy('id')->get()
        );
    }

    public function show(string $slug): StoryResource
    {
        return new StoryResource(
            Story::query()->published()->with('panels')->where('slug', $slug)->firstOrFail()
        );
    }
}
