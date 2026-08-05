import { useState } from 'react';
import { DerivativeLesson } from './DerivativeLesson';
import { KaTeXBlock } from '@/components/landing/MathText';
import { DERIVATIVE_FLOW_STAGE4, DERIVATIVE_FLOW_ID_4, STAGE4_MAX_ITEMS } from './DerivativeFlowStage4';

export function DerivativeLessonStage4({
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
      flowId={DERIVATIVE_FLOW_ID_4}
      flow={DERIVATIVE_FLOW_STAGE4}
      sessionSize={STAGE4_MAX_ITEMS}
      intro={{
        title: 'اشتقاق الدوال المركبة — قاعدة السلسلة',
        subtitle: 'الدرس الرابع — الرياضيات',
        description: 'تُعاد الأخطاء حتى تصحّحها كلها.',
        body: <Stage4IntroBody />,
      }}
    />
  );
}

/* ─── المرحلة الرابعة: قاعدة السلسلة (تمارين مركبة) ───────────── */
const CHAIN_RULES = [
  {
    name: 'الصيغة العامة',
    tex: "(f(g(x)))'=f'(g(x))\\cdot g'(x)",
    hint: 'مشتقة دالة داخل دالة = مشتقة الخارجية (مع إبقاء الداخل كما هو) × مشتقة الداخلية.',
  },
  {
    name: 'الأسية',
    tex: "(e^{u})'=e^{u}\\cdot u'",
    hint: 'الدالة الأسية تحافظ على نفسها، ثم تُضرب في مشتقة الأُس.',
  },
  {
    name: 'اللوغاريتم',
    tex: "(\\ln(u))'=\\frac{u'}{u}",
    hint: 'مشتقة اللوغاريتم = مشتقة الداخل مقسومة على الداخل.',
  },
  {
    name: 'الجيب والجيب التمام',
    tex: "(\\sin(u))'=\\cos(u)\\cdot u'\\ ,\\ (\\cos(u))'=-\\sin(u)\\cdot u'",
    hint: 'مشتقة الجيب = جيب تمام الداخل × مشتقة الداخل، ومشتقة جيب التمام سالبة.',
  },
];

function Stage4IntroBody() {
  const [openRule, setOpenRule] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-bold text-[hsl(var(--ink))]">متى نستعمل قاعدة السلسلة؟</h2>
        <p className="text-sm leading-relaxed text-[hsl(var(--ink))]">
          نستعمل قاعدة السلسلة كلما كانت الدالة <span className="font-semibold text-[hsl(var(--chart-1))]">مركّبة</span>،
          أي عندما نجد دالة «داخل» دالة أخرى. الخطوة الأولى دائماً هي
          <span className="font-semibold border-b-2 border-dashed border-[hsl(var(--chart-1))]/60 cursor-pointer"> تحديد الداخل والخارج</span>.
        </p>
        <div className="rounded-xl bg-muted/50 p-3 text-center" dir="ltr">
          <KaTeXBlock tex="(f(g(x)))'=f'(g(x))\cdot g'(x)" className="text-[hsl(var(--sprout))] text-lg font-semibold" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          نشتق <span className="text-[hsl(var(--sprout))]">الخارج</span> مع إبقاء الداخل كما هو،
          ثم نضرب في مشتقة <span className="text-[hsl(var(--chart-1))]">الداخل</span>. لا تنسَ الضرب في مشتقة الداخل — فهذا أكثر خطأ شائع.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-bold text-[hsl(var(--ink))]">صيغ تساعدك مع الدوال المركّبة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHAIN_RULES.map((rule) => {
            const open = openRule === rule.name;
            return (
              <button
                key={rule.name}
                type="button"
                onClick={() => setOpenRule(open ? null : rule.name)}
                className={`rounded-xl p-4 space-y-2 text-center transition-all active:scale-[0.98] ${
                  open
                    ? 'bg-[hsl(var(--sprout-soft))] ring-2 ring-[hsl(var(--sprout))]/40'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <p className="text-xs font-bold text-[hsl(var(--muted-foreground))]">{rule.name}</p>
                <div dir="ltr">
                  <KaTeXBlock tex={rule.tex} className="text-[hsl(var(--sprout))] text-base" />
                </div>
                {open && (
                  <div className="pt-2 border-t border-[hsl(var(--sprout))]/20 text-right animate-[fade-in_0.25s_ease-out]">
                    <p className="text-xs leading-relaxed text-[hsl(var(--ink))]">{rule.hint}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <h2 className="text-base font-bold text-[hsl(var(--ink))]">نصيحة قبل البدء</h2>
        <ul className="text-sm text-muted-foreground list-disc pr-5 space-y-1">
          <li>ابدأ كل تمرين بتحديد الدالة الخارجية والدالة الداخلية.</li>
          <li>اشتق من الخارج إلى الداخل، ولا تنسَ الضرب في مشتقة كل دالة داخلية.</li>
          <li>في التركيب الثلاثي نضرب ثلاث مشتقات: الخارج × الأوسط × الداخل.</li>
          <li>بسّط قبل الاشتقاق إن أمكن، مثل <span dir="ltr">{'e^{ln(x)}=x'}</span>.</li>
        </ul>
      </div>
    </div>
  );
}
