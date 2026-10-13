<?php

namespace Database\Seeders;

use App\Models\DonationAccount;
use Illuminate\Database\Seeder;

class DonationAccountSeeder extends Seeder
{
    /**
     * Реквизиты церкви для пожертвований. Если какие-то реквизиты уже заведены,
     * сидер ничего не меняет.
     */
    public function run(): void
    {
        if (DonationAccount::query()->exists()) {
            return;
        }

        DonationAccount::query()->create([
            'recipient' => 'Местная религиозная организация Санкт-Петербургская Церковь евангельских христиан-баптистов',
            'inn' => '7802038805',
            'kpp' => '780201001',
            'bank_name' => 'СЕВЕРО-ЗАПАДНЫЙ БАНК ПАО СБЕРБАНК',
            'account' => '40703810555000000365',
            'correspondent_account' => '30101810500000000653',
            'bic' => '044030653',
            'payment_purpose' => 'Пожертвование на уставную деятельность',
        ]);
    }
}
