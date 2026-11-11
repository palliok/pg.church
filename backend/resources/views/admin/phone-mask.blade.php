{{-- Маска телефона для полей с data-phone-mask: российский номер набирается сразу как «+7 (911) 123-45-67».
     Номер другой страны (начат с «+» и не 7) не трогается. Окончательный вид задаёт бэк (App\Support\Phone). --}}
@once
@push('crud_fields_scripts')
<script>
    (function () {
        function formatPhone(value) {
            const digits = value.replace(/\D/g, '');

            if (digits === '') {
                return value.trim() === '+' ? '+' : '';
            }

            if (value.trim().startsWith('+') && digits[0] !== '7') {
                return value;
            }

            // Первая 7 или 8 — код страны, остальное — номер; 9… без кода — сразу номер.
            const national = (/^[78]/.test(digits) ? digits.slice(1) : digits).slice(0, 10);
            let result = '+7';

            if (national.length > 0) result += ' (' + national.slice(0, 3);
            if (national.length > 3) result += ') ' + national.slice(3, 6);
            if (national.length > 6) result += '-' + national.slice(6, 8);
            if (national.length > 8) result += '-' + national.slice(8, 10);

            return result;
        }

        function apply(input) {
            const formatted = formatPhone(input.value);

            if (formatted !== input.value) {
                input.value = formatted;
            }
        }

        document.querySelectorAll('input[data-phone-mask]').forEach(function (input) {
            input.addEventListener('input', function (event) {
                // Стирание и правка в середине номера не переформатируются, чтобы не прыгал курсор и
                // можно было удалить скобку или дефис; вид поправится, когда поле потеряет фокус.
                const atEnd = input.selectionStart === input.value.length;

                if (!event.inputType?.startsWith('delete') && atEnd) {
                    apply(input);
                }
            });
            input.addEventListener('blur', function () {
                apply(input);
            });
            apply(input);
        });
    })();
</script>
@endpush
@endonce
