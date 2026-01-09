'use client';

import React, { memo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Landmark,
  FileSearch,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  UserCheck,
  Briefcase,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Navigation item type
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  section?: 'main' | 'management' | 'system';
}

// Navigation items configuration with logical grouping
const navItems: NavItem[] = [
  // Main Section
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    section: 'main',
  },
  {
    name: 'AI Assistant',
    href: '/dashboard/assistant',
    icon: Bot,
    section: 'main',
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    section: 'main',
  },
  // Management Section
  {
    name: 'Registrations',
    href: '/dashboard/registrations',
    icon: UserCheck,
    section: 'management',
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: Users,
    section: 'management',
  },
  {
    name: 'PDS Submissions',
    href: '/dashboard/submissions/pds',
    icon: FileText,
    section: 'management',
  },
  {
    name: 'SALN Submissions',
    href: '/dashboard/submissions/saln',
    icon: Landmark,
    section: 'management',
  },
  {
    name: 'Jobs',
    href: '/dashboard/jobs',
    icon: Briefcase,
    section: 'management',
  },
  {
    name: 'Organization',
    href: '/dashboard/organization',
    icon: Building2,
    section: 'management',
  },
  // System Section
  {
    name: 'Audit Logs',
    href: '/dashboard/audit-logs',
    icon: FileSearch,
    section: 'system',
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    section: 'system',
  },
];

// Section labels
const sectionLabels: Record<string, string> = {
  main: 'Main',
  management: 'Management',
  system: 'System',
};

// Get user initials from name
const getUserInitials = (name: string | undefined): string => {
  if (!name) return 'AD';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Sidebar navigation component (memoized)
const SidebarNav = memo(
  ({
    pathname,
    onNavigate,
    isCollapsed = false,
    onToggleCollapse
  }: {
    pathname: string;
    onNavigate?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
  }) => {
    const router = useRouter();
    const { user, profile, signOut } = useAuth();
    const { resolvedTheme, toggleTheme } = useTheme();

    const handleSignOut = useCallback(async () => {
      await signOut();
      router.push('/auth/login');
    }, [signOut, router]);

    // Get user display name from profile
    const displayName = profile
      ? `${profile.firstName} ${profile.lastName}`
      : user?.email || 'Admin User';
    
    // Map role to display label
    const getRoleLabel = (role?: string) => {
      switch (role) {
        case 'admin':
          return 'Administrator';
        case 'co_admin':
          return 'Co-Administrator';
        case 'hr':
          return 'HR Personnel';
        default:
          return 'Staff';
      }
    };
    const userRole = getRoleLabel(profile?.role);

    // Group navigation items by section
    const groupedNavItems = navItems.reduce((acc, item) => {
      const section = item.section || 'main';
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    }, {} as Record<string, NavItem[]>);

    return (
      <div className="flex h-full flex-col bg-muted/30 transition-all duration-300">
        {/* Logo Section - Clean header with proper spacing */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8B1538] text-white shadow-sm ring-1 ring-[#8B1538]/10">
              <span className="text-sm font-bold">TS</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight">
                  TUPSAFE
                </span>
                <span className="text-xs text-muted-foreground">
                  Admin Portal
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle Button - Only visible on tablet screens */}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="hidden md:flex lg:hidden h-8 w-8"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Navigation Items - Scrollable area with grouped sections */}
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-6 py-4">
            {Object.entries(groupedNavItems).map(([section, items]) => (
              <div key={section} className="space-y-1">
                {/* Section Label - Hidden when collapsed */}
                {!isCollapsed && (
                  <div className="mb-2 px-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {sectionLabels[section] || section}
                    </h4>
                  </div>
                )}

                {/* Section Items */}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Button
                        key={item.href}
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full h-10 font-medium transition-all',
                          isCollapsed
                            ? 'justify-center px-2'
                            : 'justify-start gap-3 px-3',
                          isActive
                            ? 'bg-[#8B1538]/10 text-[#8B1538] hover:bg-[#8B1538]/15 hover:text-[#8B1538] shadow-sm dark:bg-[#8B1538]/20 dark:text-[#e87d9a] dark:hover:bg-[#8B1538]/25'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                        title={isCollapsed ? item.name : undefined}
                        asChild>
                        <Link href={item.href} onClick={onNavigate}>
                          <Icon className="h-5 w-5 shrink-0" />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 text-left text-sm">
                                {item.name}
                              </span>
                              {item.badge && (
                                <Badge
                                  variant="secondary"
                                  className="ml-auto h-5 min-w-5 px-1.5 text-xs font-medium">
                                  {item.badge}
                                </Badge>
                              )}
                              {isActive && (
                                <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                              )}
                            </>
                          )}
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User Profile Section - Modern card layout */}
        <div className="shrink-0 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* User Info Card */}
          <div className={cn(
            "mb-3 flex items-center rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <Avatar className="h-10 w-10 ring-2 ring-background">
              <AvatarImage src={profile?.avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-[#8B1538] text-white text-xs font-semibold">
                {getUserInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold leading-tight">
                  {displayName}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="h-5 px-1.5 text-[10px] font-medium">
                    {userRole}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Clean layout */}
          <div className={cn(
            "flex items-center gap-2",
            isCollapsed && "flex-col"
          )}>
            <Button
              variant="outline"
              size={isCollapsed ? "icon" : "sm"}
              onClick={toggleTheme}
              className={cn(
                "h-9 transition-all",
                isCollapsed ? "w-9" : "flex-1 gap-2"
              )}
              title={isCollapsed ? (resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}>
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {!isCollapsed && (
                <span className="text-xs font-medium">
                  {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size={isCollapsed ? "icon" : "sm"}
              onClick={handleSignOut}
              className={cn(
                "h-9 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all",
                isCollapsed ? "w-9" : "flex-1 gap-2"
              )}
              title={isCollapsed ? 'Sign out' : undefined}>
              <LogOut className="h-4 w-4" />
              {!isCollapsed && (
                <span className="text-xs font-medium">Sign Out</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

SidebarNav.displayName = 'SidebarNav';

// Main dashboard layout component
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('admin-sidebar-collapsed');
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true');
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Toggle sidebar collapse and persist to localStorage
  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('admin-sidebar-collapsed', String(newState));
      return newState;
    });
  }, []);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading while redirecting
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar - Responsive width with smooth transitions */}
      <aside
        className={cn(
          "hidden shrink-0 border-r shadow-sm transition-all duration-300 md:block",
          sidebarCollapsed ? "md:w-20 lg:w-72" : "md:w-72"
        )}>
        <SidebarNav
          pathname={pathname}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </aside>

      {/* Mobile Header - Fixed top bar with menu toggle */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="h-9 w-9 shrink-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#8B1538] text-white">
            <span className="text-xs font-bold">TS</span>
          </div>
          <span className="text-sm font-semibold">TUPSAFE Admin</span>
        </div>
      </div>

      {/* Mobile Menu - Sheet drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarNav pathname={pathname} onNavigate={closeMobileMenu} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area - Improved responsive padding and ultra-wide support */}
      <main className="flex-1 overflow-y-auto bg-muted/10">
        {/* Add top padding on mobile to account for fixed header */}
        <div className="container mx-auto max-w-screen-2xl px-4 pt-20 pb-4 md:p-6 md:pt-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
