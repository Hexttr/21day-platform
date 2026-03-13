import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type CourseViewMode = 'student' | 'all';

const STORAGE_KEY = 'admin-course-view-mode';

export function useCourseViewMode() {
  const { isAdmin } = useAuth();
  const [storedMode, setStoredMode] = useState<CourseViewMode>(() => {
    if (typeof window === 'undefined') {
      return 'student';
    }

    return localStorage.getItem(STORAGE_KEY) === 'all' ? 'all' : 'student';
  });

  useEffect(() => {
    if (!isAdmin) {
      setStoredMode('student');
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, storedMode);
  }, [isAdmin, storedMode]);

  const viewMode = useMemo<CourseViewMode>(
    () => (isAdmin ? storedMode : 'student'),
    [isAdmin, storedMode]
  );

  return {
    viewMode,
    setViewMode: setStoredMode,
    isFullCourseMode: viewMode === 'all',
  };
}
