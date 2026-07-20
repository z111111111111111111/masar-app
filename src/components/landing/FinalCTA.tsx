import { MasarMark } from '@/components/OnboardingScreen';
import { ScrollReveal } from './ScrollReveal';

export function FinalCTA({
  onGetStarted,
  onLogin,
}: {
  onGetStarted: () => void;
  onLogin: () => void;
}) {
  return (
    <>
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Subtle divider */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="max-w-xl mx-auto text-center space-y-8">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[hsl(var(--ink))] leading-snug">
              جاهز تبدأ مراجعتك بطريقة مختلفة؟
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="text-sm text-muted-foreground">
              سجّل الآن وابدأ رحلتك نحو البكالوريا مع مسار — كل يوم تقترب من هدفك.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className="h-12 px-7 rounded-full bg-[hsl(var(--ink-solid))] hover:bg-[hsl(var(--ink-solid))]/90 text-white text-sm font-bold transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                إنشاء حساب جديد
              </button>
              <button
                onClick={onLogin}
                className="h-12 px-7 rounded-full border border-border bg-card hover:bg-muted/40 text-sm font-bold text-[hsl(var(--ink))] transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                تسجيل الدخول
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border bg-gradient-to-b from-card to-[hsl(var(--paper-warm))] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <MasarMark size={24} />
            <span className="text-sm font-bold text-[hsl(var(--ink))]">مسار</span>
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span className="cursor-default hover:text-[hsl(var(--ink))] transition-colors">الشروط</span>
            <span className="cursor-default hover:text-[hsl(var(--ink))] transition-colors">الخصوصية</span>
            <span className="cursor-default hover:text-[hsl(var(--ink))] transition-colors">تواصل معنا</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} مسار — جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </>
  );
}
