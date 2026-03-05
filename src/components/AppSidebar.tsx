import { BookOpen, Bot, Sparkles, ImageIcon, Users, Ticket, Play, ClipboardList, GraduationCap } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/contexts/ProgressContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
  SidebarSeparator,
  SidebarFooter,
} from "@/components/ui/sidebar";

const courseItems = [
  { title: "Курс", url: "/", icon: BookOpen },
];

const toolItems = [
  { title: "ChatGPT", url: "/chatgpt", icon: Bot, emoji: "🤖" },
  { title: "Gemini", url: "/gemini", icon: Sparkles, emoji: "✨" },
  { title: "NanoBanana 3 Pro", url: "/nanobanana", icon: ImageIcon, emoji: "🍌" },
];

const adminItems = [
  { title: "Уроки", url: "/admin/lessons", icon: BookOpen },
  { title: "Практ. материалы", url: "/admin/materials", icon: Play },
  { title: "Студенты", url: "/admin/students", icon: Users },
  { title: "Пригл. коды", url: "/admin/codes", icon: Ticket },
  { title: "Лист ожидания", url: "/admin/waitlist", icon: ClipboardList },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { isAdmin, user } = useAuth();
  const { getCompletedCount, getProgressPercentage } = useProgress();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const completedCount = getCompletedCount();
  const progressPercentage = getProgressPercentage();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-glow flex-shrink-0">
              <GraduationCap className="w-4.5 h-4.5 text-primary-foreground" style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <span className="font-serif font-semibold text-foreground text-sm leading-none">
                Neuro<span className="text-primary">Academy</span>
              </span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">21 день ИИ</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center mx-auto shadow-glow">
            <GraduationCap className="w-4.5 h-4.5 text-primary-foreground" style={{ width: '18px', height: '18px' }} />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Progress (expanded only) */}
        {!collapsed && (
          <div className="px-3 pb-1">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground">Прогресс</span>
                <span className="text-xs font-semibold text-primary">{progressPercentage}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-hero rounded-full transition-all duration-700"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">{completedCount} из 21 уроков</p>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {courseItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Инструменты ИИ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <span className="text-base leading-none">{item.emoji}</span>
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel>Администрирование</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <NavLink to={item.url} className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer with user info */}
      {!collapsed && user && (
        <SidebarFooter className="p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-secondary/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary">
                {(user.name?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user.name || 'Пользователь'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
