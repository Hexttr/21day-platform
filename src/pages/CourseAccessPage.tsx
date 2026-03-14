import React, { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useCourseCommerce } from '@/hooks/useCourseCommerce';
import { api } from '@/api/client';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';

export default function CourseAccessPage() {
  const { courses, access, loading } = useCourseCommerce();
  const [isCreatingOrder, setIsCreatingOrder] = useState<string | null>(null);

  const handlePurchase = async (courseCode: string) => {
    setIsCreatingOrder(courseCode);
    try {
      const data = await api<{ paymentUrl: string }>('/course-orders', {
        method: 'POST',
        body: { courseCode },
      });
      window.location.href = data.paymentUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось создать заказ');
    } finally {
      setIsCreatingOrder(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(248deg 100% 94.56%)' }}>
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <span className="font-semibold text-foreground text-sm">Доступ к курсу</span>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-primary to-violet-600 px-6 py-8 text-white shadow-soft sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%)]" />
          <div className="relative max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]">
              <Sparkles className="h-3.5 w-3.5" />
              Курс 21DAY
            </div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Практический курс по ИИ для специалистов помогающих профессий
            </h1>
            <p className="mt-4 max-w-xl text-sm text-white/80 sm:text-base">
              21 день, короткие ежедневные уроки, AI-тесты и практические материалы. Можно начать с 14 дней и позже докупить полный доступ.
            </p>
            {access?.hasCourseAccess && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Сейчас у вас открыт тариф: {access.courseTitle || `${access.grantedLessons} уроков`}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {courses.map((course) => {
            const isUpgradeCard = course.code === 'course_21' && access?.canUpgradeTo21;
            const priceLabel = isUpgradeCard
              ? `${Number(course.upgradePriceRub || 0).toLocaleString('ru-RU')} ₽`
              : `${Number(course.priceRub).toLocaleString('ru-RU')} ₽`;
            const isOwned = (access?.grantedLessons || 0) >= course.grantedLessons;

            return (
              <div key={course.id} className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <PlayCircle className="h-3.5 w-3.5" />
                      {course.durationDays} дней
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground">{course.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{course.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {priceLabel}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isUpgradeCard ? 'цена апгрейда' : 'разовый платеж'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl bg-secondary/30 p-4">
                  {[
                    `${course.grantedLessons} уроков и AI-тестов`,
                    'Практические материалы внутри платформы',
                    course.code === 'course_21' ? 'Полный доступ ко всему курсу' : 'Можно докупить апгрейд до 21 дня позже',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handlePurchase(course.code)}
                  disabled={loading || isOwned || isCreatingOrder !== null}
                  className="mt-5 h-12 w-full rounded-2xl text-base font-semibold"
                >
                  {isOwned
                    ? 'Уже доступно'
                    : isCreatingOrder === course.code
                      ? 'Создаем заказ...'
                      : isUpgradeCard
                        ? 'Сделать апгрейд'
                        : 'Оформить доступ'}
                  {!isOwned && isCreatingOrder !== course.code && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            );
          })}
        </section>

        <section className="mt-6 rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground">Что входит в доступ</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              'Короткие уроки, которые удобно проходить каждый день',
              'AI-тесты для фиксации результата и линейного открытия следующего урока',
              'Практические материалы и дальнейший апгрейд до полного курса',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
