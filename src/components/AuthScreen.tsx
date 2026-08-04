import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasarMark } from './OnboardingScreen';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from './icons';
import { signIn, signUp, signInWithGoogle } from '@/lib/auth-client';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';

const NAME_MAX_LENGTH = 20;
const NAME_PATTERN = /^[\p{L}\p{M}]+(?:\s+[\p{L}\p{M}]+)*$/u;

export function AuthScreen({ defaultTab = 'login', onAuthSuccess }: { defaultTab?: 'login' | 'signup'; onAuthSuccess?: () => void }) {
  const [isLogin, setIsLogin] = useState(defaultTab === 'login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const nameTouchedRef = useRef(false);

  const googleStatus = useQuery(api.auth.getGoogleStatus);

  const validateName = (value: string): string => {
    const t = value.trim();
    if (!t) return 'يرجى إدخال اسمك';
    if (t.length > NAME_MAX_LENGTH) return `الاسم يجب ألا يتجاوز ${NAME_MAX_LENGTH} حرفاً`;
    if (!NAME_PATTERN.test(t)) return 'الاسم يجب أن يحتوي على حروف فقط (بدون أرقام أو رموز)';
    return '';
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);
    if (res.error) setError(res.error);
  };

  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollFocusedIntoView = useCallback(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || !scrollRef.current) return;
    requestAnimationFrame(() => {
      const container = scrollRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - containerRect.top + container.scrollTop;
      const targetY = relativeTop - containerRect.height * 0.3;
      container.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const gap = window.innerHeight - vv.height;
      if (gap > 100) {
        scrollFocusedIntoView();
      }
    };

    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, [scrollFocusedIntoView]);

  const handleInputFocus = useCallback(() => {
    setTimeout(scrollFocusedIntoView, 300);
  }, [scrollFocusedIntoView]);

  useEffect(() => {
    if (defaultTab === 'signup') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
    setError('');
    setNameError('');
    nameTouchedRef.current = false;
  }, [defaultTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('صيغة البريد الإلكتروني غير صحيحة');
      return;
    }

    if (!password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (!isLogin) {
      nameTouchedRef.current = true;
      const nameMsg = validateName(name);
      setNameError(nameMsg);
      if (nameMsg) return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const result = await signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
          setLoading(false);
          return;
        }
        onAuthSuccess?.();
      } else {
        const result = await signUp.email({ email, password, name });
        if (result.error) {
          setError(result.error.message || 'حدث خطأ أثناء إنشاء الحساب');
          setLoading(false);
          return;
        }
        onAuthSuccess?.();
      }
    } catch (err: any) {
      setError(err?.message?.includes('fetch')
        ? 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت'
        : (err.message || 'حدث خطأ غير متوقع'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 overflow-y-auto overscroll-none bg-[radial-gradient(circle_at_30%_20%,hsl(var(--sprout-soft)),transparent_45%),radial-gradient(circle_at_80%_75%,hsl(var(--ember-soft)),transparent_40%)]"
    >
      <div className="min-h-full flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {/* Brand */}
          <div className="flex flex-col items-center gap-2 mb-8 justify-center">
            <MasarMark size={48} />
            <span className="text-3xl font-bold tracking-tight text-[hsl(var(--ink))]">مسار</span>
            <p className="text-sm text-muted-foreground mt-2 text-center leading-relaxed">
              منصة تعليمية تفاعلية للبكالوريا
            </p>
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-border pb-0">
              <button
                className={`pb-3 text-sm font-bold transition-all duration-200 ${
                  isLogin
                    ? 'text-[hsl(var(--ink))] border-b-2 border-[hsl(var(--sprout))]'
                    : 'text-muted-foreground hover:text-[hsl(var(--ink))]'
                }`}
                onClick={() => { setIsLogin(true); setError(''); setNameError(''); nameTouchedRef.current = false; }}
              >
                تسجيل الدخول
              </button>
              <button
                className={`pb-3 text-sm font-bold transition-all duration-200 ${
                  !isLogin
                    ? 'text-[hsl(var(--ink))] border-b-2 border-[hsl(var(--sprout))]'
                    : 'text-muted-foreground hover:text-[hsl(var(--ink))]'
                }`}
                onClick={() => { setIsLogin(false); setError(''); setNameError(''); nameTouchedRef.current = false; }}
              >
                حساب جديد
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name (signup only) */}
              {!isLogin && (
                <div className="animate-[pop-in_0.2s_ease-out]">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الاسم الكامل</label>
                  <div className="relative">
                    <Input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameTouchedRef.current) setNameError(validateName(e.target.value));
                      }}
                      placeholder="مثال: أمين"
                      className="h-11 text-right pr-10"
                      onFocus={handleInputFocus}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" />
                      </svg>
                    </span>
                  </div>
                  {nameError && (
                    <p className="text-[11px] font-medium text-[hsl(var(--coral))] mt-1.5">{nameError}</p>
                  )}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">البريد الإلكتروني</label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="h-11 text-right pr-10"
                    dir="ltr"
                    autoComplete="email"
                    onFocus={handleInputFocus}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <MailIcon size={16} />
                  </span>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">كلمة المرور</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 text-right pr-10 pl-10"
                    dir="ltr"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    onFocus={handleInputFocus}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <LockIcon size={16} />
                  </span>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[hsl(var(--ink))] transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="text-[11px] font-medium text-[hsl(var(--coral))] bg-[hsl(var(--coral))]/10 p-2.5 rounded-md flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 bg-[hsl(var(--ink-solid))] hover:bg-[hsl(var(--ink-solid))]/90 text-white font-bold mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    جاري المعالجة...
                  </span>
                ) : (
                  isLogin ? 'تسجيل الدخول' : 'إنشاء حسابي والانطلاق'
                )}
              </Button>
            </form>

            {/* Google OAuth */}
            {googleStatus?.enabled && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] text-muted-foreground">أو</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 font-semibold gap-2"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isLogin ? 'الدخول عبر Google' : 'التسجيل عبر Google'}
                </Button>
              </>
            )}
          </div>

          {/* Footer */}
          <p className="text-[10px] text-muted-foreground text-center mt-5 leading-relaxed">
            مشاركتك تعني الموافقة على{' '}
            <span className="text-[hsl(var(--ink))] font-medium cursor-default">شروط الاستخدام</span>
            {' '}و{' '}
            <span className="text-[hsl(var(--ink))] font-medium cursor-default">سياسة الخصوصية</span>
          </p>
        </div>
      </div>
    </div>
  );
}
