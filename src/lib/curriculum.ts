import type { SubjectId } from './subjects';

export interface Topic {
  title: string;
  startWeek: number; // first week (since the learner's start date) this topic is being covered
  endWeek: number; // last week this topic is covered before moving on
}

// Cumulative week ranges derived from the uploaded "ترتيب الدروس" syllabi
// (using the midpoint of each unit's estimated duration).
const MATH_TOPICS: Topic[] = [
  { title: 'الدوال العددية: الاستمرارية والنهايات والاشتقاقية', startWeek: 1, endWeek: 4 },
  { title: 'الدوال الأسية', startWeek: 5, endWeek: 7 },
  { title: 'الدوال اللوغاريتمية النيبيرية', startWeek: 8, endWeek: 10 },
  { title: 'المتتاليات العددية', startWeek: 11, endWeek: 13 },
  { title: 'الأعداد المركبة والتحويلات النقطية', startWeek: 14, endWeek: 17 },
  { title: 'الهندسة في الفضاء', startWeek: 18, endWeek: 20 },
  { title: 'الاحتمالات', startWeek: 21, endWeek: 23 },
  { title: 'الدوال الأصلية والحساب التكاملي', startWeek: 24, endWeek: 25 },
];

const PHYSICS_TOPICS: Topic[] = [
  { title: 'المتابعة الزمنية لتحول كيميائي في وسط مائي', startWeek: 1, endWeek: 5 },
  { title: 'تطور جملة ميكانيكية (الميكانيك)', startWeek: 6, endWeek: 11 },
  { title: 'دراسة ظواهر كهربائية: ثنائيا القطب RC وRL', startWeek: 12, endWeek: 15 },
  { title: 'تطور جملة كيميائية نحو حالة التوازن (الأحماض والأسس)', startWeek: 16, endWeek: 19 },
  { title: 'التحولات النووية', startWeek: 20, endWeek: 22 },
  { title: 'مراقبة تطور جملة كيميائية (الأسترة)', startWeek: 23, endWeek: 24 },
  { title: 'التطورات المهتزة (الاهتزازات)', startWeek: 25, endWeek: 26 },
  { title: 'مفهوم الموجة', startWeek: 27, endWeek: 27 },
];

// No sourced lesson-by-lesson syllabus was provided for these three subjects,
// so the suggester offers a general review prompt instead of naming specific lessons.
const GENERIC_TOPIC = 'مراجعة شاملة لمكتسبات المادة حتى الآن';

export function currentWeekFromStart(dayIndexToday: number): number {
  return Math.max(1, Math.floor(dayIndexToday / 7) + 1);
}

export function topicsFor(subject: SubjectId): Topic[] | null {
  if (subject === 'math') return MATH_TOPICS;
  if (subject === 'physics') return PHYSICS_TOPICS;
  return null;
}

// Picks a topic that has already begun (per the elapsed weeks since the learner's
// start date), i.e. only from lessons already reached — never a future one.
export function pickTopicForSubject(subject: SubjectId, currentWeek: number): string {
  const topics = topicsFor(subject);
  if (!topics) return GENERIC_TOPIC;
  const started = topics.filter((t) => t.startWeek <= currentWeek);
  const pool = started.length ? started : [topics[0]];
  return pool[Math.floor(Math.random() * pool.length)].title;
}
