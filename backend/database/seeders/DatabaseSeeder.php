<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            SettingSeeder::class,
            DonationAccountSeeder::class,
        ]);

        // Сборник — до демо-наполнения: гимны демо-богослужения берутся из него.
        Artisan::call('songs:import');

        $this->call(DemoContentSeeder::class);
    }
}
