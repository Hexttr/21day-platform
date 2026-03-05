import React from 'react';
import { Week } from '@/data/courseData';
import { useProgress } from '@/contexts/ProgressContext';
import { LessonCard } from './LessonCard';
import { ChevronDown, Target, CheckCircle2 } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface WeekCardProps {
  week: Week;
  onSelectLesson: (lessonId: number) => void;
  defaultOpen?: boolean;
  isLessonPublished: (lessonId: number) => boolean;
  isDataLoading?: boolean;
}

export function WeekCard({ week, onSelectLesson, defaultOpen = false, isLessonPublished, isDataLoading = false }: WeekCardProps) {
  const { isLessonCompleted, isLoading: isProgressLoading } = useProgress();
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const completedLessons = isProgressLoading ? 0 : week.lessons.filter(l => isLessonCompleted(l.id)).length;
  const totalLessons = week.lessons.length;
  const isWeekComplete = !isProgressLoading && completedLessons === totalLessons;
  const progressPercent = (completedLessons / totalLessons) * 100;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="animate-fade-in-up">
      <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/50 shadow-soft overflow-hidden transition-all duration-300 hover:shadow-medium hover:border-border">
        <CollapsibleTrigger className="w-full focus-ring rounded-t-2xl sm:rounded-t-3xl">
          <div className="p-5 sm:p-6 flex items-center justify-between hover:bg-secondary/30 transition-colors">
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Week number badge */}
              <div className="relative flex-shrink-0">
                <div className={`
                  w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center
                  transition-all duration-300
                  ${isWeekComplete 
                    ? 'bg-success/10 border-2 border-success/30' 
                    : 'gradient-hero shadow-glow'
                  }
                `}>
                  {isWeekComplete ? (
                    <CheckCircle2 className="w-7 h-7 text-success" />
                  ) : (
                    <span className="font-serif font-semibold text-xl sm:text-2xl text-primary-foreground">
                      {week.id}
                    </span>
                  )}
                </div>
                
                {/* Progress ring indicator */}
                {!isWeekComplete && completedLessons > 0 && (
                  <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="calc(50% - 2px)"
                      fill="none"
                      stroke="hsl(var(--primary) / 0.2)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="calc(50% - 2px)"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercent * 2.2} 220`}
                    />
                  </svg>
                )}
              </div>

              <div className="text-left">
                <h2 className="font-serif text-lg sm:text-xl font-semibold text-foreground mb-1.5">
                  {week.title.replace(`Неделя ${week.id}: `, '')}
                </h2>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-sm text-muted-foreground line-clamp-1">{week.goal}</p>
                </div>
                
                {/* Progress indicator */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {Array.from({ length: totalLessons }).map((_, i) => (
                      <div 
                        key={i}
                        className={`
                          w-2 h-2 rounded-full border border-background
                          ${i < completedLessons 
                            ? 'bg-success' 
                            : 'bg-muted'
                          }
                        `}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {completedLessons}/{totalLessons}
                  </span>
                </div>
              </div>
            </div>

            <ChevronDown className={`
              w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0
              ${isOpen ? 'rotate-180' : ''}
            `} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1">
            <div className="border-t border-border/50 pt-4">
              <div className="grid gap-2.5 sm:gap-3">
                {week.lessons.map((lesson, index) => (
                  <LessonCard 
                    key={lesson.id}
                    lesson={lesson}
                    onClick={() => onSelectLesson(lesson.id)}
                    style={{ animationDelay: `${index * 40}ms` }}
                    isPublished={isLessonPublished(lesson.id)}
                    isDataLoading={isDataLoading}
                  />
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}