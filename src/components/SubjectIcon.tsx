import type { SubjectId } from '@/lib/subjects';
import { MathIcon, AtomIcon, LeafIcon, BookIcon, GlobeIcon } from './icons';

export function SubjectIcon({ id, className, size }: { id: SubjectId; className?: string; size?: number }) {
  switch (id) {
    case 'math':
      return <MathIcon className={className} size={size} />;
    case 'physics':
      return <AtomIcon className={className} size={size} />;
    case 'nature':
      return <LeafIcon className={className} size={size} />;
    case 'philo':
      return <BookIcon className={className} size={size} />;
    case 'social':
      return <GlobeIcon className={className} size={size} />;
  }
}
