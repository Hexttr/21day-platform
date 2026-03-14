import React, { useEffect, useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/api/client';
import { toast } from 'sonner';
import { Copy, Gift, Link2, ShieldCheck, Smartphone } from 'lucide-react';

interface ReferralOverview {
  code: string;
  referralUrl: string | null;
  phone: string | null;
  phoneVerifiedAt: string | null;
  totalReferrals: number;
  totalRewardsTokens: number;
}

export default function ReferralProgramPage() {
  const [overview, setOverview] = useState<ReferralOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await api<ReferralOverview>('/referral/me');
      setOverview(data);
      setPhone(data.phone || '');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить реферальную программу');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const copyReferralLink = async () => {
    if (!overview?.referralUrl) return;
    await navigator.clipboard.writeText(overview.referralUrl);
    toast.success('Реферальная ссылка скопирована');
  };

  const requestCode = async () => {
    setIsSending(true);
    try {
      await api('/phone/request-code', {
        method: 'POST',
        body: { phone, purpose: 'referral_unlock' },
      });
      toast.success('Код отправлен. В текущей версии SMS-провайдер подключается отдельно.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось отправить код');
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    setIsVerifying(true);
    try {
      await api('/phone/verify', {
        method: 'POST',
        body: { code, purpose: 'referral_unlock' },
      });
      toast.success('Телефон подтвержден');
      setCode('');
      loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось подтвердить код');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(248deg 100% 94.56%)' }}>
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <span className="font-semibold text-foreground text-sm">Реферальная программа</span>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-violet-600 via-primary to-fuchsia-600 px-6 py-8 text-white shadow-soft">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]">
              <Gift className="h-3.5 w-3.5" />
              Реферальная программа
            </div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Приглашайте пользователей и получайте бонусы в токенах
            </h1>
            <p className="mt-4 text-sm text-white/85 sm:text-base">
              После подтверждения телефона открывается ваша реферальная ссылка. За регистрацию приглашенного и его покупку курса начисляются бонусы на баланс.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Ваша ссылка</h2>
                <p className="text-sm text-muted-foreground">Поделитесь ей с новыми пользователями платформы</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border/50 bg-secondary/25 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Реферальный код</div>
              <div className="mt-2 text-2xl font-extrabold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {loading ? '...' : overview?.code}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={loading ? '' : overview?.referralUrl || 'Подтвердите телефон, чтобы активировать реферальную ссылку'}
                  readOnly
                  className="h-11 rounded-2xl bg-background"
                />
                <Button onClick={copyReferralLink} disabled={loading || !overview?.referralUrl} className="h-11 rounded-2xl">
                  <Copy className="mr-2 h-4 w-4" />
                  Копировать
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/50 bg-secondary/20 p-4">
                <div className="text-sm text-muted-foreground">Всего приглашено</div>
                <div className="mt-1 text-3xl font-extrabold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {loading ? '...' : overview?.totalReferrals || 0}
                </div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-secondary/20 p-4">
                <div className="text-sm text-muted-foreground">Начислено бонусов</div>
                <div className="mt-1 text-3xl font-extrabold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {loading ? '...' : `${overview?.totalRewardsTokens || 0} Tokens`}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Подтверждение телефона</h2>
                <p className="text-sm text-muted-foreground">Нужно для активации реферальной программы</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border/50 bg-secondary/25 p-4">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className={`h-4 w-4 ${overview?.phoneVerifiedAt ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span className="font-medium text-foreground">
                  {overview?.phoneVerifiedAt ? 'Телефон подтвержден' : 'Телефон еще не подтвержден'}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Код состоит из 4 цифр, действует 5 минут. Повторная отправка не чаще 1 раза в 60 секунд и не более 5 попыток за 15 минут.
              </p>

              <div className="mt-4 space-y-3">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 999 123 45 67"
                  className="h-11 rounded-2xl bg-background"
                />
                <Button onClick={requestCode} disabled={isSending || !phone.trim()} className="h-11 w-full rounded-2xl">
                  {isSending ? 'Отправляем...' : 'Получить SMS-код'}
                </Button>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4 цифры"
                  className="h-11 rounded-2xl bg-background"
                />
                <Button onClick={verifyCode} disabled={isVerifying || code.length !== 4} variant="outline" className="h-11 w-full rounded-2xl">
                  {isVerifying ? 'Проверяем...' : 'Подтвердить код'}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
