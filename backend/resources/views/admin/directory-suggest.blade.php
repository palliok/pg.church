{{-- Подсказки из справочников «Места» и «Контакты» для полей с list="directory-places" / "directory-contacts" /
     "directory-phones". Поле остаётся свободным текстом. Выбрали место — в поле address (если оно есть в форме)
     подставляется его адрес; выбрали имя или телефон — подставляется второе. Значения копируются, связи нет. --}}
@once
@php
    $directoryPlaces = \App\Models\Place::query()->orderBy('name')->get(['name', 'address']);
    $directoryContacts = \App\Models\Contact::query()->orderBy('name')->get(['name', 'phone']);
@endphp
@push('crud_fields_scripts')
<datalist id="directory-places">
    @foreach ($directoryPlaces as $place)
        <option value="{{ $place->name }}" label="{{ $place->address }}"></option>
    @endforeach
</datalist>
<datalist id="directory-contacts">
    @foreach ($directoryContacts as $contact)
        <option value="{{ $contact->name }}" label="{{ $contact->phone }}"></option>
    @endforeach
</datalist>
<datalist id="directory-phones">
    @foreach ($directoryContacts as $contact)
        <option value="{{ $contact->phone }}" label="{{ $contact->name }}"></option>
    @endforeach
</datalist>
<script>
    jQuery(function () {
        const places = @json($directoryPlaces);
        const contacts = @json($directoryContacts);
        const same = (a, b) => (a ?? '').trim().toLocaleLowerCase('ru') === (b ?? '').trim().toLocaleLowerCase('ru');
        // crud.field() ругается в консоль на поле, которого нет в форме.
        const has = (name) => document.querySelector(`[name="${name}"]`) !== null;

        // Подставляется в пустое поле или поверх значения из того же справочника; введённое руками не трогается.
        // Значение ставится через change(), чтобы обновились зависящие поля (варианты «Основного действия»);
        // одинаковое не ставится, иначе имя и телефон подставляли бы друг друга по кругу.
        function fill(name, value, known) {
            const field = crud.field(name);
            const current = (field.value ?? '').trim();

            if (current === value || (current !== '' && !known.some((item) => same(item, current)))) {
                return;
            }

            field.input.value = value;
            field.change();
        }

        if (has('place') && has('address')) {
            crud.field('place').onChange(function (field) {
                const place = places.find((place) => same(place.name, field.value));

                if (place) {
                    fill('address', place.address ?? '', places.map((place) => place.address ?? ''));
                }
            });
        }

        if (has('contact_name') && has('contact_phone')) {
            // Одно имя бывает у разных контактов: тогда телефон из справочника стирается — его выберут из подсказок.
            crud.field('contact_name').onChange(function (field) {
                const found = contacts.filter((contact) => same(contact.name, field.value));
                const phones = contacts.map((contact) => contact.phone);

                if (found.length === 1) {
                    fill('contact_phone', found[0].phone, phones);
                } else if (found.length > 1 && !found.some((contact) => contact.phone === crud.field('contact_phone').value)) {
                    fill('contact_phone', '', phones);
                }
            });

            crud.field('contact_phone').onChange(function (field) {
                const contact = contacts.find((contact) => contact.phone === (field.value ?? '').trim());

                if (contact) {
                    fill('contact_name', contact.name, contacts.map((contact) => contact.name));
                }
            });
        }
    });
</script>
@endpush
@endonce
