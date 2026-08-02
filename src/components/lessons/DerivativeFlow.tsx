import type { ExerciseData } from './systems/types';
import { K } from './systems/math';

export const DERIVATIVE_FLOW_ID = 'derivative';

export function serializeCorrectAnswer(ex: ExerciseData): string {
  switch (ex.kind) {
    case 'mcq': return String(ex.data.correct);
    case 'rule': return JSON.stringify(ex.data.correctOrder);
    case 'fill': return ex.data.correct;
    case 'truefalse': return String(ex.data.isTrue);
    case 'sort': return JSON.stringify(ex.data.correctOrder);
  }
}

export const DERIVATIVE_FLOW: ExerciseData[] = [
  /* ── النظام 1: الاختيار من متعدد ────────────────────────────── */
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة الدالة <K tex="f(x)=x^{7}" />؟</>,
      options: ['7x^{6}', 'x^{6}', '7x^{7}', '6x^{6}'],
      correct: 0,
      explanation: 'طبّق القانون $n\\cdot x^{n-1}$: ننزل الأس 7 ليصبح معاملًا، ثم نطرح 1 من الأس → $7x^{6}$',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة الدالة <K tex="f(x)=4x^{3}" />؟</>,
      options: ['4x^{2}', '12x^{2}', '12x^{3}', '3x^{2}'],
      correct: 1,
      explanation: 'نضرب المعامل 4 في الأس 3: $4\\times 3=12$، ثم نطرح 1 من الأس → $12x^{2}$',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة الدالة الثابتة <K tex="f(x)=8" />؟</>,
      options: ['8', '8x', '0', '1'],
      correct: 2,
      explanation: 'مشتقة أي دالة ثابتة تساوي صفرًا، لأن الدالة لا تتغير إطلاقًا',
    },
  },

  /* ── النظام 2: ترتيب مكوّنات القاعدة ────────────────────────── */
  {
    kind: 'rule',
    data: {
      instruction: 'رتّب المكوّنات لتكوين قاعدة مشتقة الدالة $x^{n}$',
      pieces: ['n', '\\cdot', 'x^{n-1}'],
      correctOrder: ['n', '\\cdot', 'x^{n-1}'],
      answerLabel: "f'(x)=",
      note: 'النقطة ($\\cdot$) تدل على عملية الضرب ($\\times$)',
    },
  },
  {
    kind: 'rule',
    data: {
      instruction: 'رتّب المكوّنات لتكوين قاعدة مشتقة الدالة $a\\cdot x^{n}$',
      pieces: ['a', '\\cdot', 'n', '\\cdot', 'x^{n-1}'],
      correctOrder: ['a', '\\cdot', 'n', '\\cdot', 'x^{n-1}'],
      answerLabel: "f'(x)=",
      note: 'النقطة ($\\cdot$) تدل على عملية الضرب ($\\times$)',
    },
  },

  /* ── النظام 3: ملء الفراغ ───────────────────────────────────── */
  {
    kind: 'fill',
    data: {
      before: <>مشتقة الدالة <K tex="f(x)=x^{n}" /> تُكتب: <K tex="f'(x)" /> =</>,
      choices: ['n\\cdot x^{n-1}', 'x^{n}', 'n\\cdot x^{n}', 'x^{n-1}'],
      correct: 'n\\cdot x^{n-1}',
      explanation: 'القاعدة تقول: ننزل الأس $n$ كمعامل ضربي، ثم نطرح 1 من الأس → $n\\cdot x^{n-1}$',
    },
  },
  {
    kind: 'fill',
    data: {
      before: <>مشتقة الدالة الثابتة <K tex="f(x)=c" /> تساوي</>,
      choices: ['c', '0', '1', 'cx'],
      correct: '0',
      explanation: 'الثابت لا يتغير أبدًا، لذلك معدل تغيّره (مشتقته) يساوي صفرًا',
    },
  },

  /* ── النظام 4: صحيح أو خطأ ──────────────────────────────────── */
  {
    kind: 'truefalse',
    data: {
      statement: <>مشتقة الدالة <K tex="f(x)=x^{3}" /> هي <K tex="3x^{2}" /></>,
      isTrue: true,
      explanation: 'صحيح: بتطبيق القاعدة حيث $n=3$ نحصل على $3\\cdot x^{3-1}=3x^{2}$',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <>مشتقة الدالة <K tex="f(x)=5" /> تساوي <K tex="5" /></>,
      isTrue: false,
      explanation: 'خطأ: الدالة الثابتة لا تتغير، إذن مشتقتها 0 وليس 5',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <>مشتقة الدالة <K tex="f(x)=x" /> هي <K tex="1" /></>,
      isTrue: true,
      explanation: 'صحيح: بما أن $x=x^{1}$، بتطبيق القاعدة: $1\\cdot x^{0}=1$',
    },
  },

  /* ── النظام 5: الترتيب الهرمي/التسلسلي بالبطاقات ────────────── */
  {
    kind: 'sort',
    data: {
      instruction: 'رتّب خطوات إيجاد مشتقة الدالة $x^{n}$ بالترتيب الصحيح',
      hint: 'ابدأ بتحديد الأس، ثم أنزله، واختم بكتابة الناتج النهائي',
      cards: ['حدّد الأس n', 'أنزل n كمعامل ضربي', 'اطرح 1 من الأس', 'اكتب الناتج n·xⁿ⁻¹'],
      correctOrder: ['حدّد الأس n', 'أنزل n كمعامل ضربي', 'اطرح 1 من الأس', 'اكتب الناتج n·xⁿ⁻¹'],
      relation: 'تسلسل خطوات',
    },
  },
  {
    kind: 'sort',
    data: {
      instruction: 'رتّب هذه العبارات بالترتيب الصحيح لإيجاد مشتقة الدالة $x^{3}$',
      hint: 'ابدأ بالدالة نفسها وانتهِ بالنتيجة النهائية',
      cards: ['f(x) = x³', 'الأس n = 3', '3·x³⁻¹', "f'(x) = 3x²"],
      correctOrder: ['f(x) = x³', 'الأس n = 3', '3·x³⁻¹', "f'(x) = 3x²"],
      relation: 'تسلسل منطقي',
    },
  },
];
