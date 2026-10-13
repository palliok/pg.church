import { createContext, useContext } from 'react';

export const ChurchContext = createContext(null);

// Контакты церкви, соцсети и дежурства служителей (см. ChurchProvider).
// Возвращает null, пока данные ни разу не были загружены.
export function useChurch() {
  return useContext(ChurchContext);
}
