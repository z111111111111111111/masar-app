import { ScrollReveal } from './ScrollReveal';
import { BookIcon, ClockIcon, ChartIcon, TrophyIcon, FlameIcon, UserIcon } from '@/components/icons';

const FEATURES = [
  {
    Icon: BookIcon,
    title: 'نظام تعليمي متكامل',
    color: 'sprout',
    gradient: 'from-[hsl(var(--sprout-soft))]/40 to-transparent',
    items: [
      '5 مواد بكالوريا: رياضيات، فيزياء، علوم، فلسفة، اجتماعيات',
      'بنك تمارين ضخم مقسّم على الأسابيع بـ 3 مستويات صعوبة',
      'تمرين عشوائي يومي لتنويع المراجعة',
      'مصحح ذكي بالذكاء الاصطناعي يراجع حلولك',
    ],
  },
  {
    Icon: ClockIcon,
    title: 'نظام المؤقت الذكي',
    color: 'ember',
    gradient: 'from-[hsl(var(--ember-soft))]/40 to-transparent',
    items: [
      'مؤقت مستقل لكل مادة',
      'تشغيل / إيقاف / استئناف كامل',
      'حظر ذكي يمنع تبديل المادة أثناء التمرين',
      'تقييم صعوبة التمرين من 1 إلى 5',
    ],
  },
  {
    Icon: ChartIcon,
    title: 'إحصائيات ورسوم بيانية',
    color: 'sprout',
    gradient: 'from-[hsl(var(--chart-1))]/6 to-transparent',
    items: [
      'XP الإجمالية، السلسلة، أفضل سلسلة، أيام نشطة',
      'منحنى أداء لكل مادة عبر الزمن',
      'أشرطة تقدّم بألوان مميزة',
      'شريط آخر 7 أيام وتقويم شهري',
    ],
  },
  {
    Icon: TrophyIcon,
    title: 'نظام الدوري والمنافسة',
    color: 'ember',
    gradient: 'from-[hsl(var(--ember-soft))]/40 to-transparent',
    items: [
      '4 دوريات: برونزي / فضي / ذهبي / ماسي',
      'لوحة متصدرين حية',
      'شريط تقدّم نحو الدوري التالي',
      'كل تمرين = النقاط × 10 XP',
    ],
  },
  {
    Icon: FlameIcon,
    title: 'نظام السلسلة (Streak)',
    color: 'coral',
    gradient: 'from-[hsl(var(--coral))]/5 to-transparent',
    items: [
      'سلسلة يومية تُبنى بحل تمرين واحد على الأقل',
      'تتبع أفضل سلسلة عبر الزمن',
      'تحفيز مستمر يمنع التوقف عن المراجعة',
    ],
  },
  {
    Icon: UserIcon,
    title: 'الحساب الشخصي والخصوصية',
    color: 'sprout',
    gradient: 'from-[hsl(var(--sprout-soft))]/40 to-transparent',
    items: [
      'بروفايل مفصّل بإحصائيات كاملة',
      'مشاركة اختيارية للحساب مع الآخرين',
      'حسابات خاصة لا تظهر إلا لصاحبها',
      'تصفح حسابات المستخدمين من لوحة المتصدرين',
    ],
  },
];

const TONE: Record<string, string> = {
  sprout: 'bg-[hsl(var(--sprout-soft))] text-[hsl(var(--sprout))]',
  ember: 'bg-[hsl(var(--ember-soft))] text-[hsl(var(--ember))]',
  coral: 'bg-[hsl(var(--coral))]/10 text-[hsl(var(--coral))]',
};

export function Features() {
  return (
    <section className="relative py-20 px-6">
      {/* Subtle divider */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-4xl mx-auto space-y-12">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[hsl(var(--ink))] text-center">
            لماذا مسار؟
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            كل ما تحتاجه لتجهيز البكالوريا العلمية في مكان واحد
          </p>
        </ScrollReveal>

        <div className="space-y-6">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 80}>
              <div
                className={`rounded-2xl border border-border bg-gradient-to-l ${f.gradient} bg-card p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow ${
                  i % 2 === 0 ? 'md:flex md:items-start md:gap-8' : 'md:flex md:flex-row-reverse md:items-start md:gap-8'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mb-4 md:mb-0 ${TONE[f.color]}`}>
                  <f.Icon size={20} />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-base font-bold text-[hsl(var(--ink))]">{f.title}</h3>
                  <ul className="space-y-2">
                    {f.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                        <span className="text-[hsl(var(--sprout))] mt-0.5 shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
