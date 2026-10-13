<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DonationAccount;
use App\Models\DonationTarget;
use App\Models\Setting;
use App\Support\QrCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class DonationController extends Controller
{
    /** Колонка реквизитов => ключ поля в ответе и подпись. */
    private const array FIELDS = [
        'recipient' => ['recipient', 'Получатель'],
        'inn' => ['inn', 'ИНН'],
        'kpp' => ['kpp', 'КПП'],
        'bank_name' => ['bank', 'Банк'],
        'account' => ['account', 'Расчётный счёт'],
        'correspondent_account' => ['correspondentAccount', 'Корреспондентский счёт'],
        'bic' => ['bic', 'БИК'],
    ];

    /**
     * Цели пожертвований, предлагаемые суммы и реквизиты (их может быть несколько).
     */
    public function index(): JsonResponse
    {
        $targets = DonationTarget::query()->orderBy('sort')->orderBy('id')->get()
            ->map(fn (DonationTarget $target) => [
                'title' => $target->title,
                'desc' => $target->description,
                'color' => $target->color,
            ]);

        $amounts = collect(preg_split('/[\s,;]+/', (string) Setting::query()->where('key', 'donation_amounts')->value('value')))
            ->map(fn (string $amount) => (int) $amount)
            ->filter(fn (int $amount) => $amount > 0)
            ->values();

        $accounts = DonationAccount::query()->published()->orderBy('sort')->orderBy('id')->get()
            ->map(fn (DonationAccount $account) => [
                'id' => $account->id,
                'title' => $account->title,
                'fields' => collect(self::FIELDS)
                    ->filter(fn (array $field, string $column) => filled($account->{$column}))
                    ->map(fn (array $field, string $column) => ['key' => $field[0], 'label' => $field[1], 'value' => $account->{$column}])
                    ->values(),
                'paymentPurpose' => $account->payment_purpose,
                'qrCode' => route('api.donation.qr', $account),
            ]);

        return response()->json(['data' => [
            'targets' => $targets,
            'amounts' => $amounts,
            'accounts' => $accounts,
        ]]);
    }

    /**
     * Платёжный QR-код реквизитов; с ?download=1 отдаётся как файл для скачивания.
     */
    public function qr(Request $request, int $account): Response
    {
        $account = DonationAccount::query()->published()->findOrFail($account);

        return response(QrCode::svg($account->paymentQrPayload()), 200, [
            'Content-Type' => 'image/svg+xml',
            'Content-Disposition' => ($request->boolean('download') ? 'attachment' : 'inline').'; filename="donation-qr.svg"',
            'Cache-Control' => 'public, max-age=300',
        ]);
    }
}
