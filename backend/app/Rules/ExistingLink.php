<?php

namespace App\Rules;

use App\Models\Announcement;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Выбранная основной ссылка «link:N» есть среди строк поля «Ссылки».
 */
class ExistingLink implements ValidationRule
{
    public function __construct(private ?string $links) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! preg_match('/^link:(\d+)$/', (string) $value, $match)) {
            return;
        }

        if (! isset(Announcement::parseLinks($this->links ?? '')[(int) $match[1]])) {
            $fail('В поле :attribute выбрана ссылка, которой нет в списке «Ссылки».');
        }
    }
}
