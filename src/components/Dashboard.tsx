import React, { useState } from 'react';
import { courseData, getLessonById } from '@/data/courseData';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { usePublishedLessons } from '@/hooks/usePublishedLessons';
import { Header } from './Header';
import { WeekCard } from './WeekCard';
import { LessonView } from './LessonView';
import { PracticalMaterials } from './PracticalMaterials';
import { 
  BookOpen, 
  Target, 
  Trophy,
  Zap,
  ArrowRight,
  Play
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const { getCompletedCount, getProgressPercentage, isLessonCompleted, isLoading: isProgressLoading } = useProgress();
  const { isLessonPublished, loading: isLessonsLoading } = usePublishedLessons();

  // Show actual values only when data is loaded
  const completedCount = isProgressLoading ? 0 : getCompletedCount();
  const progressPercentage = isProgressLoading ? 0 : getProgressPercentage();
  const selectedLesson = selectedLessonId ? getLessonById(selectedLessonId) : null;

  // Find next lesson to continue
  const allLessons = courseData.flatMap(week => week.lessons);
  const nextLesson = allLessons.find(lesson => !isLessonCompleted(lesson.id) && isLessonPublished(lesson.id));

  const handleNavigateHome = () => {
    setSelectedLessonId(null);
  };

  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'Студент';

  return (
    <div className="min-h-screen bg-background mesh-bg">
      <Header onNavigateHome={handleNavigateHome} />
      
      <main className="container mx-auto px-4 py-6 sm:py-10 max-w-5xl">
        {selectedLesson && isLessonPublished(selectedLesson.id) ? (
          <LessonView 
            lesson={selectedLesson}
            onBack={() => setSelectedLessonId(null)}
            onNavigateToLesson={(id) => {
              if (isLessonPublished(id)) {
                setSelectedLessonId(id);
              }
            }}
            isLessonPublished={isLessonPublished}
          />
        ) : (
          <>
            {/* Hero Section */}
            <section className="mb-10 sm:mb-14 animate-fade-in-up">
              <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 shadow-large">
                {/* Gradient overlay */}
                <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
                
                <div className="relative p-6 sm:p-10">
                  <div className="max-w-2xl">
                    {/* Greeting */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">
                        Добро пожаловать, {firstName}!
                      </span>
                    </div>

                    <h1 className="font-serif text-display-sm sm:text-display text-foreground mb-4">
                      21-дневный курс
                      <br />
                      <span className="text-gradient">по ИИ</span>
                    </h1>
                    
                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                      От новичка до уверенного пользователя. Практические навыки для помогающих специалистов.
                    </p>
                    
                    {/* Progress card */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      <div className="flex-1 p-5 rounded-2xl bg-secondary/50 border border-border/50">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-foreground">Ваш прогресс</span>
                          <span className="text-2xl font-serif font-semibold text-foreground">
                            {progressPercentage}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full gradient-hero rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">
                          {completedCount} из 21 уроков пройдено
                        </p>
                      </div>

                      {/* Continue button */}
                      {nextLesson && (
                        <button
                          onClick={() => setSelectedLessonId(nextLesson.id)}
                          className="group flex items-center justify-between p-5 rounded-2xl gradient-hero shadow-glow hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                        >
                          <div className="text-left">
                            <p className="text-primary-foreground/80 text-sm font-medium mb-1">
                              Продолжить
                            </p>
                            <p className="text-primary-foreground font-semibold truncate max-w-[180px]">
                              День {nextLesson.day}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-primary-foreground ml-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 right-1/4 w-60 h-60 rounded-full bg-accent/5 blur-3xl translate-y-1/2" />
              </div>
            </section>

            {/* Stats Row */}
            <section className="grid grid-cols-3 gap-3 sm:gap-5 mb-10 sm:mb-14">
              {[
                { icon: BookOpen, value: completedCount, label: 'Пройдено', color: 'primary' },
                { icon: Target, value: 21 - completedCount, label: 'Осталось', color: 'accent' },
                { icon: Trophy, value: 3, label: 'Недели', color: 'success' },
              ].map((stat, index) => (
                <div 
                  key={stat.label}
                  className="group relative bg-card rounded-2xl p-4 sm:p-5 border border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in-up card-hover"
                  style={{ animationDelay: `${100 + index * 50}ms` }}
                >
                  <div className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3
                    ${stat.color === 'primary' ? 'bg-primary/10' : ''}
                    ${stat.color === 'accent' ? 'bg-accent/10' : ''}
                    ${stat.color === 'success' ? 'bg-success/10' : ''}
                  `}>
                    <stat.icon className={`
                      w-5 h-5 sm:w-6 sm:h-6
                      ${stat.color === 'primary' ? 'text-primary' : ''}
                      ${stat.color === 'accent' ? 'text-accent' : ''}
                      ${stat.color === 'success' ? 'text-success' : ''}
                    `} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-serif font-semibold text-foreground mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </section>

            {/* Course Content */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="font-serif text-heading text-foreground">
                  Программа курса
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </div>

              <div className="space-y-4 sm:space-y-6">
                {courseData.map((week, index) => (
                  <WeekCard 
                    key={week.id}
                    week={week}
                    onSelectLesson={setSelectedLessonId}
                    defaultOpen={index === 0}
                    isLessonPublished={isLessonPublished}
                    isDataLoading={isLessonsLoading || isProgressLoading}
                  />
                ))}
              </div>
            </section>

            {/* Practical Materials Section */}
            <section className="mt-10 sm:mt-14">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Play className="w-5 h-5 text-accent" />
                </div>
                <h2 className="font-serif text-heading text-foreground">
                  Практические материалы
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </div>
              <PracticalMaterials />
            </section>
          </>
        )}
      </main>
    </div>
  );
}