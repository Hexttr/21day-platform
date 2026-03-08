import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { usePublishedLessons } from '@/hooks/usePublishedLessons';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { 
  LogOut, 
  Eye,
  X,
  RefreshCw,
  Menu,
  Sparkles,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onNavigateHome?: () => void;
}

export function Header({ onNavigateHome }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { getCompletedCount, getProgressPercentage, refreshProgress } = useProgress();
  const { impersonatedUser, isImpersonating, stopImpersonation } = useImpersonation();
  const { refreshPublishedLessons, publishedCount } = usePublishedLessons();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const completedCount = getCompletedCount();
  const progressPercentage = getProgressPercentage();

  const handleRefreshData = useCallback(async (showToast = true) => {
    console.log('[Header] Refresh data clicked');
    setIsRefreshing(true);
    try {
      console.log('[Header] Starting refresh...');
      await Promise.all([
        refreshProgress(),
        refreshPublishedLessons()
      ]);
      console.log('[Header] Refresh complete, published lessons:', publishedCount);
      if (showToast) {
        toast.success('Данные обновлены');
      }
    } catch (error) {
      console.error('[Header] Refresh error:', error);
      if (showToast) {
        toast.error('Ошибка обновления данных');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshProgress, refreshPublishedLessons, publishedCount]);

  // Auto-refresh when user returns to the tab (mobile browser cache workaround)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Header] Tab became visible, refreshing data...');
        handleRefreshData(false); // Silent refresh
      }
    };

    // Also refresh on page show (back/forward navigation)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('[Header] Page restored from bfcache, refreshing data...');
        handleRefreshData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [handleRefreshData]);

  const displayName = isImpersonating 
    ? impersonatedUser?.name 
    : (user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User');
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="relative bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-3">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">
            Просмотр от имени: <strong>{impersonatedUser?.name}</strong> ({impersonatedUser?.email})
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={stopImpersonation}
            className="ml-2 h-7 px-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-950"
          >
            <X className="w-4 h-4 mr-1" />
            Выйти
          </Button>
        </div>
      )}
      
      {/* Glass effect background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" style={{ top: isImpersonating ? 'auto' : 0 }} />
      
      <div className="relative container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Sidebar toggle + Logo */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <button 
          onClick={onNavigateHome}
          className="flex items-center gap-3 group focus-ring rounded-xl"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
              <span className="text-white font-extrabold text-sm tracking-tight">21</span>
            </div>
            {/* Decorative ring */}
            <div className="absolute -inset-1 rounded-xl border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-lg text-foreground leading-none tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              21<span className="text-primary">DAY</span>
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mt-0.5">
              Курс по ИИ
            </p>
          </div>
        </button>
        </div>

        {/* Center: Progress (desktop) */}
        <div className="hidden md:flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full gradient-hero animate-pulse" />
              <span className="text-sm font-medium text-foreground">
                {completedCount}/21
              </span>
            </div>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full gradient-hero rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {progressPercentage}%
            </span>
          </div>
        </div>

        {/* Right: User menu */}
        <div className="flex items-center gap-2">
          {/* Mobile progress indicator */}
          <div className="flex md:hidden items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
            <span className="text-xs font-medium text-foreground">{completedCount}/21</span>
          </div>

          {/* Mobile tools buttons */}
          <div className="flex md:hidden items-center gap-1">
            <NavLink 
              to="/ai"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </NavLink>
            <NavLink 
              to="/gemini"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
            >
              <span className="text-base">✨</span>
            </NavLink>
            <NavLink 
              to="/nanobanana"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
            >
              <span className="text-base">🍌</span>
            </NavLink>
          </div>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-2 rounded-xl hover:bg-secondary/50 px-2 sm:px-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/50">
                  <span className="text-sm font-semibold text-foreground">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">
                  {firstName}
                </span>
                <Menu className="w-4 h-4 text-muted-foreground sm:hidden" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{firstName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Инструменты</DropdownMenuLabel>
              <DropdownMenuItem asChild className="cursor-pointer">
                <NavLink to="/ai" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Все инструменты
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <NavLink to="/gemini" className="flex items-center gap-2">
                  <span className="text-base">✨</span>
                  Gemini
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <NavLink to="/nanobanana" className="flex items-center gap-2">
                  <span className="text-base">🍌</span>
                  NanoBanana 3 Pro
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleRefreshData(true)}
                disabled={isRefreshing}
                className="cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Обновить данные
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={signOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}