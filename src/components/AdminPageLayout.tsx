import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LucideIcon } from 'lucide-react';

interface AdminPageLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: 'primary' | 'accent' | 'success' | 'warning';
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function AdminPageLayout({ 
  title, 
  description, 
  icon: Icon, 
  iconColor = 'primary',
  children,
  actions
}: AdminPageLayoutProps) {
  const iconBg = {
    primary: 'bg-primary/10',
    accent: 'bg-accent/10',
    success: 'bg-success/10',
    warning: 'bg-warning/10',
  }[iconColor];
  
  const iconText = {
    primary: 'text-primary',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
  }[iconColor];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(248deg 100% 94.56%)' }}>
      {/* Sticky page header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" />
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4.5 h-4.5 ${iconText}`} style={{ width: '18px', height: '18px' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-lg font-semibold text-foreground leading-none truncate">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              {description}
            </p>
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
