import { create } from 'zustand';

export const useAttemptStore = create((set, get) => ({
  accessCode: '',

  setAccessCode: (code) => set({ accessCode: code }),

  getAccessCode: () => get().accessCode,

  clearAccessCode: () => set({ accessCode: '' }),
}));