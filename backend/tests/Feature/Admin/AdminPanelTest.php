<?php

namespace Tests\Feature\Admin;

use App\Enums\PostType;
use App\Models\CalendarSource;
use App\Models\DonationAccount;
use App\Models\DonationTarget;
use App\Models\DutyShift;
use App\Models\Event;
use App\Models\Minister;
use App\Models\Post;
use App\Models\Sermon;
use App\Models\Setting;
use App\Models\Song;
use App\Models\SongCategory;
use App\Models\Story;
use App\Models\StoryPanel;
use App\Models\Tag;
use App\Models\User;
use Database\Seeders\DemoContentSeeder;
use Database\Seeders\DonationAccountSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['email' => 'admin@example.com']);
    }

    /**
     * @return array<string, array{string, class-string, bool}>
     */
    public static function crudPanels(): array
    {
        return [
            'event' => ['event', Event::class, true],
            'calendar-source' => ['calendar-source', CalendarSource::class, true],
            'sermon' => ['sermon', Sermon::class, true],
            'minister' => ['minister', Minister::class, true],
            'duty-shift' => ['duty-shift', DutyShift::class, true],
            'song' => ['song', Song::class, true],
            'song-category' => ['song-category', SongCategory::class, true],
            'post' => ['post', Post::class, true],
            'tag' => ['tag', Tag::class, true],
            'story' => ['story', Story::class, true],
            'story-panel' => ['story-panel', StoryPanel::class, true],
            'donation-target' => ['donation-target', DonationTarget::class, true],
            'donation-account' => ['donation-account', DonationAccount::class, true],
            'setting' => ['setting', Setting::class, false],
            'user' => ['user', User::class, true],
        ];
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/admin/event')->assertRedirect('/admin/login');
        $this->get('/')->assertRedirect('/admin');
        $this->get('/admin/login')->assertOk();
    }

    public function test_registration_is_closed(): void
    {
        $this->get('/admin/register')->assertForbidden();

        $this->post('/admin/register', [
            'name' => 'Посторонний', 'email' => 'intruder@example.com',
            'password' => 'password123', 'password_confirmation' => 'password123',
        ])->assertForbidden();

        $this->assertDatabaseMissing('users', ['email' => 'intruder@example.com']);
    }

    public function test_admin_can_log_in_with_email_and_password(): void
    {
        $this->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'wrong'])
            ->assertSessionHasErrors('email');

        $this->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'password'])
            ->assertRedirect('/admin/dashboard');

        $this->assertAuthenticatedAs($this->admin, backpack_guard_name());
    }

    #[DataProvider('crudPanels')]
    public function test_crud_pages_render(string $route, string $model, bool $canCreate): void
    {
        $this->seed([SettingSeeder::class, DonationAccountSeeder::class, DemoContentSeeder::class]);
        CalendarSource::query()->create(['name' => 'Календарь служений', 'url' => 'https://calendar.google.com/calendar/ical/secret/basic.ics']);
        $this->actingAsAdmin();

        $this->get("/admin/{$route}")->assertOk();

        // Таблица списка подгружается отдельным запросом; заодно проверяем поиск на PostgreSQL.
        foreach (['', 'свят', '214', '2026-10-18'] as $term) {
            $this->postJson("/admin/{$route}/search", [
                'draw' => 1, 'start' => 0, 'length' => 25, 'search' => ['value' => $term],
            ])->assertOk()->assertJsonStructure(['data', 'recordsTotal', 'recordsFiltered']);
        }

        $this->get("/admin/{$route}/{$model::query()->firstOrFail()->getKey()}/edit")->assertOk();
        $this->get("/admin/{$route}/create")->assertStatus($canCreate ? 200 : 405);
    }

    public function test_dashboard_renders_with_menu(): void
    {
        $this->actingAsAdmin();

        $this->get('/admin/dashboard')
            ->assertOk()
            ->assertSee('Сборник песен')
            ->assertSee('Настройки сайта');
    }

    public function test_admin_creates_event_with_hymns(): void
    {
        $this->actingAsAdmin();
        $song = Song::query()->create(['number' => 214, 'title' => 'Радость моя']);

        $this->post('/admin/event', [
            'title' => 'Богослужение',
            'starts_at' => '2026-10-18T11:00',
            'place' => 'Главный зал',
            'songs' => [$song->id],
            'is_main' => '1',
            'has_stream' => '0',
            'is_published' => '1',
        ])->assertSessionHasNoErrors()->assertRedirect();

        $event = Event::query()->sole();

        $this->assertSame('2026-10-18 11:00', $event->starts_at->format('Y-m-d H:i'));
        $this->assertTrue($event->is_main);
        $this->assertFalse($event->has_stream);
        $this->assertTrue($event->is_published);
        $this->assertSame([$song->id], $event->songs->modelKeys());

        // Сообщения об ошибках — на русском и с подписью поля вместо его имени.
        $this->post('/admin/event', ['title' => '', 'starts_at' => 'когда-нибудь'])
            ->assertSessionHasErrors([
                'title' => 'Поле «Название» обязательно для заполнения.',
                'starts_at' => 'Поле «Дата и время начала» должно быть датой.',
            ]);
    }

    public function test_song_number_must_be_unique_but_can_stay_on_update(): void
    {
        $this->actingAsAdmin();
        $song = Song::query()->create(['number' => 60, 'title' => 'Свят, свят, свят']);

        $this->post('/admin/song', ['number' => 60, 'title' => 'Дубль'])->assertSessionHasErrors('number');
        $this->assertSame(1, Song::query()->count());

        $this->put("/admin/song/{$song->id}", ['id' => $song->id, 'number' => 60, 'title' => 'Свят, свят, свят!', 'key' => 'E'])
            ->assertSessionHasNoErrors()->assertRedirect();

        $this->assertSame('Свят, свят, свят!', $song->fresh()->title);
        $this->assertSame('E', $song->fresh()->key);
    }

    public function test_song_pasted_with_chords_above_lyrics_is_stored_as_chordpro(): void
    {
        $this->actingAsAdmin();

        $this->post('/admin/song', [
            'number' => 12,
            'title' => 'Свят',
            'key' => 'Am',
            'chordpro' => "Куплет 1\r\nAm      E\r\nСвят, свят\r\n\r\nПрипев\r\n[Dm]Тебе по[E]ём",
        ])->assertSessionHasNoErrors()->assertRedirect();

        $song = Song::query()->sole();

        $this->assertSame("Куплет 1\n[Am]Свят, св[E]ят\n\nПрипев\n[Dm]Тебе по[E]ём", $song->chordpro);
        $this->assertSame("Свят, свят\n\nТебе поём", $song->lyrics);

        // Форма редактирования показывает сохранённый ChordPro.
        $this->get("/admin/song/{$song->id}/edit")->assertOk()->assertSee('[Am]Свят, св[E]ят', false);
    }

    public function test_event_can_have_only_one_sermon(): void
    {
        $this->actingAsAdmin();
        $event = Event::query()->create(['title' => 'Богослужение', 'starts_at' => '2026-10-18 11:00']);

        $this->post('/admin/sermon', ['event_id' => $event->id, 'topic' => 'Надежда'])
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->post('/admin/sermon', ['event_id' => $event->id, 'topic' => 'Вторая'])
            ->assertSessionHasErrors('event_id');

        $sermon = Sermon::query()->sole();

        $this->put("/admin/sermon/{$sermon->id}", ['id' => $sermon->id, 'event_id' => $event->id, 'topic' => 'Надежда, которая не разочаровывает'])
            ->assertSessionHasNoErrors();

        $this->assertSame('Надежда, которая не разочаровывает', $sermon->fresh()->topic);
    }

    public function test_post_cover_is_uploaded_to_public_disk(): void
    {
        Storage::fake('public');
        $this->actingAsAdmin();
        $tag = Tag::query()->create(['name' => 'Вера']);

        $this->post('/admin/post', [
            'type' => 'news',
            'title' => 'Выезд молодёжи',
            'body' => '<p>Текст</p>',
            'image' => UploadedFile::fake()->create('cover.jpg', 120, 'image/jpeg'),
            'tags' => [$tag->id],
            'published_at' => '2026-10-14T12:00',
        ])->assertSessionHasNoErrors()->assertRedirect();

        $post = Post::query()->sole();

        $this->assertSame(PostType::News, $post->type);
        // Сырое значение из базы: внутри запроса админки Backpack отдаёт имя файла без каталога.
        $image = DB::table('posts')->value('image');
        $this->assertStringStartsWith('posts/', $image);
        Storage::disk('public')->assertExists($image);
        $this->assertSame([$tag->id], $post->tags->modelKeys());

        $this->post('/admin/post', ['type' => 'video', 'title' => 'Что-то', 'image' => UploadedFile::fake()->create('virus.exe', 10)])
            ->assertSessionHasErrors(['type', 'image']);
    }

    public function test_donation_account_requisites_are_validated(): void
    {
        $this->actingAsAdmin();

        $valid = [
            'title' => 'На строительство',
            'recipient' => 'МРО Церковь',
            'inn' => '7802038805',
            'kpp' => '780201001',
            'bank_name' => 'ПАО СБЕРБАНК',
            'account' => '40703810555000000365',
            'correspondent_account' => '30101810500000000653',
            'bic' => '044030653',
            'payment_purpose' => 'Пожертвование',
            'sort' => 0,
            'is_published' => '1',
        ];

        $this->post('/admin/donation-account', [
            ...$valid, 'recipient' => '', 'inn' => '78020388', 'kpp' => '78020100A',
            'account' => '4070381055500000036', 'correspondent_account' => '', 'bic' => '04403065 3',
        ])->assertSessionHasErrors([
            'recipient',
            'inn' => 'Поле «ИНН» заполнено в неверном формате.',
            'kpp',
            'account' => 'Поле «Расчётный счёт» должно состоять из 20 цифр.',
            'correspondent_account',
            'bic',
        ]);
        $this->assertSame(0, DonationAccount::query()->count());

        // ИНН предпринимателя — 12 цифр, КПП у него нет.
        $this->post('/admin/donation-account', [...$valid, 'inn' => '780203880512', 'kpp' => ''])
            ->assertSessionHasNoErrors()->assertRedirect();

        $account = DonationAccount::query()->sole();

        $this->assertSame('780203880512', $account->inn);
        $this->assertNull($account->kpp);
        $this->assertSame('40703810555000000365', $account->account);
        $this->assertTrue($account->is_published);
    }

    public function test_admin_adds_calendar_and_it_is_synced_right_away(): void
    {
        $this->actingAsAdmin();
        $ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Test//EN\r\nBEGIN:VEVENT\r\nUID:a@example.com\r\n"
            ."SUMMARY:Молитвенная встреча\r\nDTSTART:20991021T160000Z\r\nDTEND:20991021T170000Z\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";
        // Http::fake() оставляет первую подошедшую заглушку, поэтому ответ меняется через переменную.
        $response = Http::response($ics, 200);
        Http::fake(function () use (&$response) {
            return $response;
        });
        $this->travelTo(now()->setDate(2099, 10, 14));

        $this->post('/admin/calendar-source', ['name' => 'Служения', 'url' => 'ftp://example.com/calendar.ics'])
            ->assertSessionHasErrors(['url' => 'Поле «Ссылка на календарь (iCal)» должно начинаться с одного из следующих значений: https://, http://, webcal://, webcals://.']);

        $this->post('/admin/calendar-source', [
            'name' => 'Служения', 'url' => 'webcal://p01-calendars.icloud.com/published/2/secret', 'is_active' => '1', 'publish_events' => '1',
        ])->assertSessionHasNoErrors()->assertRedirect();

        $source = CalendarSource::query()->sole();
        $this->assertSame('webcal://p01-calendars.icloud.com/published/2/secret', $source->url);
        // Ссылка секретная: в базе она зашифрована.
        $this->assertStringNotContainsString('icloud', DB::table('calendar_sources')->value('url'));
        $this->assertNotNull($source->last_synced_at);
        $this->assertSame('Молитвенная встреча', Event::query()->sole()->title);
        $this->assertStringContainsString('синхронизирован: добавлено 1', implode(' ', session('alert_messages.success') ?? []));

        // Строки таблицы приходят отдельным запросом — в них и кнопка «Синхронизировать».
        $rows = $this->postJson('/admin/calendar-source/search', ['draw' => 1, 'start' => 0, 'length' => 10])->assertOk()->json('data');
        $this->assertStringContainsString("/admin/calendar-source/{$source->id}/sync", implode(' ', $rows[0]));
        $this->assertStringContainsString('p01-calendars.icloud.com', implode(' ', $rows[0]));
        $this->assertStringNotContainsString('secret', implode(' ', $rows[0]));

        // Кнопка «Синхронизировать»: ошибка показывается администратору и сохраняется.
        $response = Http::response('nope', 500);
        $this->from('/admin/calendar-source')->post("/admin/calendar-source/{$source->id}/sync")
            ->assertRedirect('/admin/calendar-source');
        $this->assertStringContainsString('ошибкой 500', implode(' ', session('alert_messages.error') ?? []));
        $this->assertStringContainsString('ошибкой 500', $source->refresh()->last_error);

        // Кнопка из устаревшего списка: календарь уже удалён.
        $this->from('/admin/calendar-source')->post('/admin/calendar-source/999999/sync')
            ->assertRedirect('/admin/calendar-source');
        $this->assertStringContainsString('Календарь не найден', implode(' ', session('alert_messages.error') ?? []));

        // На форме события из календаря — предупреждение, что часть полей обновляется оттуда.
        $this->get('/admin/event/'.Event::query()->sole()->id.'/edit')
            ->assertOk()
            ->assertSee('Событие загружено из календаря «Служения»');
    }

    public function test_settings_can_only_be_edited(): void
    {
        $this->seed(SettingSeeder::class);
        $this->actingAsAdmin();

        $phone = Setting::query()->where('key', 'church_phone')->firstOrFail();
        $live = Setting::query()->where('key', 'stream_live')->firstOrFail();
        $url = Setting::query()->where('key', 'stream_url')->firstOrFail();

        $this->put("/admin/setting/{$phone->id}", ['id' => $phone->id, 'value' => '+7 812 000-00-00', 'key' => 'hacked', 'label' => 'hacked'])
            ->assertSessionHasNoErrors()->assertRedirect();
        $this->put("/admin/setting/{$live->id}", ['id' => $live->id, 'value' => '1'])->assertSessionHasNoErrors();
        $this->put("/admin/setting/{$url->id}", ['id' => $url->id, 'value' => 'не ссылка'])->assertSessionHasErrors('value');

        $this->assertSame('+7 812 000-00-00', $phone->fresh()->value);
        $this->assertSame('church_phone', $phone->fresh()->key);
        $this->assertSame('Телефон', $phone->fresh()->label);
        $this->assertTrue(Setting::values()->get('stream_live'));
        $this->assertNull($url->fresh()->value);

        $count = Setting::query()->count();

        $this->post('/admin/setting', ['key' => 'new', 'group' => 'x', 'label' => 'x'])->assertStatus(405);
        $this->delete("/admin/setting/{$phone->id}")->assertStatus(405);
        $this->assertSame($count, Setting::query()->count());
    }

    public function test_admin_manages_other_admins(): void
    {
        $this->actingAsAdmin();

        $this->post('/admin/user', ['name' => 'Пастор', 'email' => 'pastor@example.com', 'password' => 'short', 'password_confirmation' => 'short'])
            ->assertSessionHasErrors('password');
        $this->post('/admin/user', ['name' => 'Пастор', 'email' => 'pastor@example.com', 'password' => 'long-enough-1', 'password_confirmation' => 'other'])
            ->assertSessionHasErrors('password');
        $this->post('/admin/user', ['name' => 'Пастор', 'email' => 'pastor@example.com', 'password' => 'long-enough-1', 'password_confirmation' => 'long-enough-1'])
            ->assertSessionHasNoErrors()->assertRedirect();

        $pastor = User::query()->where('email', 'pastor@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('long-enough-1', $pastor->password));

        // Пустой пароль при редактировании не меняет его.
        $this->put("/admin/user/{$pastor->id}", ['id' => $pastor->id, 'name' => 'Старший пастор', 'email' => 'pastor@example.com', 'password' => '', 'password_confirmation' => ''])
            ->assertSessionHasNoErrors()->assertRedirect();

        $pastor->refresh();
        $this->assertSame('Старший пастор', $pastor->name);
        $this->assertTrue(Hash::check('long-enough-1', $pastor->password));

        $this->put("/admin/user/{$pastor->id}", ['id' => $pastor->id, 'name' => 'Старший пастор', 'email' => 'admin@example.com'])
            ->assertSessionHasErrors('email');
    }

    public function test_admin_cannot_delete_own_account(): void
    {
        $this->actingAsAdmin();
        $other = User::factory()->create();

        $this->delete("/admin/user/{$this->admin->id}")->assertForbidden();
        $this->assertModelExists($this->admin);

        $this->delete("/admin/user/{$other->id}")->assertOk();
        $this->assertModelMissing($other);
    }

    private function actingAsAdmin(): void
    {
        $this->actingAs($this->admin, backpack_guard_name());
    }
}
