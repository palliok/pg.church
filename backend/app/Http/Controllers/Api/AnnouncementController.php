<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AnnouncementController extends Controller
{
    /**
     * Действующие объявления, новые сверху.
     */
    public function __invoke(): AnonymousResourceCollection
    {
        $announcements = Announcement::query()->visible()->with('event')
            ->orderByDesc('published_at')->orderByDesc('id')->get();

        return AnnouncementResource::collection($announcements);
    }
}
