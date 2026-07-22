import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { processPayment, validateExpiry, validateCardNumber } from '@/lib/mockPayment';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { CreditCardIcon, ShieldIcon, ChevronIcon } from './icons';
import { useSession } from '@/lib/auth-client';

interface PaymentScreenProps {
  onCancel?: () => void;
}

function detectCardBrand(digits: string): string {
  if (digits.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  return '';
}

function CardBrandIcon({ brand }: { brand: string }) {
  if (brand === 'Visa') {
    return (
      <span className="text-[11px] font-black italic tracking-tight text-[#1a1f71]">VISA</span>
    );
  }
  if (brand === 'Mastercard') {
    return (
      <div className="relative w-[28px] h-[18px]">
        <div className="absolute left-0 top-0 w-[18px] h-[18px] rounded-full bg-[#eb001b] opacity-90" />
        <div className="absolute right-0 top-0 w-[18px] h-[18px] rounded-full bg-[#f79e1b] opacity-90" />
      </div>
    );
  }
  return <CreditCardIcon size={18} className="text-muted-foreground" />;
}

export function PaymentScreen({ onCancel }: PaymentScreenProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const activateSubscription = useMutation(api.subscription.activate);

  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const rawDigits = cardNumber.replace(/\s+/g, '');
  const cardBrand = detectCardBrand(rawDigits);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setExpiryDate(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateCardNumber(cardNumber)) {
      setError('رقم البطاقة غير صحيح (يجب أن يتكون من 16 رقماً).');
      return;
    }

    if (!validateExpiry(expiryDate)) {
      setError('تاريخ الانتهاء غير صحيح أو منتهي.');
      return;
    }

    if (cvv.length < 3) {
      setError('الرقم السري CVV غير صحيح.');
      return;
    }

    if (!cardName.trim()) {
      setError('يرجى إدخال اسم حامل البطاقة.');
      return;
    }

    setLoading(true);

    try {
      const result = await processPayment({
        cardNumber,
        expiryDate,
        cvv,
        name: cardName
      });

      if (result.success) {
        setTransactionId(result.transactionId || '');
        await activateSubscription();
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 2500);
      } else {
        setError(result.error || 'حدث خطأ أثناء معالجة الدفع.');
      }
    } catch {
      setError('فشل الاتصال ببوابة الدفع.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--sprout-soft)),transparent_45%),radial-gradient(circle_at_80%_75%,hsl(var(--ember-soft)),transparent_40%)]">
        <div className="w-full max-w-sm bg-card border border-[hsl(var(--sprout))]/30 rounded-2xl p-8 text-center shadow-lg animate-pop">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--sprout))] text-white flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-xl font-bold text-[hsl(var(--ink))] mb-2">تم الدفع بنجاح!</h2>
          <p className="text-sm text-muted-foreground mb-4">تم تفعيل اشتراكك للفصل الدراسي الكامل.</p>
          {transactionId && (
            <p className="text-[10px] text-muted-foreground font-mono mb-5">رقم المعاملة: {transactionId}</p>
          )}
          <div className="w-5 h-5 rounded-full border-2 border-[hsl(var(--ink))] border-t-transparent animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      {onCancel && (
        <button
          onClick={onCancel}
          className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--ink))] hover:bg-muted/60 transition-all active:scale-95 animate-[fade-in_0.2s_ease-out]"
          aria-label="الرجوع"
        >
          <ChevronIcon size={17} className="rotate-180" />
        </button>
      )}

      <div className="w-full max-w-md">

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden">
          {/* Test badge */}
          <div className="absolute top-0 right-0 bg-[hsl(var(--ember))] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
            بيئة تجريبية
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-8 mt-2">
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--ink))]">تفعيل الحساب</h1>
              <p className="text-xs text-muted-foreground mt-1">الاشتراك للفصل الدراسي (9 أشهر)</p>
            </div>
            <div className="text-2xl font-black text-[hsl(var(--ink))]">
              $15<span className="text-sm text-muted-foreground font-medium">.00</span>
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-2.5 bg-muted/50 rounded-xl px-3.5 py-2.5 mb-5">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--ink-solid))] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(user.name ?? 'طالب').slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--ink))] truncate">{user.name ?? 'طالب'}</p>
                <p className="text-[11px] text-muted-foreground truncate" dir="ltr">{user.email ?? ''}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Card name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">اسم حامل البطاقة</label>
              <Input
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="JOHN DOE"
                className="h-11 text-left uppercase"
                dir="ltr"
              />
            </div>

            {/* Card number with brand */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">رقم البطاقة</label>
              <div className="relative">
                <Input
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="h-11 text-left font-mono pr-4 pl-16"
                  dir="ltr"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <CardBrandIcon brand={cardBrand} />
                </span>
              </div>
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">تاريخ الانتهاء</label>
                <Input
                  value={expiryDate}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="h-11 text-left font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الرمز السري (CVV)</label>
                <Input
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  placeholder="•••"
                  maxLength={4}
                  className="h-11 text-left font-mono"
                  dir="ltr"
                />
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
              className="w-full h-12 bg-[#0a2540] hover:bg-[#113a65] text-white font-bold mt-1 rounded-xl text-base shadow-md"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  جاري المعالجة...
                </span>
              ) : (
                'تأكيد الدفع ($15.00)'
              )}
            </Button>

            {/* Security footer */}
            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <ShieldIcon size={12} />
              دفع آمن ومشفّر. هذه بيئة تجريبية ولن يتم خصم أي مبالغ.
            </p>
          </form>
        </div>

        {/* Accepted cards hint */}
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
          <span className="text-[11px] font-semibold tracking-tight text-[#1a1f71] italic">VISA</span>
          <div className="relative w-[22px] h-[14px]">
            <div className="absolute left-0 top-0 w-[14px] h-[14px] rounded-full bg-[#eb001b] opacity-60" />
            <div className="absolute right-0 top-0 w-[14px] h-[14px] rounded-full bg-[#f79e1b] opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
}
