<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Http\Resources\SermonResource;
use App\Models\Event;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

class EventController extends Controller
{
    /**
     * Расписание: по умолчанию события начиная с сегодняшнего дня.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'limit' => ['nullable', 'integer', 'between:1,200'],
        ]);

        $from = isset($filters['from']) ? Carbon::parse($filters['from'])->startOfDay() : today();

        $events = Event::query()
            ->published()
            ->where('starts_at', '>=', $from)
            ->when($filters['to'] ?? null, fn ($query, string $to) => $query->where('starts_at', '<=', Carbon::parse($to)->endOfDay()))
            ->orderBy('starts_at')
            ->orderBy('id')
            ->limit($filters['limit'] ?? 50)
            ->get();

        $this->fillMissingAddress(...$events);

        return EventResource::collection($events);
    }

    public function show(int $event): EventResource
    {
        $event = Event::query()
            ->published()
            ->with([
                'sermon.minister',
                'songs' => fn ($query) => $query->withoutLyrics()->with('category')->orderBy('number'),
            ])
            ->findOrFail($event);

        $this->fillMissingAddress($event);

        return new EventResource($event);
    }

    public function sermon(int $event): SermonResource
    {
        $event = Event::query()->published()->with('sermon.minister')->findOrFail($event);

        abort_if($event->sermon === null, 404);

        return new SermonResource($event->sermon);
    }

    /**
     * У события без собственного адреса показываем адрес церкви.
     */
    private function fillMissingAddress(Event ...$events): void
    {
        $withoutAddress = array_filter($events, fn (Event $event) => blank($event->address));

        if ($withoutAddress === []) {
            return;
        }

        $churchAddress = Setting::query()->where('key', 'church_address')->value('value');

        foreach ($withoutAddress as $event) {
            $event->address = $churchAddress;
        }
    }
}
