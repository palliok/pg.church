<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'title', 'recipient', 'inn', 'kpp', 'bank_name', 'account', 'correspondent_account',
    'bic', 'payment_purpose', 'sort', 'is_published',
])]
class DonationAccount extends Model
{
    use CrudTrait;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    /**
     * @param  Builder<DonationAccount>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('is_published', true);
    }

    /**
     * Содержимое платёжного QR-кода по ГОСТ Р 56042-2014: его читают приложения
     * банков и подставляют реквизиты в перевод. ST00012 — кодировка UTF-8,
     * первые пять полей обязательны и идут в этом порядке. Sum=0 — сумму
     * вводит сам жертвователь.
     */
    public function paymentQrPayload(): string
    {
        $fields = array_filter([
            'Name' => $this->recipient,
            'PersonalAcc' => $this->account,
            'BankName' => $this->bank_name,
            'BIC' => $this->bic,
            'CorrespAcc' => $this->correspondent_account,
            'Purpose' => $this->payment_purpose,
            'Sum' => '0',
            'PayeeINN' => $this->inn,
            'KPP' => $this->kpp,
        ], fn (?string $value) => $value !== null && $value !== '');

        $payload = 'ST00012';

        foreach ($fields as $name => $value) {
            // «|» разделяет поля, поэтому внутри значения ему и переводам строк не место.
            $payload .= '|'.$name.'='.trim(preg_replace('/[|\s]+/u', ' ', $value));
        }

        return $payload;
    }
}
