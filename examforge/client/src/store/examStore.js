import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialBasicState = {
  title: '',
  description: '',
  duration: 60,
  totalMarks: '',
  numQuestions: '',
  scheduledStart: '',
  scheduledEnd: '',
  latestJoinTime: '',
  shuffleOptions: true,
  showResultAfterSubmit: false,
  targetSemester: '',
  targetClass: '',
  targetDivision: '',
};

const initialExamState = {
  basic: initialBasicState,
  rules: [''],
  questions: [{ type: 'mcq', text: '', marks: 1, options: ['', '', '', ''], correctIndex: 0 }],
  assignedStudents: [],
};

export const useExamStore = create(
  persist(
    (set) => ({
      ...initialExamState,
      setBasic: (basic) => set((state) => ({ basic: typeof basic === 'function' ? basic(state.basic) : basic })),
      setRules: (rules) => set((state) => ({ rules: typeof rules === 'function' ? rules(state.rules) : rules })),
      setQuestions: (questions) => set((state) => ({ questions: typeof questions === 'function' ? questions(state.questions) : questions })),
      setAssignedStudents: (assignedStudents) => set((state) => ({ assignedStudents: typeof assignedStudents === 'function' ? assignedStudents(state.assignedStudents) : assignedStudents })),
      clearExamState: () => set(initialExamState),
      allClear: () => set(initialExamState),
      setFullState: (fullState) => set({
        basic: fullState.basic || initialBasicState,
        rules: fullState.rules || initialExamState.rules,
        questions: fullState.questions || initialExamState.questions,
        assignedStudents: fullState.assignedStudents || [],
      }),
    }),
    {
      name: 'examforge-draft',
    }
  )
);
