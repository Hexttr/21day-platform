import { BookOpen, Users, Ticket, Play, ClipboardList } from "lucide-react";
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

/* ── Real brand logos as inline SVGs ── */

function ChatGPTLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M37.532 16.87a9.963 9.963 0 00-.856-8.184 10.078 10.078 0 00-10.855-4.835 9.964 9.964 0 00-6.211-2.681 10.079 10.079 0 00-9.642 6.977 9.967 9.967 0 00-6.172 4.835 10.079 10.079 0 001.24 11.817 9.965 9.965 0 00.856 8.185 10.079 10.079 0 0010.855 4.835 9.965 9.965 0 006.211 2.681 10.079 10.079 0 009.653-6.989 9.967 9.967 0 006.172-4.806 10.079 10.079 0 00-1.251-11.835zm-9.022 12.608a7.474 7.474 0 01-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 00.655-1.134V19.054l3.366 1.944a.12.12 0 01.066.092v9.299a7.505 7.505 0 01-7.49 7.496zm-9.661-4.125a7.471 7.471 0 01-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 001.308 0l9.724-5.614v3.888a.12.12 0 01-.048.103l-8.051 4.649a7.504 7.504 0 01-10.24-2.744zm-1.904-17.366A7.469 7.469 0 018.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 00.654 1.132l9.723 5.614-3.366 1.944a.12.12 0 01-.114.012L7.044 23.86a7.504 7.504 0 01-2.747-10.24zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 01.114-.012l8.048 4.648a7.498 7.498 0 01-1.158 13.528v-9.476a1.293 1.293 0 00-.647-1.13zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 00-1.308 0l-9.723 5.614v-3.888a.12.12 0 01.048-.103l8.05-4.645a7.497 7.497 0 0111.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 01-.065-.092v-9.299a7.497 7.497 0 0112.293-5.756 6.94 6.94 0 00-.236.134l-7.965 4.6a1.294 1.294 0 00-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.5v4.999l-4.331 2.5-4.331-2.5V18z"
        fill="currentColor"
      />
    </svg>
  );
}

function GeminiLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2C13.5 8.5 9.5 12.5 3 13c6.5.5 10.5 4.5 11 11 .5-6.5 4.5-10.5 11-11-6.5-.5-10.5-4.5-11-11z"
        fill="currentColor"
      />
    </svg>
  );
}

function BananaLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 3C7 3 5 5 5 9C5 13 8 15 12 14C16 13 18 10 17 7C16.5 5.5 15 5 14 5.5C13 6 13 7.5 14 8C15 8.5 15.5 10 14 11C12 12.5 9 11.5 9 9C9 6.5 11 5 11 5L7 3Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const courseItems = [
  { title: "Курс", url: "/", icon: BookOpen },
];

const toolItems = [
  { 
    title: "ChatGPT", url: "/chatgpt", 
    logo: ChatGPTLogo, 
    bg: "bg-[#10a37f]",
    color: "text-white"
  },
  { 
    title: "Gemini", url: "/gemini", 
    logo: GeminiLogo, 
    bg: "bg-gradient-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570]",
    color: "text-white"
  },
  { 
    title: "NanoBanana 3 Pro", url: "/nanobanana", 
    logo: BananaLogo, 
    bg: "bg-gradient-to-br from-yellow-400 to-orange-400",
    color: "text-yellow-900"
  },
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
      {/* ── Logo ── */}
      <SidebarHeader className="p-4 pb-3">
        {!collapsed ? (
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-glow flex-shrink-0">
              <span className="text-white font-extrabold text-sm tracking-tight">21</span>
            </div>
            <div>
              <span className="font-extrabold text-foreground text-base tracking-tight leading-none">
                21<span className="text-primary">DAY</span>
              </span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 font-medium">Курс по ИИ</p>
            </div>
          </NavLink>
        ) : (
          <NavLink to="/" className="flex justify-center">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-glow">
              <span className="text-white font-extrabold text-sm tracking-tight">21</span>
            </div>
          </NavLink>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* ── Progress pill (expanded) ── */}
        {!collapsed && (
          <div className="px-3 pb-2">
            <div className="p-3 rounded-xl bg-primary/8 border border-primary/15" style={{ background: 'hsl(263 52% 50% / 0.07)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">Мой прогресс</span>
                <span className="text-xs font-bold text-primary">{progressPercentage}%</span>
              </div>
              <div className="h-1.5 bg-primary/15 rounded-full overflow-hidden">
                <div
                  className="h-full gradient-hero rounded-full transition-all duration-700"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">{completedCount} из 21 уроков</p>
            </div>
          </div>
        )}

        {/* ── Course ── */}
        <SidebarGroup className="pt-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {courseItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4.5 w-4.5" style={{ width: '18px', height: '18px' }} />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── AI Tools ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Инструменты ИИ
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => {
                const isActive = location.pathname === item.url;
                const LogoComponent = item.logo;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <span className={`w-[18px] h-[18px] rounded-[5px] ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0`}>
                          <LogoComponent size={11} />
                        </span>
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Admin ── */}
        {isAdmin && (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Администрирование
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <NavLink to={item.url} className="flex items-center gap-3">
                            <item.icon className="h-4.5 w-4.5" style={{ width: '18px', height: '18px' }} />
                            <span className="font-medium">{item.title}</span>
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

      {/* ── User footer ── */}
      {user && (
        <SidebarFooter className="p-3">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl bg-secondary/60 border border-border/50">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0 shadow-glow">
                <span className="text-xs font-bold text-white">
                  {(user.name?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {user.name || 'Пользователь'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shadow-glow">
                <span className="text-xs font-bold text-white">
                  {(user.name?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
