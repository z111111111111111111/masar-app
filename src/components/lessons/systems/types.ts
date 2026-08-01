import type { ReactNode } from 'react';

/* ── النظام 1: الاختيار من متعدد ─────────────────────────────── */
export interface MCQData {
  question: ReactNode;
  options: string[];
  correct: number;
  explanation: string;
}

/* ── النظام 2: ترتيب مكوّنات القاعدة ─────────────────────────── */
export interface RuleData {
  instruction: string;
  pieces: string[];
  correctOrder: string[];
  answerLabel?: string;
  note?: string;
}

/* ── النظام 3: ملء الفراغ ────────────────────────────────────── */
export interface FillData {
  before: ReactNode;
  after?: ReactNode;
  choices: string[];
  correct: string;
  explanation: string;
}

/* ── النظام 4: صحيح أو خطأ ───────────────────────────────────── */
export interface TrueFalseData {
  statement: ReactNode;
  isTrue: boolean;
  explanation: string;
}

/* ── النظام 5: الترتيب الهرمي/التسلسلي بالبطاقات ─────────────── */
export interface SortData {
  instruction: string;
  hint?: string;
  cards: string[];
  correctOrder: string[];
  relation: string;
}

export type ExerciseData =
  | { kind: 'mcq'; data: MCQData }
  | { kind: 'rule'; data: RuleData }
  | { kind: 'fill'; data: FillData }
  | { kind: 'truefalse'; data: TrueFalseData }
  | { kind: 'sort'; data: SortData };

export const SYSTEM_NAMES: Record<ExerciseData['kind'], string> = {
  mcq: 'اختيار من متعدد',
  rule: 'تركيب القاعدة',
  fill: 'ملء الفراغ',
  truefalse: 'صحيح أو خطأ',
  sort: 'الترتيب الهرمي',
};
