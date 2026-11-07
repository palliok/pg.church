import { useMemo } from 'react';
import { t } from '../i18n.js';
import { useApi } from './useApi.js';

function toDonation(raw) {
  return {
    ...raw,
    accounts: raw.accounts.map((account) => ({
      ...account,
      title: t(account.title),
      fields: account.fields.map((field) => ({ ...field, label: t(field.label) })),
    })),
  };
}

// Реквизиты для пожертвований; их может быть несколько, у каждых свой QR-код.
// donation равен null, пока данные не загружены.
export function useDonation() {
  const { data, ...status } = useApi('/donation');
  const donation = useMemo(() => (data ? toDonation(data) : null), [data]);

  return { donation, ...status };
}
