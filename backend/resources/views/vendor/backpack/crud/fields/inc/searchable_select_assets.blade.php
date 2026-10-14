{{--
    Поиск в выпадающих списках: Tom Select (Apache-2.0, resources/assets/vendor/tom-select).
    Подключается поверх обычного <select>, поэтому форма отправляет те же значения.
--}}
@push('crud_fields_styles')
    @basset(resource_path('assets/vendor/tom-select/tom-select.bootstrap5.min.css'))
    @bassetBlock('admin/fields/searchable-select.css')
    <style>
        .ts-wrapper.form-select, .ts-wrapper.form-control { padding: 0; border: 0; background: none; box-shadow: none; }
        /* У темы «стекло» фон полупрозрачный — список делаем сплошным. */
        .ts-dropdown { z-index: 1060; background-color: #fff; }
        [data-bs-theme="dark"] .ts-dropdown { background-color: #182433; }
    </style>
    @endBassetBlock
@endpush

@push('crud_fields_scripts')
    @basset(resource_path('assets/vendor/tom-select/tom-select.complete.min.js'))
    @bassetBlock('admin/fields/searchable-select.js')
    <script>
        function bpFieldInitSearchableSelect(element) {
            var select = element.find('select')[0];

            if (!select || select.tomselect) {
                return;
            }

            new TomSelect(select, {
                plugins: select.multiple ? ['remove_button'] : [],
                maxOptions: null,
                // Список открывается поверх страницы: карточки темы со «стеклом» перекрывали бы его.
                dropdownParent: 'body',
                allowEmptyOption: !select.multiple,
                placeholder: 'Начните вводить для поиска…',
                render: {
                    no_results: function () {
                        return '<div class="no-results">Ничего не найдено</div>';
                    },
                },
            });
        }
    </script>
    @endBassetBlock
@endpush
