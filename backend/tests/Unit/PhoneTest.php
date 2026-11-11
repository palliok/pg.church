<?php

namespace Tests\Unit;

use App\Support\Phone;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class PhoneTest extends TestCase
{
    /**
     * @return array<string, array{string, string, string}>
     */
    public static function phones(): array
    {
        return [
            'с восьмёркой' => ['8 911 123-45-67', '+7 (911) 123-45-67', 'tel:+79111234567'],
            'слитно' => ['89111234567', '+7 (911) 123-45-67', 'tel:+79111234567'],
            'с +7' => ['+7(911)1234567', '+7 (911) 123-45-67', 'tel:+79111234567'],
            'без кода страны' => ['812 000-00-00', '+7 (812) 000-00-00', 'tel:+78120000000'],
            'уже по маске' => ['+7 (911) 123-45-67', '+7 (911) 123-45-67', 'tel:+79111234567'],
            'другой страны' => ['+996 555 123 456', '+996 555 123 456', 'tel:+996555123456'],
        ];
    }

    #[DataProvider('phones')]
    public function test_formats_phone_and_call_link(string $input, string $formatted, string $tel): void
    {
        $this->assertSame($formatted, Phone::format($input));
        $this->assertSame($tel, Phone::tel($input));
        $this->assertTrue(Phone::isValid($input));
    }

    public function test_empty_phone_has_no_value_and_no_link(): void
    {
        $this->assertNull(Phone::format('  '));
        $this->assertNull(Phone::tel(null));
    }

    public function test_rejects_what_is_not_a_phone(): void
    {
        foreach (['-- -- --', '911 12', '8 911 123-45-67 доб. 5', '+7 911 123-45-6', '911 123 45 678 9'] as $phone) {
            $this->assertFalse(Phone::isValid($phone), $phone);
        }
    }
}
