{{-- Форма события: варианты «Основной ссылки» подписываются текстами введённых ссылок --}}
@include('admin.directory-suggest')
@push('crud_fields_scripts')
<script>
    jQuery(function () {
        // Тексты ссылок — как их разбирает Announcement::parseLinks(): строки с «|», текст до последней «|».
        const linkTexts = () => (crud.field('links_text').value ?? '')
            .split(/\r?\n/)
            .filter((line) => line.trim() !== '' && line.includes('|'))
            .map((line) => line.slice(0, line.lastIndexOf('|')).trim());

        const select = document.querySelector('select[name="main_choice"]');

        function updateChoices() {
            const texts = linkTexts();

            for (const option of select.options) {
                const link = option.value.match(/^link:(\d+)$/);
                if (!link) continue;

                const available = Number(link[1]) < texts.length;
                option.textContent = available ? `Ссылка «${texts[link[1]]}»` : `Ссылка ${Number(link[1]) + 1}`;
                option.hidden = !available;
                option.disabled = !available;
            }

            // Выбранную ссылку удалили — основной ссылки больше нет.
            if (select.selectedOptions[0]?.disabled) {
                select.value = 'none';
            }
        }

        crud.field('links_text').onChange(updateChoices);
        updateChoices();
    });
</script>
@endpush
