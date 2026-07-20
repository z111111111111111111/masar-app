import { ScrollReveal } from './ScrollReveal';

const INCLUDES = [
  'الوصول لجميع المواد الخمس',
  'بنك تمارين كامل بـ 3 مستويات صعوبة',
  'تمارين عشوائية يومية',
  'المصحح الذكي بالذكاء الاصطناعي',
  'نظام مؤقت وتتبع كامل',
  'المشاركة في الدوريات ولوحة المتصدرين',
];

export function Pricing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative py-20 px-6">
      {/* Subtle divider */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-md mx-auto">
        <ScrollReveal>
          <div className="rounded-3xl border-2 border-[hsl(var(--sprout))]/40 bg-card shadow-lg shadow-[hsl(var(--sprout))]/5 overflow-hidden">
            {/* Gradient header */}
            <div className="bg-gradient-to-l from-[hsl(var(--sprout))] to-[hsl(var(--sprout))]/80 px-6 py-5 text-center">
              <p className="text-white text-sm font-bold">الاشتراك المميز</p>
            </div>
            <div className="px-6 py-8 text-center space-y-6">
              <div>
                <span className="text-4xl font-black text-[hsl(var(--ink))]">$15</span>
                <span className="text-sm text-muted-foreground mr-1">/ 3 أشهر كاملة</span>
              </div>
              <p className="text-xs text-muted-foreground">اشتراك واحد — كل ما تحتاجه في مسار</p>

              <div className="space-y-3 text-right">
                {INCLUDES.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-[hsl(var(--ink))]">
                    <span className="w-5 h-5 rounded-full bg-[hsl(var(--sprout))]/15 text-[hsl(var(--sprout))] flex items-center justify-center shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <button
                onClick={onGetStarted}
                className="w-full h-12 rounded-full bg-gradient-to-l from-[hsl(var(--sprout))] to-[hsl(var(--sprout))]/80 hover:from-[hsl(var(--sprout))]/90 hover:to-[hsl(var(--sprout))]/70 text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-[hsl(var(--sprout))]/20"
              >
                ابدأ رحلتك الآن
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
