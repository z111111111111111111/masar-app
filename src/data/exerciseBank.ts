// قاعدة بيانات التمارين العشوائية
// ====================================
// هذا الملف "قاعدة بيانات" بسيطة (مصفوفة بيانات ثابتة) لتخزين التمارين التي
// تريد إضافتها يدوياً، مصنّفة حسب المادة ثم حسب الشهر (1 إلى 9، بما يوافق
// أشهر "المسار" في التطبيق).
//
// ⚠️ ملاحظة: هذا الملف غير مربوط حالياً بأي واجهة في الموقع — إنشاؤه فقط
// كما طلبت، دون تغيير أي شيء في سلوك التطبيق الحالي (خانة "تمرين عشوائي"
// ما تزال تعمل كما كانت). يمكن ربطه لاحقاً متى احتجت لذلك.
//
// طريقة الإضافة:
// أضف كائناً (object) جديداً داخل مصفوفة الشهر والمادة المناسبين، مثال:
//
// math: {
//   1: [
//     {
//       id: 'math-m1-001',
//       title: 'نهايات دالة كثيرة الحدود',
//       statement: 'احسب نهاية الدالة f(x) = ... عند x تؤول إلى +∞',
//       difficulty: 'medium',
//       estimatedMinutes: 20,
//     },
//   ],
//   2: [],
//   ...
// }

import type { SubjectId } from './subjects';

export interface ExerciseEntry {
  /** معرّف فريد للتمرين، اختر أي نص لا يتكرر (مثال: 'math-m3-002') */
  id: string;
  /** عنوان مختصر للتمرين أو الدرس الذي يغطيه */
  title: string;
  /** نص التمرين الكامل (السؤال/الوضعية) */
  statement: string;
  /** تصحيح أو عناصر إجابة، اختياري */
  correction?: string;
  /** مستوى الصعوبة، اختياري */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** الوقت التقديري بالدقائق لحل التمرين، اختياري */
  estimatedMinutes?: number;
  /** أي ملاحظات إضافية، اختياري */
  notes?: string;
}

/** أرقام الأشهر التسعة التي يغطيها "المسار" */
export type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type ExerciseBank = Record<SubjectId, Record<MonthNumber, ExerciseEntry[]>>;

function emptyMonths(): Record<MonthNumber, ExerciseEntry[]> {
  return { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] };
}

// عبّئ التمارين هنا، شهراً بشهر ومادةً بمادة.
export const EXERCISE_BANK: ExerciseBank = {
  math: emptyMonths(),
  physics: emptyMonths(),
  nature: emptyMonths(),
  philo: emptyMonths(),
  social: emptyMonths(),
};

/** يعيد كل تمارين مادة معيّنة في شهر معيّن (مصفوفة فارغة إن لم توجد بعد) */
export function getExercises(subject: SubjectId, month: MonthNumber): ExerciseEntry[] {
  return EXERCISE_BANK[subject]?.[month] ?? [];
}

/** يعيد كل تمارين مادة معيّنة عبر الأشهر كلّها، مجمّعة في مصفوفة واحدة */
export function getAllExercisesForSubject(subject: SubjectId): ExerciseEntry[] {
  const months = EXERCISE_BANK[subject];
  return Object.values(months).flat();
}
