import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Stores the teacher's analytics filter choices so they persist
 * across navigation within the session.
 */
export const useAnalyticsStore = create(
  persist(
    (set) => ({
      // Selected exam ID
      examId: null,
      examTitle: '',

      // Derived filter options (populated from API response)
      availableSemesters: [],
      availableClasses:   [],
      availableDivisions: [],

      // Selected filter values
      semester:     null,
      studentClass: null,
      division:     null,

      // Actions
      setExam: (id, title) =>
        set({ examId: id, examTitle: title, semester: null, studentClass: null, division: null }),

      setAvailableGroups: (groups) => {
        const semesters  = [...new Set(groups.map((g) => g.semester).filter(Boolean))].sort((a, b) => a - b);
        set({ availableSemesters: semesters, availableClasses: [], availableDivisions: [], semester: null, studentClass: null, division: null });
      },

      setSemester: (sem, groups) => {
        const classes = [...new Set(
          groups.filter((g) => g.semester === Number(sem)).map((g) => g.studentClass).filter(Boolean)
        )].sort();
        set({ semester: sem, studentClass: null, division: null, availableClasses: classes, availableDivisions: [] });
      },

      setStudentClass: (cls, groups, semester) => {
        const divisions = [...new Set(
          groups
            .filter((g) => g.semester === Number(semester) && g.studentClass === cls)
            .map((g) => g.division)
            .filter(Boolean)
        )].sort();
        set({ studentClass: cls, division: null, availableDivisions: divisions });
      },

      setDivision: (div) => set({ division: div }),

      reset: () => set({
        examId: null, examTitle: '',
        availableSemesters: [], availableClasses: [], availableDivisions: [],
        semester: null, studentClass: null, division: null,
      }),
    }),
    {
      name: 'ef_analytics_filter',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
