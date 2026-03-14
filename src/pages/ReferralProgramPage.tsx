import React, { useEffect, useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/api/client';
import { toast } from 'sonner';
import { Copy, Gift, Link2, ShieldCheck, Smartphone, ArrowRight, LockKeyhole, Users, Coins, CheckCircle2 } from 'lucide-react';

interface ReferralOverview {
  code: string;
  referralUrl: string | null;
  phone: string | null;
  phoneVerifiedAt: string | null;
  totalReferrals: number;
  totalRewardsTokens: number;
}

const heroStats = [
  { value: '500', label: 'токенов вам' },
  { value: '500', label: 'токенов другу' },
  { value: '5000', label: 'токенов за курс' },
];

const rewardRules = [
  {
    icon: Gift,
    title: 'Бонус за приглашение',
    text: 'За каждого приглашенного на платформу пользователя вы и этот пользователь получаете по 500 токенов.',
    note: 'Зачисление происходит только после подтверждения номера приглашенного пользователя.',
  },
  {
    icon: Coins,
    title: 'Бонус за покупку курса',
    text: 'Если приглашенный пользователь купит доступ к обучающему курсу, то вы получите 5000 токенов.',
    note: 'Бонус начисляется вам автоматически после успешной оплаты курса приглашенным пользователем.',
  },
];

const usageSteps = [
  'Подтвердите номер телефона на этой странице, чтобы активировать реферальную программу.',
  'После подтверждения появятся ваш реферальный код и персональная ссылка для приглашения.',
  'Отправьте ссылку новому пользователю. Он может зарегистрироваться сразу по ссылке или ввести ваш код при регистрации вручную.',
  'После подтверждения номера приглашенного пользователя бонус за регистрацию начислится автоматически.',
  'Если этот пользователь позже оплатит обучающий курс, вы дополнительно получите 5000 токенов.',
];

export default function ReferralProgramPage() {
  const [overview, setOverview] = useState<ReferralOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const isPhoneVerified = Boolean(overview?.phoneVerifiedAt);
  const maskedReferralCode = loading
    ? '........'
    : isPhoneVerified
      ? overview?.code || ''
      : '••••••••';

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
        <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-[linear-gradient(135deg,#5d3fd3_0%,#7b5cff_45%,#ae86ff_100%)] px-6 py-8 text-white shadow-soft sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%)]" />
          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]">
              <Gift className="h-3.5 w-3.5" />
              Реферальная программа
            </div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Приглашайте пользователей и получайте бонусы в токенах
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-lg">
              Подтвердите номер телефона, получите персональный код и делитесь им с новыми пользователями платформы. За регистрацию и дальнейшую покупку курса начисляются бонусы на баланс.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => document.getElementById('referral-access')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 rounded-2xl bg-white px-6 text-base font-semibold text-primary hover:bg-white/95"
              >
                Активировать рефералку
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('referral-rules')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 rounded-2xl border-white/35 bg-white/10 px-6 text-base font-semibold text-white hover:bg-white/15"
              >
                Смотреть условия
              </Button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <div className="text-2xl font-extrabold" style={{ fontFamily: 'Outfit, sans-serif' }}>{item.value}</div>
                  <div className="mt-1 text-xs text-white/75">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="referral-access" className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
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
              <div className="mt-2 flex items-center gap-3">
                <div className="text-2xl font-extrabold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {maskedReferralCode}
                </div>
                {!isPhoneVerified && !loading && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Откроется после подтверждения номера
                  </span>
                )}
              </div>
              {!isPhoneVerified && !loading && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Пока номер телефона не подтвержден, код и реферальная ссылка скрыты. После подтверждения они появятся здесь автоматически.
                </p>
              )}
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
                  {loading ? '...' : `${overview?.totalRewardsTokens || 0} Токенов`}
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

        <section id="referral-rules" className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Условия программы</h2>
            <p className="mt-2 text-muted-foreground">Простая механика бонусов, понятная и для вас, и для приглашенного пользователя</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {rewardRules.map((rule) => (
              <div key={rule.title} className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <rule.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{rule.title}</h3>
                <p className="mt-3 text-base leading-7 text-foreground">{rule.text}</p>
                <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                  {rule.note}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Как пользоваться реферальным кодом?</h2>
                <p className="text-sm text-muted-foreground">Короткая инструкция для вас и ваших приглашенных пользователей</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {usageSteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl border border-border/50 bg-secondary/15 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Что важно знать</h2>
                <p className="text-sm text-muted-foreground">Чтобы бонусы начислялись без лишних вопросов</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-border/50 bg-secondary/15 p-4 text-sm leading-6 text-foreground">
                Реферальная ссылка и сам код становятся видимыми только после подтверждения вашего номера телефона.
              </div>
              <div className="rounded-2xl border border-border/50 bg-secondary/15 p-4 text-sm leading-6 text-foreground">
                Если новый пользователь открывает платформу по вашей ссылке, код подставится автоматически. Если он регистрируется вручную, можно просто передать ему ваш код.
              </div>
              <div className="rounded-2xl border border-border/50 bg-secondary/15 p-4 text-sm leading-6 text-foreground">
                Бонус за регистрацию срабатывает только после подтверждения номера приглашенного пользователя. Бонус за покупку курса начисляется отдельно.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(135deg,#5d3fd3_0%,#8b6cff_100%)] px-6 py-8 text-white shadow-soft sm:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Подтвердите номер и начните приглашать пользователей уже сегодня
            </h2>
            <p className="mt-4 text-sm text-white/85 sm:text-base">
              Как только номер будет подтвержден, на этой странице автоматически откроются ваш реферальный код и персональная ссылка.
            </p>
            <Button
              size="lg"
              onClick={() => document.getElementById('referral-access')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-6 h-12 rounded-2xl bg-white px-6 text-base font-semibold text-primary hover:bg-white/95"
            >
              Перейти к подтверждению
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
