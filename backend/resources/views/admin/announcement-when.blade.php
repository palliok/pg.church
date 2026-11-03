{{-- Форма объявления: показывает только поля дат выбранного типа «Когда» --}}
@push('crud_fields_scripts')
<script>
    jQuery(function () {
        const fieldsByType = {
            date: ['event_date', 'event_date_end'],
            until: ['deadline'],
            weekly: ['weekday', 'weekly_time'],
        };

        crud.field('when_type').onChange(function (field) {
            for (const [type, names] of Object.entries(fieldsByType)) {
                names.forEach((name) => crud.field(name).show(field.value === type));
            }
        }).change();
    });
</script>
@endpush
