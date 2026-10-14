<?php

namespace App\Console\Commands;

use App\Models\CalendarSource;
use App\Services\Calendar\CalendarSync;
use App\Services\Calendar\CalendarSyncFailed;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('calendars:sync {source? : ID календаря; без него — все включённые}')]
#[Description('Загрузить события из внешних календарей (Google, Outlook, iCloud, Яндекс)')]
class SyncCalendars extends Command
{
    public function handle(CalendarSync $sync): int
    {
        $sources = CalendarSource::query()
            ->when($this->argument('source'), fn ($query, $id) => $query->whereKey($id), fn ($query) => $query->active())
            ->orderBy('id')
            ->get();

        $failed = false;

        foreach ($sources as $source) {
            try {
                $this->info("«{$source->name}»: ".$sync->sync($source)->summary());
            } catch (CalendarSyncFailed $e) {
                $failed = true;
                $this->error("«{$source->name}»: {$e->getMessage()}");
            }
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
