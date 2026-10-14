<?php

namespace App\Services\Calendar;

/**
 * Итог синхронизации одного календаря.
 */
class SyncResult
{
    public int $created = 0;

    public int $updated = 0;

    public int $deleted = 0;

    /** Удалённые в календаре события с проповедью: их не удаляем, а снимаем с публикации. */
    public int $hidden = 0;

    public function summary(): string
    {
        return "добавлено {$this->created}, обновлено {$this->updated}, удалено {$this->deleted}"
            .($this->hidden > 0 ? ", снято с публикации {$this->hidden}" : '');
    }
}
