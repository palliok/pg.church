{{-- select_search: обычный select (связь «один») со строкой поиска --}}
@php
    $field['wrapper'] = $field['wrapper'] ?? $field['wrapperAttributes'] ?? [];
    $field['wrapper']['data-init-function'] = 'bpFieldInitSearchableSelect';
@endphp

@include('crud::fields.select')
@include('crud::fields.inc.searchable_select_assets')
