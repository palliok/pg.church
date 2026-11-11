<?php

namespace App\Rules;

use App\Support\Phone;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Номер телефона: российский или другой страны с «+» (см. Phone::isValid()).
 */
class PhoneNumber implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! Phone::isValid($value)) {
            $fail('Поле :attribute — не номер телефона. Российский номер — +7 (911) 123-45-67, номер другой страны — с «+» и кодом страны.');
        }
    }
}
