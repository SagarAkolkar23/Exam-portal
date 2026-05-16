import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAttemptStore = create(
  persist(
    (set, get) => ({
      accessCode: "",
      examId: "",

      setAccessCode: (code) =>
        set({
          accessCode: code,
        }),

      setExamId: (id) =>
        set({
          examId: id,
        }),

      getAccessCode: () => get().accessCode,

      getExamId: () => get().examId,

      clearAccessCode: () =>
        set({
          accessCode: "",
        }),

      clearExamId: () =>
        set({
          examId: "",
        }),

      clearAttemptStore: () =>
        set({
          accessCode: "",
          examId: "",
        }),
    }),
    {
      name: "attempt-storage",
    },
  ),
);
