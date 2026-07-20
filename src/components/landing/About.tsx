import { ScrollReveal } from './ScrollReveal';
import { BookIcon, ChartIcon, TrophyIcon } from '@/components/icons';

const POINTS = [
  {
    Icon: BookIcon,
    title: 'تدريب يومي',
    desc: 'تمارين متنوعة مقسمة على الأسابيع والدروس بمستويات صعوبة مختلفة — لا تكرار، لا ملل.',
    gradient: 'from-[hsl(var(--sprout-soft))] to-[hsl(var(--paper-warm))]',
    iconBg: 'bg-[hsl(var(--sprout-soft))] text-[hsl(var(--sprout))]',
    border: 'hover:border-[hsl(var(--sprout))]/30',
  },
  {
    Icon: ChartIcon,
    title: 'تتبع تقدّمك',
    desc: 'رسوم بيانية وإحصائيات تفصيلية تُظهر تطورك يوماً بعد يوم في كل مادة.',
    gradient: 'from-[hsl(var(--ember-soft))] to-[hsl(var(--paper-warm))]',
    iconBg: 'bg-[hsl(var(--ember-soft))] text-[hsl(var(--ember))]',
    border: 'hover:border-[hsl(var(--ember))]/30',
  },
  {
    Icon: TrophyIcon,
    title: 'منافسة مع الزملاء',
    desc: 'لوحة متصدرين حية ودوريات تنافسية تجعل المراجعة أقرب للمرح.',
    gradient: 'from-[hsl(var(--chart-1))]/8 to-[hsl(var(--paper-warm))]',
    iconBg: 'bg-[hsl(var(--chart-1))]/10 text-[hsl(var(--chart-1))]',
    border: 'hover:border-[hsl(var(--chart-1))]/30',
  },
];

export function About() {
  return (
    <section className="relative py-20 px-6">
      {/* Subtle top divider gradient */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-4xl mx-auto space-y-12">
        <ScrollReveal>
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[hsl(var(--ink))]">
              ما هو مسار؟
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              مسار يحوّل مراجعة البكالوريا العلمية من عبء إلى روتين مشوّق يعتمد على التدريب العملي، متابعة التقدّم، والمنافسة الصحية مع الزملاء.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {POINTS.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 120}>
              <div className={`rounded-2xl border border-border bg-gradient-to-b ${p.gradient} p-6 text-center space-y-4 shadow-sm hover:shadow-md transition-all ${p.border}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${p.iconBg}`}>
                  <p.Icon size={24} />
                </div>
                <h3 className="text-base font-bold text-[hsl(var(--ink))]">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
