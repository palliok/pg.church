<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;

class AnnouncementController extends Controller
{
    /**
     * Действующие объявления для главной страницы.
     */
    public function __invoke(): JsonResponse
    {
        $announcements = Announcement::query()->visible()->orderBy('sort')->orderByDesc('id')->get()
            ->map(fn (Announcement $announcement) => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'body' => $announcement->body,
            ]);

        return response()->json(['data' => $announcements]);
    }
}
