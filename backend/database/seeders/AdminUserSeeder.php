<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Создаёт первого администратора панели из ADMIN_EMAIL / ADMIN_PASSWORD.
     */
    public function run(): void
    {
        ['name' => $name, 'email' => $email, 'password' => $password] = config('church.admin');

        if (blank($email) || blank($password)) {
            $this->command?->warn('ADMIN_EMAIL или ADMIN_PASSWORD не заданы — администратор не создан.');

            return;
        }

        if (app()->isProduction() && $password === 'password') {
            $this->command?->error('В production нельзя использовать пароль администратора по умолчанию. Задайте ADMIN_PASSWORD.');

            return;
        }

        User::query()->firstOrCreate(['email' => $email], ['name' => $name, 'password' => $password]);
    }
}
