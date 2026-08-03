import { DerivativeLesson } from './DerivativeLesson';
import { KaTeXBlock } from '@/components/landing/MathText';
import { DERIVATIVE_FLOW_STAGE2, DERIVATIVE_FLOW_ID_2, STAGE2_MAX_ITEMS } from './DerivativeFlowStage2';

export function DerivativeLessonStage2({
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
      flowId={DERIVATIVE_FLOW_ID_2}
      flow={DERIVATIVE_FLOW_STAGE2}
      sessionSize={STAGE2_MAX_ITEMS}
      intro={{
        title: 'مفهوم الاشتقاقية عند نقطة',
        subtitle: 'الدرس الثاني — الرياضيات',
        description: 'في كل جلسة يُختار 13 تمريناً عشوائياً من البنك — بعد انتهاء التمارين تظهر صفحة النتائج (المدة، الصحيحة، الخاطئة)، وإن أخطأت في أي تمرين فستُعرض لك إجابتك الصحيحة، وتُعاد الأخطاء فقط حتى تصحّحها كلها.',
        body: <Stage2IntroBody />,
      }}
    />
  );
}

/* ─── المرحلة الثانية: تعريف المشتقة عند نقطة + معادلة المماس (بدون فيديو) ─── */
function Stage2IntroBody() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-base font-bold text-[hsl(var(--ink))]">التعريف الأساسي</h2>
        <p className="text-sm leading-relaxed text-[hsl(var(--ink))]">
          <span className="font-bold border-b-2 border-dashed border-[hsl(var(--chart-1))]/60 cursor-pointer">
            المشتقة عند النقطة a
          </span>
          {' '}هي نهاية معدل التغيّر للدالة، وتُعطى بالصيغتين المكافئتين:
        </p>
        <div className="space-y-3">
          <div className="rounded-xl bg-muted/50 p-4 text-center" dir="ltr">
            <KaTeXBlock tex="f'(a)=\lim_{h\to 0}\frac{f(a+h)-f(a)}{h}" className="text-[hsl(var(--ink))] text-lg" />
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-center" dir="ltr">
            <KaTeXBlock tex="f'(a)=\lim_{x\to a}\frac{f(x)-f(a)}{x-a}" className="text-[hsl(var(--ink))] text-lg" />
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[hsl(var(--ink))]">
          هندسياً: <span className="font-semibold">ميل المماس</span> للمنحنى عند النقطة a.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-bold text-[hsl(var(--ink))]">معادلة المماس</h2>
        <p className="text-sm text-muted-foreground">معادلة المماس للمنحنى عند النقطة a تُكتب:</p>
        <div className="rounded-xl bg-muted/50 p-4 text-center" dir="ltr">
          <KaTeXBlock tex="y=f'(a)(x-a)+f(a)" className="text-[hsl(var(--sprout))] text-lg" />
        </div>
      </div>
    </div>
  );
}
