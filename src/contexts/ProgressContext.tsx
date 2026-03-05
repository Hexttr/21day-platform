import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useImpersonation } from './ImpersonationContext';
import { supabase } from '@/api/supabase';

interface LessonProgress {
  lessonId: number;
  completed: boolean;
  quizCompleted: boolean;
  completedAt?: string;
}

interface ProgressContextType {
  progress: LessonProgress[];
  isLoading: boolean;
  markLessonComplete: (lessonId: number) => Promise<void>;
  markQuizComplete: (lessonId: number) => Promise<void>;
  isLessonCompleted: (lessonId: number) => boolean;
  isQuizCompleted: (lessonId: number) => boolean;
  getCompletedCount: () => number;
  getProgressPercentage: () => number;
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

const TOTAL_LESSONS = 21;

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, isSessionReady } = useAuth();
  const { impersonatedUser, isImpersonating } = useImpersonation();
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const fetchVersionRef = useRef(0);

  // Use impersonated user if admin is impersonating, otherwise use real user
  const effectiveUserId = isImpersonating ? impersonatedUser?.user_id : user?.id;

  const fetchProgress = useCallback(async (userId: string, force = false) => {
    // Skip if we already have data for this user (unless forced)
    if (!force && hasLoadedOnce && lastFetchedUserIdRef.current === userId) {
      setIsLoading(false);
      return;
    }

    const currentVersion = ++fetchVersionRef.current;
    setIsLoading(true);
    console.log('[Progress] Fetching progress for user:', userId);

    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', userId);

      if (fetchVersionRef.current !== currentVersion) return;

      if (error) {
        console.error('[Progress] Error fetching progress:', error.message);
        setIsLoading(false);
        return;
      }

      console.log('[Progress] Loaded:', data?.length || 0, 'progress records');

      const progressData = (data || []).map(p => ({
        lessonId: p.lesson_id,
        completed: p.completed ?? false,
        quizCompleted: p.quiz_completed ?? false,
        completedAt: p.completed_at ?? undefined
      }));
      
      setProgress(progressData);
      lastFetchedUserIdRef.current = userId;
      setHasLoadedOnce(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('[Progress] Error:', err?.message || err);
      if (fetchVersionRef.current === currentVersion) {
        setIsLoading(false);
      }
    }
  }, [hasLoadedOnce]);

  // Force refresh function for external use
  const refreshProgress = useCallback(async () => {
    if (effectiveUserId) {
      await fetchProgress(effectiveUserId, true);
    }
  }, [fetchProgress, effectiveUserId]);

  // Fetch progress only when session is ready AND we have a user (no delay needed - initialize() handles it)
  useEffect(() => {
    if (!isSessionReady) {
      console.log('[Progress] Waiting for session to be ready...');
      return;
    }
    
    if (effectiveUserId) {
      console.log('[Progress] Session ready, fetching progress for:', effectiveUserId);
      fetchProgress(effectiveUserId, true);
    } else {
      setProgress([]);
      lastFetchedUserIdRef.current = null;
      setIsLoading(false);
    }
  }, [isSessionReady, effectiveUserId, fetchProgress]);

  // Listen for auth state changes - but only clear on logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Progress] Auth event:', event);
        
        // Only handle SIGNED_OUT - other events are handled by effectiveUserId change
        if (event === 'SIGNED_OUT') {
          // Clear progress on logout
          setProgress([]);
          lastFetchedUserIdRef.current = null;
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const markLessonComplete = async (lessonId: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('student_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      });

    if (!error && user) {
      // Force refresh to get updated data
      await fetchProgress(user.id);
    }
  };

  const markQuizComplete = async (lessonId: number) => {
    if (!user) {
      console.error('markQuizComplete: No user logged in');
      return;
    }

    console.log('markQuizComplete: Starting for lesson', lessonId, 'user', user.id);

    try {
      // Use upsert to handle both insert and update in one call
      const { data, error } = await supabase
        .from('student_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          quiz_completed: true,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('markQuizComplete: Upsert error', error);
        throw error;
      }

      console.log('markQuizComplete: Success', data);
      // Force refresh to get updated data
      await fetchProgress(user.id);
    } catch (error) {
      console.error('markQuizComplete: Failed to save progress', error);
      throw error; // Re-throw so the caller knows it failed
    }
  };

  const isLessonCompleted = (lessonId: number) => {
    return progress.find(p => p.lessonId === lessonId)?.completed ?? false;
  };

  const isQuizCompleted = (lessonId: number) => {
    return progress.find(p => p.lessonId === lessonId)?.quizCompleted ?? false;
  };

  const getCompletedCount = () => {
    return progress.filter(p => p.completed).length;
  };

  const getProgressPercentage = () => {
    return Math.round((getCompletedCount() / TOTAL_LESSONS) * 100);
  };

  return (
    <ProgressContext.Provider value={{
      progress,
      isLoading,
      markLessonComplete,
      markQuizComplete,
      isLessonCompleted,
      isQuizCompleted,
      getCompletedCount,
      getProgressPercentage,
      refreshProgress,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
