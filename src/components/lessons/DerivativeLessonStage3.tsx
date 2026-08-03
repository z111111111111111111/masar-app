import { DerivativeLesson } from './DerivativeLesson';
import { KaTeXBlock } from '@/components/landing/MathText';
import { DERIVATIVE_FLOW_STAGE3, DERIVATIVE_FLOW_ID_3, STAGE3_MAX_ITEMS } from './DerivativeFlowStage3';

export function DerivativeLessonStage3({
  onBack,
  onStageComplete,
}: {
  onBack: () => void;
  onStageComplete?: (passed: boolean) => void;
}) {
  return (
    <DerivativeLesson
      onBack={onBack}
      onStageComplete={onStageComplete}
      flowId={DERIVATIVE_FLOW_ID_3}
      flow={DERIVATIVE_FLOW_STAGE3}
      sessionSize={STAGE3_MAX_ITEMS}
      intro={{
        title: 'قواعد الاشتقاق',
        subtitle: 'الدرس الثالث — الرياضيات',
        description: 'في كل جلسة يُختار 13 تمريناً عشوائياً من البنك — بعد انتهاء التمارين تظهر صفحة النتائج (المدة، الصحيحة، الخاطئة)، وإن أخطأت في أي تمرين فستُعرض لك إجابتك الصحيحة، وتُعاد الأخطاء فقط حتى تصحّحها كلها.',
        body: <Stage3IntroBody />,
      }}
    />
  );
}

/* ─── المرحلة الثالثة: قواعد الاشتقاق (بدون فيديو) ─────────────── */
const RULES = [
  { name: 'قاعدة المجموع', tex: "(u+v)'=u'+v'" },
  { name: 'قاعدة الجداء', tex: "(u\\cdot v)'=u'\\cdot v+u\\cdot v'" },
  { name: 'قاعدة الخارج', tex: "(u/v)'=\\frac{u'\\cdot v-u\\cdot v'}{v^{2}}" },
  { name: 'قاعدة التركيب', tex: "(f(g(x)))'=f'(g(x))\\cdot g'(x)" },
];

function Stage3IntroBody() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-bold text-[hsl(var(--ink))]">القواعد الأربع الأساسية</h2>
        <p className="text-sm leading-relaxed text-[hsl(var(--ink))]">
          بعد أن أتقنا مفهوم المشتقة في الدرس الثاني، سنستعمل اليوم أربع قواعد تجعل حساب المشتقات سريعاً،
          مع <span className="font-semibold border-b-2 border-dashed border-[hsl(var(--chart-1))]/60 cursor-pointer">الانتباه الدائم للدوال المركّبة</span>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RULES.map((rule) => (
            <div key={rule.name} className="rounded-xl bg-muted/50 p-4 space-y-2 text-center">
              <p className="text-xs font-bold text-[hsl(var(--muted-foreground))]">{rule.name}</p>
              <div dir="ltr">
                <KaTeXBlock tex={rule.tex} className="text-[hsl(var(--sprout))] text-base" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <h2 className="text-base font-bold text-[hsl(var(--ink))]">نصيحة قبل البدء</h2>
        <ul className="text-sm text-muted-foreground list-disc pr-5 space-y-1">
          <li>الخطأ الشائع: نسيان الحد الثاني في قاعدة الجداء.</li>
          <li>في قاعدة الخارج الإشارة بين البسطين هي ناقص، والمقام مربّع.</li>
          <li>في قاعدة التركيب لا ننسَ ضرب مشتقة الدالة الخارجية في مشتقة الدالة الداخلية.</li>
        </ul>
      </div>
    </div>
  );
}
