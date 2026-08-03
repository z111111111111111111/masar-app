import type { ExerciseData } from './systems/types';
import { K } from './systems/math';

export const DERIVATIVE_FLOW_ID_3 = 'derivative-3';
export const STAGE3_MAX_ITEMS = 13;

export const DERIVATIVE_FLOW_STAGE3: ExerciseData[] = [
  /* ── النظام 1: الاختيار من متعدد (11) ───────────────────────── */
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة الدالة <K tex="f(x)=x^{3}+\ln(x)" />؟</>,
      options: ['3x^{2}+\\frac{1}{x}', '3x^{2}+\\ln(x)', 'x^{3}+\\frac{1}{x}', '3x^{2}-\\frac{1}{x}'],
      correct: 0,
      explanation: 'قاعدة المجموع: نشتق كل حد على حدة، مشتقة $x^{3}$ هي $3x^{2}$ ومشتقة $\\ln(x)$ هي $\\frac{1}{x}$',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة <K tex="f(x)=x^{2}\\cdot e^{x}" />؟</>,
      options: ['2x\\cdot e^{x}', 'x^{2}\\cdot e^{x}', '2x\\cdot e^{x}+x^{2}\\cdot e^{x}', '2x\\cdot e^{x}-x^{2}\\cdot e^{x}'],
      correct: 2,
      explanation: 'قاعدة الجداء: $u\'=2x$ و $v\'=e^{x}$، إذن $f\'=2x\\cdot e^{x}+x^{2}\\cdot e^{x}$',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة <K tex="f(x)=\\frac{1}{x}" />؟</>,
      options: ['\\frac{1}{x^{2}}', '-\\frac{1}{x^{2}}', '\\ln(x)', 'x'],
      correct: 1,
      explanation: 'اكتبها $x^{-1}$، مشتقتها $-x^{-2}=-\\frac{1}{x^{2}}$، أو طبّق قاعدة الخارج بقسمة البسط 1',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة <K tex="f(x)=e^{2x}" />؟</>,
      options: ['e^{2x}', '2\\cdot e^{2x}', 'e^{2}\\cdot e^{x}', '2x\\cdot e^{2x-1}'],
      correct: 1,
      explanation: 'قاعدة التركيب: مشتقة الخارج $e^{2x}$ هي $e^{2x}$، ومشتقة الداخل $2x$ هي 2، إذن $2e^{2x}$',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة <K tex="f(x)=x\\cdot \\sin(x)" />؟</>,
      options: ['\\sin(x)+x\\cos(x)', '\\cos(x)+x\\sin(x)', '\\sin(x)-x\\cos(x)', 'x\\cos(x)'],
      correct: 0,
      explanation: 'قاعدة الجداء: $u\'=1$ و $v\'=\\cos(x)$، إذن $f\'=1\\cdot \\sin(x)+x\\cdot \\cos(x)$',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة <K tex="f(x)=\\frac{x^{2}}{x+1}" />؟ (باستخدام قاعدة <K tex="(u/v)" />)</>,
      options: ['\\frac{2x}{1}', '\\frac{2x(x+1)-x^{2}}{(x+1)^{2}}', '\\frac{x^{2}-2x(x+1)}{(x+1)^{2}}', '\\frac{2x}{(x+1)^{2}}'],
      correct: 1,
      explanation: 'قاعدة الخارج: $u=x^{2}$ و $v=x+1$، إذن $f\'=\\frac{2x(x+1)-x^{2}}{(x+1)^{2}}$',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة <K tex="f(x)=\\ln(3x+1)" />؟</>,
      options: ['\\frac{1}{3x+1}', '\\frac{3}{3x+1}', '3\\ln(3x+1)', '\\frac{1}{3}'],
      correct: 1,
      explanation: 'قاعدة التركيب: مشتقة اللن $\\frac{1}{3x+1}$ مضروبة في مشتقة الداخل وهي 3، إذن $\\frac{3}{3x+1}$',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة <K tex="f(x)=3x^{2}+5x-2" />؟</>,
      options: ['6x+5', '3x^{2}+5', '6x+5x', '6x-2'],
      correct: 0,
      explanation: 'قاعدة المجموع: مشتقة $3x^{2}$ هي $6x$، ومشتقة $5x$ هي 5، ومشتقة الثابت $-2$ هي 0',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>أحد الطلاب كتب أن مشتقة <K tex="f(x)=x^{3}\\cdot x^{5}" /> هي <K tex="(3x^{2})\\cdot (5x^{4})" /> (أي ضرب المشتقتين فقط). ما هو الرد الصحيح؟</>,
      options: [
        'كلامه صحيح لأنها جداء',
        'بل الصحيح هو $3x^{2}\\cdot x^{5}+x^{3}\\cdot 5x^{4}=8x^{7}$',
        'الصحيح هو $15x^{6}$',
        'الصحيح هو $x^{8}$',
      ],
      correct: 1,
      explanation: 'قاعدة الجداء: $f\'=3x^{2}\\cdot x^{5}+x^{3}\\cdot 5x^{4}=8x^{7}$، أو نبسطها أولاً إلى $x^{8}$ فتصبح مشتقتها $8x^{7}$',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة <K tex="f(x)=\\sin(3x)" />؟</>,
      options: ['\\cos(3x)', '3\\cos(3x)', '-3\\cos(3x)', '\\sin(3x)'],
      correct: 1,
      explanation: 'قاعدة التركيب: مشتقة $\\sin$ هي $\\cos(3x)$ مضروبة في مشتقة الداخل وهي 3، إذن $3\\cos(3x)$',
    },
  },
  {
    kind: 'mcq',
    data: {
      question: <>ما هي مشتقة <K tex="f(x)=\\frac{1}{e^{x}}" />؟</>,
      options: ['-e^{-x}', 'e^{-x}', '-\\frac{1}{e^{x}}', '\\frac{1}{xe^{x-1}}'],
      correct: 0,
      explanation: 'اكتبها $e^{-x}$، مشتقتها $-e^{-x}$ (قاعدة التركيب بمشتقة الداخل وهي $-1$)',
    },
  },

  /* ── النظام 2: ترتيب القاعدة (3) ────────────────────────────── */
  {
    kind: 'rule',
    data: {
      instruction: 'رتّب المكوّنات لتكوين قاعدة الجداء',
      answerLabel: "(u\\cdot v)'=",
      pieces: ["u'", '\\cdot v', '+', 'u', "\\cdot v'"],
      correctOrder: ["u'", '\\cdot v', '+', 'u', "\\cdot v'"],
      note: 'قاعدة الجداء: مشتقة الأول × الثاني + الأول × مشتقة الثاني',
    },
  },
  {
    kind: 'rule',
    data: {
      instruction: 'رتّب المكوّنات لتكوين قاعدة الخارج',
      answerLabel: "(u/v)'=",
      pieces: ["u'", '\\cdot v', '-', 'u', "\\cdot v'", '/v^{2}'],
      correctOrder: ["u'", '\\cdot v', '-', 'u', "\\cdot v'", '/v^{2}'],
      note: 'قاعدة الخارج: (مشتقة البسط × المقام - البسط × مشتقة المقام) على مربع المقام',
    },
  },
  {
    kind: 'rule',
    data: {
      instruction: 'رتّب المكوّنات لتكوين قاعدة التركيب (السلسلة)',
      answerLabel: "(f(g(x)))'=",
      pieces: ["f'(g(x))", '\\cdot', "g'(x)"],
      correctOrder: ["f'(g(x))", '\\cdot', "g'(x)"],
      note: 'قاعدة التركيب: مشتقة الدالة الخارجية × مشتقة الدالة الداخلية',
    },
  },

  /* ── النظام 3: ملء الفراغ (7 فراغات من نص واحد) ─────────────── */
  {
    kind: 'fill',
    data: {
      before: <>لتكن <K tex="u" /> و <K tex="v" /> دالتين قابلتين للاشتقاق. لحساب مشتقة مجموعهما نستخدم القاعدة: <K tex="(u+v)'=" /></>,
      choices: ["u'+v'", "u'\\cdot v'", "u'-v'", "(u+v)'"],
      correct: "u'+v'",
      explanation: 'قاعدة المجموع: $(u+v)\'=u\'+v\'$، نشتق كل حد على حدة',
    },
  },
  {
    kind: 'fill',
    data: {
      before: <>أما إذا كان لدينا جداء دالتين، فالقاعدة هي: <K tex="(u\\cdot v)'=" /></>,
      after: <>ويجب الحذر من نسيان الحد الثاني.</>,
      choices: ["u'\\cdot v'", "u'\\cdot v+u\\cdot v'", "u'\\cdot v-u\\cdot v'", 'u\\cdot v'],
      correct: "u'\\cdot v+u\\cdot v'",
      explanation: 'قاعدة الجداء: $(u\\cdot v)\'=u\'\\cdot v+u\\cdot v\'$',
    },
  },
  {
    kind: 'fill',
    data: {
      before: <>في حالة القسمة <K tex="(u/v)" />، تكون المشتقة عبارة عن</>,
      after: <>على مربع المقام.</>,
      choices: ["u'\\cdot v-u\\cdot v'", "u'\\cdot v+u\\cdot v'", "u\\cdot v'-u'\\cdot v", "u'/v'"],
      correct: "u'\\cdot v-u\\cdot v'",
      explanation: 'قاعدة الخارج: $(u/v)\'=\\frac{u\'v-uv\'}{v^{2}}$',
    },
  },
  {
    kind: 'fill',
    data: {
      before: <>مع الانتباه إلى وجود إشارة</>,
      after: <>بين البسطين.</>,
      choices: ['الجمع (+)', 'الطرح (-)', 'الضرب (×)', 'القسمة (/)'],
      correct: 'الطرح (-)',
      explanation: 'في قاعدة الخارج تكون الإشارة بين $u\'v$ و $uv\'$ هي الطرح $-$',
    },
  },
  {
    kind: 'fill',
    data: {
      before: <>أخطر قاعدة يخطئ فيها التلاميذ هي قاعدة</>,
      after: <>حيث يجب ضرب مشتقة الدالة الخارجية في مشتقة الدالة الداخلية.</>,
      choices: ['المجموع', 'الجداء', 'التركيب (أو السلسلة)', 'الخارج'],
      correct: 'التركيب (أو السلسلة)',
      explanation: 'قاعدة التركيب هي الأكثر خطأً، ويجب فيها ضرب مشتقة الخارج في مشتقة الداخل',
    },
  },
  {
    kind: 'fill',
    data: {
      before: <>فمثلاً مشتقة <K tex="\\ln(2x)" /> تساوي</>,
      after: <>وليس <K tex="\\frac{1}{2x}" />.</>,
      choices: ['\\frac{1}{2x}', '\\frac{2}{2x}', '\\ln(2)', '2x'],
      correct: '\\frac{2}{2x}',
      explanation: 'قاعدة التركيب: مشتقة $\\ln(2x)=\\frac{1}{2x}\\times 2=\\frac{2}{2x}=\\frac{1}{x}$',
    },
  },
  {
    kind: 'fill',
    data: {
      before: <>أخيراً، مشتقة <K tex="e^{3x}" /> باستخدام قاعدة التركيب تساوي</>,
      choices: ['e^{3x}', '3e^{3x}', '3xe^{3x-1}', 'e^{3}'],
      correct: '3e^{3x}',
      explanation: 'قاعدة التركيب: مشتقة $e^{3x}=e^{3x}\\times 3=3e^{3x}$',
    },
  },

  /* ── النظام 4: صحيح أو خطأ (11) ─────────────────────────────── */
  {
    kind: 'truefalse',
    data: {
      statement: <><K tex="(u+v)'=u'+v'" /> صحيحة دائماً إذا كانت <K tex="u" /> و <K tex="v" /> قابلتين للاشتقاق.</>,
      isTrue: true,
      explanation: 'صحيح: هذه قاعدة المجموع، وتُطبق عندما تكون u و v قابلتين للاشتقاق',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <><K tex="(u\\cdot v)'=u'\\cdot v'" /></>,
      isTrue: false,
      explanation: 'خطأ: الصحيح هو $(u\\cdot v)\'=u\'\\cdot v+u\\cdot v\'$ (قاعدة الجداء)',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <>مشتقة <K tex="\\frac{1}{v}" /> هي <K tex="-\\frac{v'}{v^{2}}" /></>,
      isTrue: true,
      explanation: 'صحيح: حالة خاصة من قاعدة الخارج عندما $u=1$، إذن $u\'=0$، فتصبح المشتقة $-\\frac{v\'}{v^{2}}$',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <>مشتقة <K tex="e^{\\sin(x)}" /> هي <K tex="e^{\\sin(x)}" /></>,
      isTrue: false,
      explanation: 'خطأ: بتطبيق قاعدة التركيب، مشتقتها هي $\\cos(x)\\times e^{\\sin(x)}$',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <>في قاعدة القسمة <K tex="(u/v)'" />، البسط هو <K tex="u'v+uv'" /></>,
      isTrue: false,
      explanation: 'خطأ: البسط هو $u\'v-uv\'$ (إشارة ناقص، وليس جمع)',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <>مشتقة <K tex="(2x+1)^{2}" /> هي <K tex="2(2x+1)" /></>,
      isTrue: false,
      explanation: 'خطأ: باستخدام قاعدة التركيب (مشتقة الخارج × مشتقة الداخل): $2(2x+1)\\times 2=4(2x+1)$',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <>مشتقة الدالة <K tex="f(x)=x\\cdot \\ln(x)" /> هي <K tex="\\ln(x)+1" /></>,
      isTrue: true,
      explanation: 'صحيح: $1\\times \\ln(x)+x\\times \\frac{1}{x}=\\ln(x)+1$',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <>مشتقة <K tex="3x^{2}" /> هي <K tex="6x^{2}" /></>,
      isTrue: false,
      explanation: 'خطأ: مشتقة $3x^{2}$ هي $3\\times 2x=6x$ (نقص الأس بمقدار 1)',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <>مشتقة <K tex="\\cos(2x)" /> هي <K tex="-\\sin(2x)" /></>,
      isTrue: false,
      explanation: 'خطأ: مشتقة $\\cos(2x)=-\\sin(2x)\\times 2=-2\\sin(2x)$ (نسينا مشتقة الداخل)',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <>إذا كانت <K tex="f(x)=g(x)\\cdot h(x)" />، فإن <K tex="f'(a)" /> تعتمد على <K tex="g'(a)" /> و <K tex="h'(a)" /> وقيم الدوال عند <K tex="a" />.</>,
      isTrue: true,
      explanation: 'صحيح: $f\'(a)=g\'(a)h(a)+g(a)h\'(a)$',
    },
  },
  {
    kind: 'truefalse',
    data: {
      statement: <>قاعدة التركيب تنطبق فقط على الدوال الأسية، وليس على الدوال المثلثية.</>,
      isTrue: false,
      explanation: 'خطأ: قاعدة التركيب تنطبق على جميع أنواع الدوال (أسية، مثلثية، لوغاريتمية، حدودية) طالما كانت مركبة',
    },
  },

  /* ── النظام 5: بطاقات الترتيب (1) ───────────────────────────── */
  {
    kind: 'sort',
    data: {
      instruction: 'لدينا الدالة $f(x)=e^{x}\\cdot \\sin(2x)$. رتّب الخطوات التالية لحساب مشتقتها',
      hint: 'ابدأ بتحديد شكل الدالة، ثم مشتقة كل جزء، ثم طبّق القاعدة',
      cards: [
        'نحدد أن الدالة على شكل جداء (u × v)، حيث u = e^x و v = sin(2x).',
        'نحسب مشتقة u: u\' = e^x.',
        'لحساب مشتقة v، نلاحظ أنها مركبة: الخارج sin() والداخل 2x.',
        'نحسب v\' = cos(2x) × 2 = 2cos(2x).',
        'نطبق قاعدة الجداء: f\' = u\' × v + u × v\'.',
        'نعوض: f\' = e^x × sin(2x) + e^x × 2cos(2x).',
        'نبسط بإخراج العامل المشترك (اختياري): f\' = e^x [sin(2x) + 2cos(2x)].',
      ],
      correctOrder: [
        'نحدد أن الدالة على شكل جداء (u × v)، حيث u = e^x و v = sin(2x).',
        'نحسب مشتقة u: u\' = e^x.',
        'لحساب مشتقة v، نلاحظ أنها مركبة: الخارج sin() والداخل 2x.',
        'نحسب v\' = cos(2x) × 2 = 2cos(2x).',
        'نطبق قاعدة الجداء: f\' = u\' × v + u × v\'.',
        'نعوض: f\' = e^x × sin(2x) + e^x × 2cos(2x).',
        'نبسط بإخراج العامل المشترك (اختياري): f\' = e^x [sin(2x) + 2cos(2x)].',
      ],
      relation: 'تسلسل خطوات',
    },
  },
];
