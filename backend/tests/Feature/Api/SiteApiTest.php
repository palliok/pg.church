<?php

namespace Tests\Feature\Api;

use App\Models\Minister;
use App\Models\Setting;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(SettingSeeder::class);
    }

    public function test_church_returns_contacts_and_duty(): void
    {
        Minister::query()->create(['name' => 'Антон Третьяк'])->dutyShifts()->create(['weekday' => 3]);
        Minister::query()->create(['name' => 'Алексей Синичкин'])->dutyShifts()->create(['weekday' => 2]);

        $this->set('church_phone', '+7 (911) 123-43-43');
        $this->set('social_youtube', 'https://youtube.com/@pgora');

        $this->getJson('/api/v1/church')
            ->assertOk()
            ->assertJsonPath('data.name', 'Поклонная гора')
            ->assertJsonPath('data.address', 'Большая Озёрная, 27')
            ->assertJsonPath('data.phone', '+7 (911) 123-43-43')
            ->assertJsonPath('data.phoneHref', 'tel:+79111234343')
            // Соцсети без ссылки не отдаются.
            ->assertJsonPath('data.social', [['code' => 'YT', 'label' => 'YouTube', 'href' => 'https://youtube.com/@pgora']])
            ->assertJsonPath('data.duty.hours', '10:00–18:00')
            ->assertJsonPath('data.duty.shifts', [
                ['weekday' => 2, 'dow' => 'Вт', 'name' => 'Алексей Синичкин'],
                ['weekday' => 3, 'dow' => 'Ср', 'name' => 'Антон Третьяк'],
            ])
            // Трансляция — отдельный адрес /api/v1/live (см. LiveStreamTest).
            ->assertJsonMissingPath('data.live');
    }

    public function test_church_without_socials_and_duty(): void
    {
        $this->getJson('/api/v1/church')
            ->assertOk()
            ->assertJsonPath('data.social', [])
            ->assertJsonPath('data.duty.shifts', []);
    }

    public function test_setting_seeder_keeps_edited_values_on_rerun(): void
    {
        $this->set('church_phone', '+7 812 000-00-00');
        Setting::query()->where('key', 'church_phone')->update(['label' => 'Старая подпись']);

        $this->seed(SettingSeeder::class);

        $setting = Setting::query()->where('key', 'church_phone')->firstOrFail();

        $this->assertSame('+7 812 000-00-00', $setting->value);
        $this->assertSame('Телефон', $setting->label);
        $this->assertSame(1, Setting::query()->where('key', 'church_phone')->count());
    }

    private function set(string $key, ?string $value): void
    {
        $this->assertSame(1, Setting::query()->where('key', $key)->update(['value' => $value]));
    }
}
