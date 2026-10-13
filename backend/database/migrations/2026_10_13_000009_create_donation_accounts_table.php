<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Настройки, в которых раньше хранились единственные реквизиты. */
    private const array SETTINGS = [
        'bank_inn' => 'inn',
        'bank_kpp' => 'kpp',
        'bank_name' => 'bank_name',
        'bank_account' => 'account',
        'bank_correspondent_account' => 'correspondent_account',
        'bank_bic' => 'bic',
        'bank_payment_purpose' => 'payment_purpose',
    ];

    /**
     * Реквизиты для пожертвований: их может быть несколько, у каждых — свой QR-код.
     */
    public function up(): void
    {
        Schema::create('donation_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('recipient');
            $table->string('inn', 12);
            $table->string('kpp', 9)->nullable();
            $table->string('bank_name');
            $table->string('account', 20);
            $table->string('correspondent_account', 20);
            $table->string('bic', 9);
            $table->string('payment_purpose')->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        $this->moveSettingsToFirstAccount();
    }

    /**
     * Reverse the migrations. Прежние настройки реквизитов не восстанавливаются.
     */
    public function down(): void
    {
        Schema::dropIfExists('donation_accounts');
    }

    private function moveSettingsToFirstAccount(): void
    {
        $settings = DB::table('settings')->whereIn('key', array_keys(self::SETTINGS))->pluck('value', 'key');

        $account = [];
        foreach (self::SETTINGS as $setting => $column) {
            $account[$column] = $settings[$setting] ?? null;
        }

        if (filled($account['account']) && filled($account['bic']) && filled($account['bank_name']) && filled($account['inn'])) {
            DB::table('donation_accounts')->insert([
                ...$account,
                // Получателя в настройках не было — он был только внутри картинки с QR-кодом.
                'recipient' => 'Местная религиозная организация Санкт-Петербургская Церковь евангельских христиан-баптистов',
                'correspondent_account' => $account['correspondent_account'] ?? '0',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('settings')->whereIn('key', [...array_keys(self::SETTINGS), 'donation_qr_url'])->delete();
    }
};
