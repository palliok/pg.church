<?php

namespace Tests\Feature\Api;

use App\Models\DonationAccount;
use App\Models\DonationTarget;
use App\Models\Setting;
use Database\Seeders\DonationAccountSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DonationApiTest extends TestCase
{
    use RefreshDatabase;

    /** Содержимое QR-кода, который стоял на сайте до генерации (public/donation-qr.svg). */
    private const string ORIGINAL_QR = 'ST00012|Name=Местная религиозная организация Санкт-Петербургская Церковь евангельских христиан-баптистов'
        .'|PersonalAcc=40703810555000000365|BankName=СЕВЕРО-ЗАПАДНЫЙ БАНК ПАО СБЕРБАНК|BIC=044030653'
        .'|CorrespAcc=30101810500000000653|Purpose=Пожертвование на уставную деятельность|Sum=0'
        .'|PayeeINN=7802038805|KPP=780201001';

    public function test_donation_returns_targets_amounts_and_every_published_account(): void
    {
        $this->seed(SettingSeeder::class);
        Setting::query()->where('key', 'donation_amounts')->update(['value' => '300; 1500,  abc 0 5000']);

        DonationTarget::query()->create(['title' => 'Помощь нуждающимся', 'description' => 'Продукты', 'color' => '#f9c9a5', 'sort' => 2]);
        DonationTarget::query()->create(['title' => 'Аренда зала', 'sort' => 1]);

        $main = $this->account(['sort' => 2]);
        $building = $this->account([
            'title' => 'На строительство', 'account' => '40703810555000000999',
            'kpp' => null, 'payment_purpose' => null, 'sort' => 1,
        ]);
        $this->account(['title' => 'Черновик', 'is_published' => false]);

        $response = $this->getJson('/api/v1/donation');

        $response->assertOk()
            ->assertJsonPath('data.targets', [
                ['title' => 'Аренда зала', 'desc' => null, 'color' => null],
                ['title' => 'Помощь нуждающимся', 'desc' => 'Продукты', 'color' => '#f9c9a5'],
            ])
            ->assertJsonPath('data.amounts', [300, 1500, 5000])
            ->assertJsonPath('data.accounts.*.id', [$building->id, $main->id])
            ->assertJsonPath('data.accounts.*.title', ['На строительство', null])
            // Пустой реквизит (КПП) пропускается.
            ->assertJsonPath('data.accounts.0.fields.*.key', ['recipient', 'inn', 'bank', 'account', 'correspondentAccount', 'bic'])
            ->assertJsonPath('data.accounts.0.paymentPurpose', null)
            ->assertJsonPath('data.accounts.1.fields', [
                ['key' => 'recipient', 'label' => 'Получатель', 'value' => 'МРО Церковь'],
                ['key' => 'inn', 'label' => 'ИНН', 'value' => '7802038805'],
                ['key' => 'kpp', 'label' => 'КПП', 'value' => '780201001'],
                ['key' => 'bank', 'label' => 'Банк', 'value' => 'ПАО СБЕРБАНК'],
                ['key' => 'account', 'label' => 'Расчётный счёт', 'value' => '40703810555000000365'],
                ['key' => 'correspondentAccount', 'label' => 'Корреспондентский счёт', 'value' => '30101810500000000653'],
                ['key' => 'bic', 'label' => 'БИК', 'value' => '044030653'],
            ])
            ->assertJsonPath('data.accounts.1.paymentPurpose', 'Пожертвование')
            ->assertJsonPath('data.accounts.1.qrCode', config('app.url')."/api/v1/donation/accounts/{$main->id}/qr.svg")
            ->assertJsonMissingPath('data.bankDetails');
    }

    public function test_donation_without_accounts_and_settings(): void
    {
        $this->getJson('/api/v1/donation')
            ->assertOk()
            ->assertExactJson(['data' => ['targets' => [], 'amounts' => [], 'accounts' => []]]);
    }

    public function test_qr_code_is_served_as_svg(): void
    {
        $account = $this->account();
        $draft = $this->account(['is_published' => false]);

        $response = $this->get("/api/v1/donation/accounts/{$account->id}/qr.svg");

        $response->assertOk()
            ->assertHeader('Content-Type', 'image/svg+xml')
            ->assertHeader('Content-Disposition', 'inline; filename="donation-qr.svg"');
        $this->assertStringContainsString('<svg', $response->getContent());

        $this->get("/api/v1/donation/accounts/{$account->id}/qr.svg?download=1")
            ->assertOk()
            ->assertHeader('Content-Disposition', 'attachment; filename="donation-qr.svg"');

        $this->get("/api/v1/donation/accounts/{$draft->id}/qr.svg")->assertNotFound();
        $this->get('/api/v1/donation/accounts/999999/qr.svg')->assertNotFound();
        $this->get('/api/v1/donation/accounts/abc/qr.svg')->assertNotFound();
    }

    public function test_seeded_account_produces_the_same_qr_payload_as_the_original_image(): void
    {
        $this->seed(DonationAccountSeeder::class);
        $this->seed(DonationAccountSeeder::class);

        $this->assertSame(self::ORIGINAL_QR, DonationAccount::query()->sole()->paymentQrPayload());
    }

    public function test_qr_payload_skips_empty_fields_and_keeps_separators_out_of_values(): void
    {
        $account = $this->account([
            'recipient' => "ИП Иванов | Иван\nИванович ",
            'kpp' => null,
            'payment_purpose' => null,
        ]);

        $this->assertSame(
            'ST00012|Name=ИП Иванов Иван Иванович|PersonalAcc=40703810555000000365|BankName=ПАО СБЕРБАНК'
            .'|BIC=044030653|CorrespAcc=30101810500000000653|Sum=0|PayeeINN=7802038805',
            $account->paymentQrPayload(),
        );
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function account(array $attributes = []): DonationAccount
    {
        return DonationAccount::query()->create([
            'recipient' => 'МРО Церковь',
            'inn' => '7802038805',
            'kpp' => '780201001',
            'bank_name' => 'ПАО СБЕРБАНК',
            'account' => '40703810555000000365',
            'correspondent_account' => '30101810500000000653',
            'bic' => '044030653',
            'payment_purpose' => 'Пожертвование',
            ...$attributes,
        ]);
    }
}
