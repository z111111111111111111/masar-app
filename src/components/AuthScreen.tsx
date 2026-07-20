import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasarMark } from './OnboardingScreen';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from './icons';
import { signIn, signUp } from '@/lib/auth-client';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    if (!isLogin && !name.trim()) {
      setError('يرجى إدخال اسمك');
      return;
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
      } else {
        const result = await signUp.email({ email, password, name });
        if (result.error) {
          setError(result.error.message || 'حدث خطأ أثناء إنشاء الحساب');
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--sprout-soft)),transparent_45%),radial-gradient(circle_at_80%_75%,hsl(var(--ember-soft)),transparent_40%)]">
      <div className="w-full max-w-sm">
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
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              تسجيل الدخول
            </button>
            <button
              className={`pb-3 text-sm font-bold transition-all duration-200 ${
                !isLogin
                  ? 'text-[hsl(var(--ink))] border-b-2 border-[hsl(var(--sprout))]'
                  : 'text-muted-foreground hover:text-[hsl(var(--ink))]'
              }`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name (signup only) */}
            {!isLogin && (
              <div className="animate-[pop-in_0.2s_ease-out]">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الاسم الكامل</label>
                <div className="relative">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أمين"
                    className="h-11 text-right pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" />
                    </svg>
                  </span>
                </div>
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
  );
}
