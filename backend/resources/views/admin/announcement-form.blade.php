{{-- Форма объявления: поля дат только выбранного типа «Когда» (со связанным событием — ни одного и без места)
     и варианты «Основного действия» по введённым ссылкам и контакту --}}
@include('admin.phone-mask')
@push('crud_fields_scripts')
<script>
    jQuery(function () {
        const fieldsByType = {
            date: ['event_date', 'event_date_end'],
            until: ['deadline'],
            weekly: ['weekday', 'weekly_time'],
        };

        // Со связанным событием дата, время и место — из него: «Когда» с датами и «Где» скрыты, сервер их не сохранит.
        // Уточнение остаётся.
        function updateWhen() {
            const linked = Boolean(crud.field('event_id').value);
            const type = crud.field('when_type').value;

            ['when_type', 'place'].forEach((name) => crud.field(name).show(!linked));
            for (const [fieldType, names] of Object.entries(fieldsByType)) {
                names.forEach((name) => crud.field(name).show(!linked && type === fieldType));
            }
        }

        crud.field('event_id').onChange(updateWhen);
        crud.field('when_type').onChange(updateWhen);
        updateWhen();

        // Тексты ссылок — как их разбирает Announcement::parseLinks(): строки с «|», текст до последней «|».
        const linkTexts = () => (crud.field('links_text').value ?? '')
            .split(/\r?\n/)
            .filter((line) => line.trim() !== '' && line.includes('|'))
            .map((line) => line.slice(0, line.lastIndexOf('|')).trim());

        const select = document.querySelector('select[name="main_choice"]');

        function updateChoices() {
            const texts = linkTexts();
            const name = (crud.field('contact_name').value ?? '').trim();
            const phone = (crud.field('contact_phone').value ?? '').trim();

            for (const option of select.options) {
                const link = option.value.match(/^link:(\d+)$/);
                let available = true;

                if (link) {
                    available = Number(link[1]) < texts.length;
                    option.textContent = available ? `Ссылка «${texts[link[1]]}»` : `Ссылка ${Number(link[1]) + 1}`;
                } else if (option.value === 'contact') {
                    available = phone !== '';
                    option.textContent = available ? `Позвонить: ${name || phone}` : 'Позвонить контакту';
                }

                option.hidden = !available;
                option.disabled = !available;
            }

            // Выбранную ссылку удалили или стёрли телефон — основного действия больше нет.
            if (select.selectedOptions[0]?.disabled) {
                select.value = 'none';
            }
        }

        ['links_text', 'contact_name', 'contact_phone'].forEach((name) => crud.field(name).onChange(updateChoices));
        updateChoices();
    });
</script>
@endpush
