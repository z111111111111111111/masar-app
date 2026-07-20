export type SubjectId = 'math' | 'physics' | 'nature' | 'philo' | 'social';

export interface Subject {
  id: SubjectId;
  name: string;
  short: string;
}

export const SUBJECTS: Subject[] = [
  { id: 'math', name: 'الرياضيات', short: 'رياضيات' },
  { id: 'physics', name: 'الفيزياء', short: 'فيزياء' },
  { id: 'nature', name: 'العلوم الطبيعية', short: 'ط.ع' },
  { id: 'philo', name: 'الفلسفة', short: 'فلسفة' },
  { id: 'social', name: 'الاجتماعيات', short: 'اجتماعيات' },
];

export const subjectById = (id: SubjectId) => SUBJECTS.find((s) => s.id === id)!;

// One palette token per subject, reused consistently across charts (line colors,
// bar colors). Drawn from a dedicated, coordinated 5-color chart palette.
export const SUBJECT_COLOR_VAR: Record<SubjectId, string> = {
  math: 'chart-1',
  physics: 'chart-2',
  nature: 'chart-3',
  philo: 'chart-4',
  social: 'chart-5',
};

export function subjectColor(id: SubjectId): string {
  return `hsl(var(--${SUBJECT_COLOR_VAR[id]}))`;
}
