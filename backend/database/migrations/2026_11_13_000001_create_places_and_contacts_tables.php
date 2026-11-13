<?php

use App\Support\Phone;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Справочники мест и контактов: подсказки при заполнении событий и объявлений. Значения копируются в поля
     * записи, поэтому правка справочника не меняет уже заполненное. Сразу заполняются тем, что уже введено руками.
     */
    public function up(): void
    {
        Schema::create('places', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('address')->nullable();
            $table->timestamps();
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60);
            $table->string('phone', 30);
            $table->timestamps();
        });

        $this->fillFromExisting();
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
        Schema::dropIfExists('places');
    }

    /**
     * Места — из событий (кроме загруженных из календарей: там адреса как попало) и объявлений, с последним
     * указанным адресом. Контакты — из объявлений, где есть и имя, и телефон.
     */
    private function fillFromExisting(): void
    {
        $now = now();
        $places = [];

        $events = DB::table('events')->whereNull('calendar_source_id')->whereNotNull('place')
            ->orderBy('starts_at')->get(['place', 'address']);
        $announcements = DB::table('announcements')->whereNotNull('place')->orderBy('published_at')->get(['place']);

        foreach ([...$events, ...$announcements] as $row) {
            $name = mb_substr(trim($row->place), 0, 120);
            $key = mb_strtolower($name);

            if ($name === '') {
                continue;
            }

            $address = trim($row->address ?? '');
            $places[$key] = ['name' => $places[$key]['name'] ?? $name, 'address' => $address ?: ($places[$key]['address'] ?? null)];
        }

        DB::table('places')->insert(array_map(fn (array $place) => [...$place, 'created_at' => $now, 'updated_at' => $now], array_values($places)));

        $contacts = DB::table('announcements')->whereNotNull('contact_name')->whereNotNull('contact_phone')
            ->get(['contact_name', 'contact_phone'])
            ->map(fn (object $row) => ['name' => trim($row->contact_name), 'phone' => Phone::format($row->contact_phone)])
            ->filter(fn (array $contact) => $contact['name'] !== '' && $contact['phone'] !== null)
            ->unique(fn (array $contact) => mb_strtolower($contact['name']).'|'.$contact['phone'])
            ->map(fn (array $contact) => [...$contact, 'created_at' => $now, 'updated_at' => $now]);

        DB::table('contacts')->insert($contacts->values()->all());
    }
};
