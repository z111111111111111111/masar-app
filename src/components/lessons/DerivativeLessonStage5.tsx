import { DerivativeLesson } from './DerivativeLesson';
import { KaTeXBlock } from '@/components/landing/MathText';
import { DERIVATIVE_FLOW_STAGE5, DERIVATIVE_FLOW_ID_5, STAGE5_MAX_ITEMS } from './DerivativeFlowStage5';

export function DerivativeLessonStage5({
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
      flowId={DERIVATIVE_FLOW_ID_5}
      flow={DERIVATIVE_FLOW_STAGE5}
      sessionSize={STAGE5_MAX_ITEMS}
      intro={{
        title: 'دراسة تغيرات دالة — جدول التغيرات',
        subtitle: 'الدرس الخامس — الرياضيات',
        description: 'تُعاد الأخطاء حتى تصحّحها كلها.',
        body: <Stage5IntroBody />,
      }}
    />
  );
}

/* ─── المرحلة الخامسة: دراسة تغيرات دالة بإشارة المشتقة ───────── */
const GOLDEN_RULES = [
  {
    sign: '+',
    tex: "f'(x)>0",
    label: 'موجبة',
    result: 'متزايدة ↗',
    hint: 'إذا كانت المشتقة موجبة على مجال، فإن الدالة ترتفع (متزايدة) على ذلك المجال.',
  },
  {
    sign: '−',
    tex: "f'(x)<0",
    label: 'سالبة',
    result: 'متناقصة ↘',
    hint: 'إذا كانت المشتقة سالبة على مجال، فإن الدالة تنخفض (متناقصة) على ذلك المجال.',
  },
  {
    sign: '0',
    tex: "f'(x)=0",
    label: 'معدومة',
    result: 'قيمة قصوى محتملة',
    hint: 'عند نقطة انعدام المشتقة مع تغير الإشارة، تمر الدالة بقيمة عظمى أو صغرى محلية.',
  },
];

function Stage5IntroBody() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-bold text-[hsl(var(--ink))]">القاعدة الذهبية لجدول التغيرات</h2>
        <p className="text-sm leading-relaxed text-[hsl(var(--ink))]">
          <span className="font-semibold text-[hsl(var(--chart-1))]">الرتابة</span> تخبرنا هل الدالة
          <span className="font-semibold"> متزايدة</span> (ترتفع) أم <span className="font-semibold">متناقصة</span> (تنخفض)
          عندما نتحرك على محور السينات — وإشارة المشتقة <span className="font-semibold border-b-2 border-dashed border-[hsl(var(--chart-1))]/60 cursor-pointer">هي المفتاح</span> لذلك.
        </p>
        <div className="space-y-2">
          {GOLDEN_RULES.map((rule) => (
            <div
              key={rule.sign}
              className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3"
            >
              <div dir="ltr" className="shrink-0">
                <KaTeXBlock tex={rule.tex} className="text-[hsl(var(--sprout))] text-sm font-semibold" />
              </div>
              <p className="text-xs text-muted-foreground text-center leading-snug">{rule.hint}</p>
              <span className="shrink-0 text-sm font-bold text-[hsl(var(--ink))]">{rule.result}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <h2 className="text-base font-bold text-[hsl(var(--ink))]">مكونات جدول التغيرات</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          يتكون جدول التغيرات من <span className="font-semibold text-[hsl(var(--ink))]">ثلاثة أسطر أساسية</span>:
        </p>
        <ol className="text-sm list-decimal pr-5 space-y-1 text-muted-foreground">
          <li>سطر <span dir="ltr">x</span> (قيم المجال والنقاط الحرجة) — في الأعلى.</li>
          <li>سطر <span dir="ltr">f&apos;(x)</span> (الإشارة: + أو − أو 0) — في المنتصف.</li>
          <li>سطر <span dir="ltr">f</span> (الأسهم المتجهة لأعلى أو لأسفل) — في الأسفل.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <h2 className="text-base font-bold text-[hsl(var(--ink))]">نصيحة قبل البدء</h2>
        <ul className="text-sm text-muted-foreground list-disc pr-5 space-y-1">
          <li>لا تخلط بين إشارة <span dir="ltr">f</span> وإشارة <span dir="ltr">f&apos;</span>: الأولى قيمة الدالة، والثانية اتجاه تغيرها.</li>
          <li>انعدام المشتقة لا يعني بالضرورة قيمة قصوى — يجب أن تتغير الإشارة حول النقطة.</li>
          <li>الخطأ الشائع: حساب مشتقة صحيحة ثم نسيان دراسة إشارتها بشكل صحيح.</li>
        </ul>
      </div>
    </div>
  );
}
