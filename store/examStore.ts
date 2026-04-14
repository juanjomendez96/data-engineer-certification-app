'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ExamSession, ExamResult } from '../lib/types';
import { sampleExam } from '../lib/sampler';
import { scoreSession } from '../lib/scoring';

interface ExamStore {
  session: ExamSession | null;
  lastResult: ExamResult | null;
  startExam: () => void;
  resumeExam: () => void;
  abandonExam: () => void;
  setAnswer: (questionId: string, optionIndex: number) => void;
  flagQuestion: (questionId: string) => void;
  setCurrentIndex: (index: number) => void;
  submitExam: (expired?: boolean) => ExamResult;
}

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      session: null,
      lastResult: null,

      startExam: () => {
        const questions = sampleExam();
        set({
          session: {
            startTimestamp: Date.now(),
            questionIds: questions.map(q => q.id),
            answers: {},
            flags: {},
            currentIndex: 0,
          },
          lastResult: null,
        });
      },

      resumeExam: () => {},

      abandonExam: () => set({ session: null }),

      setAnswer: (questionId, optionIndex) =>
        set(state => ({
          session: state.session
            ? {
                ...state.session,
                answers: { ...state.session.answers, [questionId]: optionIndex },
              }
            : null,
        })),

      flagQuestion: (questionId) =>
        set(state => ({
          session: state.session
            ? {
                ...state.session,
                flags: {
                  ...state.session.flags,
                  [questionId]: !state.session.flags[questionId],
                },
              }
            : null,
        })),

      setCurrentIndex: (index) =>
        set(state => ({
          session: state.session ? { ...state.session, currentIndex: index } : null,
        })),

      submitExam: (expired = false) => {
        const { session } = get();
        if (!session) throw new Error('No active session');
        const result = scoreSession(session, expired);
        const historyRaw = localStorage.getItem('examHistory') ?? '[]';
        const history = JSON.parse(historyRaw) as Array<{
          answeredAt: number; percentage: number; passed: boolean; durationSeconds: number;
        }>;
        history.unshift({
          answeredAt: result.answeredAt,
          percentage: result.percentage,
          passed: result.passed,
          durationSeconds: result.durationSeconds,
        });
        localStorage.setItem('examHistory', JSON.stringify(history.slice(0, 20)));
        set({ session: null, lastResult: result });
        return result;
      },
    }),
    {
      name: 'examSession',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
    }
  )
);
