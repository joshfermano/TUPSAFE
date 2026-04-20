'use client';

import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { cn } from '../../lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText,
  Landmark,
  Settings,
  LogOut,
  Menu,
  User,
  Briefcase,
  Building2,
  ChevronDown,
  AlertTriangle,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { useUnreadCount } from '../../hooks/useNotifications';

// ============================================================================
// TYPES
// ============================================================================

interface NavigationSubItem {
  name: string;
  href: string;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  subItems?: NavigationSubItem[];
  badge?: number;
}

interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  onClick: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  onNavigate?: (href: string) => void;
  currentPathname?: string;
  isCollapsed?: boolean;
}

interface UserInfoProps {
  email?: string;
  initials: string;
  avatarUrl?: string | null;
}

interface DashboardSidebarProps {
  className?: string;
  userType?: 'employee' | 'applicant' | undefined;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

/**
 * Minimalistic UserInfo component with clean design
 * Uses CSS transitions for smooth hover effects without Framer Motion overhead
 */
const UserInfo = memo<UserInfoProps>(
  ({ email, initials, avatarUrl }) => {
    return (
      <div className="group cursor-pointer">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 transition-all duration-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-[#093FB4]/20 dark:hover:border-[#093FB4]/30">
          <div className="transition-transform duration-200 hover:scale-105">
            <Avatar className="h-10 w-10 ring-2 ring-slate-200 dark:ring-slate-700 transition-all duration-300 group-hover:ring-primary/30">
              <AvatarImage src={avatarUrl || undefined} alt={email?.split('@')[0] || 'User'} />
              <AvatarFallback className="bg-primary text-white font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {email || 'user@gov.ph'}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

UserInfo.displayName = 'UserInfo';

/**
 * Clean, minimalistic NavItem component
 * Simple design with subtle hover effect and smooth transitions
 * Supports nested sub-items with expand/collapse functionality
 */
const NavItem = memo<NavItemProps>(
  ({
    item,
    isActive,
    onClick,
    isExpanded,
    onToggle,
    onNavigate,
    currentPathname,
    isCollapsed = false,
  }) => {
    const Icon = item.icon;
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div>
        <button
          onClick={hasSubItems ? onToggle : onClick}
          className={cn(
            'relative w-full flex items-center rounded-xl text-sm font-medium transition-all duration-300 group',
            isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3',
            isActive
              ? 'bg-primary text-white shadow-sm shadow-primary/20'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100',
            !isCollapsed && 'hover:translate-x-0.5 active:scale-[0.98]'
          )}
          title={isCollapsed ? item.name : undefined}>
          <Icon
            className={cn(
              'h-5 w-5 transition-all duration-300',
              isCollapsed ? 'shrink-0' : '',
              isActive
                ? 'text-white'
                : 'text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-primary'
            )}
          />
          {isCollapsed && item.badge != null && item.badge > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
          )}
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{item.name}</span>

              {item.badge != null && item.badge > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] font-bold leading-none',
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-blue-600 text-white'
                  )}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}

              {hasSubItems ? (
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-300',
                    isExpanded && 'rotate-180',
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 dark:text-slate-500'
                  )}
                />
              ) : isActive ? (
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-in fade-in zoom-in duration-300" />
              ) : null}
            </>
          )}
        </button>

        {/* Sub-items with smooth expand/collapse via CSS grid-rows trick - Hidden when collapsed */}
        {hasSubItems && !isCollapsed && (
          <div
            className={cn(
              'grid transition-all duration-300 ease-in-out',
              isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            )}>
            <div className="overflow-hidden">
              <div className="mt-1 ml-4 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-1">
                {item.subItems?.map((subItem) => {
                  const isSubActive = currentPathname === subItem.href;

                  return (
                    <button
                      key={subItem.href}
                      onClick={() => onNavigate?.(subItem.href)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200',
                        'hover:translate-x-0.5',
                        isSubActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                      )}>
                      {subItem.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

NavItem.displayName = 'NavItem';

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

const DashboardSidebar = memo(function DashboardSidebar({
  className,
  userType,
  isCollapsed = false,
  onToggleCollapse,
}: DashboardSidebarProps) {
  // CRITICAL: Default to 'applicant' (safer - more restricted) when userType is undefined
  // This prevents showing SALN to users whose profile hasn't loaded yet
  const effectiveUserType = userType ?? 'applicant';
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { data: unreadNotificationCount } = useUnreadCount();

  // Memoize navigation items array based on user type
  const navigationItems = useMemo<NavigationItem[]>(() => {
    if (effectiveUserType === 'applicant') {
      return [
        {
          name: 'Profile',
          href: '/dashboard/profile',
          icon: User,
        },
        {
          name: 'e-PDS',
          icon: FileText,
          subItems: [
            { name: 'Overview', href: '/dashboard/pds' },
            { name: 'Create', href: '/dashboard/pds/create' },
            { name: 'Drafts', href: '/dashboard/pds/drafts' },
            { name: 'Submissions', href: '/dashboard/pds/submissions' },
            { name: 'Pending', href: '/dashboard/pds/pending' },
            { name: 'Archive', href: '/dashboard/pds/archive' },
          ],
        },
        {
          name: 'My Applications',
          href: '/dashboard/applications',
          icon: Briefcase,
        },
        {
          name: 'Open Positions',
          href: '/dashboard/positions',
          icon: Building2,
        },
        {
          name: 'Notifications',
          href: '/dashboard/notifications',
          icon: Bell,
          badge: unreadNotificationCount ?? 0,
        },
        {
          name: 'Settings',
          href: '/dashboard/settings',
          icon: Settings,
        },
      ];
    }

    // Employee navigation (default)
    return [
      {
        name: 'Profile',
        href: '/dashboard/profile',
        icon: User,
      },
      {
        name: 'e-PDS',
        icon: FileText,
        subItems: [
          { name: 'Overview', href: '/dashboard/pds' },
          { name: 'Create', href: '/dashboard/pds/create' },
          { name: 'Drafts', href: '/dashboard/pds/drafts' },
          { name: 'Submissions', href: '/dashboard/pds/submissions' },
          { name: 'Pending', href: '/dashboard/pds/pending' },
          { name: 'Archive', href: '/dashboard/pds/archive' },
        ],
      },
      {
        name: 'e-SALN',
        icon: Landmark,
        subItems: [
          { name: 'Overview', href: '/dashboard/saln' },
          { name: 'Create', href: '/dashboard/saln/create' },
          { name: 'Drafts', href: '/dashboard/saln/drafts' },
          { name: 'Submissions', href: '/dashboard/saln/submissions' },
          { name: 'Pending', href: '/dashboard/saln/pending' },
          { name: 'Archive', href: '/dashboard/saln/archive' },
        ],
      },
      {
        name: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
        badge: unreadNotificationCount ?? 0,
      },
      {
        name: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ];
  }, [effectiveUserType, unreadNotificationCount]);

  // Memoize sign out handler to prevent recreation on every render
  const handleSignOut = useCallback(async () => {
    await signOut();
    // Small delay to ensure all state cleanup completes before page reload
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Force complete page reload to clear all state and go to homepage
    window.location.href = '/';
  }, [signOut]);

  // Memoize navigation click handler
  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  // Memoize user initials calculation
  const userInitials = useMemo(() => {
    if (!user) return 'U';
    return user.email?.[0]?.toUpperCase() || '';
  }, [user]);

  // Handle toggle for expandable items
  const handleToggle = useCallback((itemName: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  }, []);

  // Auto-expand items that contain the current route
  useEffect(() => {
    navigationItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(
          (subItem) => pathname?.startsWith(subItem.href)
        );
        if (hasActiveSubItem) {
          setExpandedItems((prev) => new Set(prev).add(item.name));
        }
      }
    });
  }, [pathname, navigationItems]);

  return (
    <div className={cn('relative flex h-full flex-col', className)}>
      {/* Clean white/dark background with subtle border */}
      <div className="relative z-10 flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        {/* Sidebar Header - Clean and Simple */}
        <div className="flex flex-col gap-4 p-6 border-b border-slate-200 dark:border-slate-800">
          {/* Logo - TUP Logo with clean styling */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center shrink-0">
              <Image
                src="/tup-logo.png"
                alt="TUP Manila Logo"
                width={isCollapsed ? 32 : 40}
                height={isCollapsed ? 32 : 40}
                className="object-contain transition-all duration-300"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  TUPSAFE
                </h1>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Employee Portal
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button - Visible only on tablets (md:flex lg:hidden) */}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="hidden md:flex lg:hidden h-8 w-8 shrink-0 self-center"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Memoized User Info - Only show when not collapsed */}
          {!isCollapsed && (
            <UserInfo
              email={user?.email}
              initials={userInitials}
              avatarUrl={profile?.avatarUrl}
            />
          )}
        </div>

        {/* Navigation - Clean list with subtle hover states */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navigationItems.map((item, index) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isActive = hasSubItems
              ? item.subItems?.some((subItem) => pathname?.startsWith(subItem.href)) ?? false
              : pathname === item.href || pathname?.startsWith(item.href + '/');
            const isExpanded = expandedItems.has(item.name);

            return (
              <div
                key={item.name}>
                <NavItem
                  item={item}
                  isActive={isActive}
                  onClick={() => item.href && handleNavigate(item.href)}
                  isExpanded={isExpanded}
                  onToggle={() => handleToggle(item.name)}
                  onNavigate={handleNavigate}
                  currentPathname={pathname || ''}
                  isCollapsed={isCollapsed}
                />
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer - Theme Toggle + Sign Out */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* Theme Toggle */}
          {isCollapsed ? (
            <div className="flex justify-center">
              <ThemeToggle variant="minimal" size="sm" />
            </div>
          ) : (
            <ThemeToggle variant="button" size="sm" className="w-full [&>div]:w-full [&>div>button]:flex-1" />
          )}

          {/* Sign Out */}
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-3 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-800 dark:hover:text-red-300 transition-all duration-300 active:scale-[0.98]",
              isCollapsed ? "justify-center px-2" : "justify-start",
              !isCollapsed && "hover:translate-x-0.5"
            )}
            onClick={handleSignOut}
            title={isCollapsed ? "Sign Out" : undefined}>
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </div>
  );
});

/**
 * Temporary Password Reminder Banner
 * Shows when profile.temporaryPassword is true (admin-created accounts)
 */
const TemporaryPasswordBanner = memo(function TemporaryPasswordBanner({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 dark:border-amber-600 px-4 py-3 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Your account is using a temporary password
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            For your security, please{' '}
            <Link
              href="/dashboard/settings"
              className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 transition-colors">
              change your password
            </Link>{' '}
            as soon as possible.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30"
          aria-label="Dismiss reminder">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// APPLICANT ROUTE ALLOWLIST - Routes applicants can access
// ============================================================================
const APPLICANT_ALLOWED_ROUTES = [
  '/dashboard/profile',
  '/dashboard/pds',
  '/dashboard/applications',
  '/dashboard/positions',
  '/dashboard/notifications',
  '/dashboard/settings',
] as const;

/**
 * Check if a pathname is allowed for applicants
 */
function isApplicantAllowedRoute(pathname: string): boolean {
  return APPLICANT_ALLOWED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading, profileLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showPasswordBanner, setShowPasswordBanner] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load/save collapsed state from localStorage
  useEffect(() => {
    if (mounted) {
      const savedState = localStorage.getItem('employee-sidebar-collapsed');
      if (savedState !== null) {
        setSidebarCollapsed(savedState === 'true');
      }
    }
  }, [mounted]);

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('employee-sidebar-collapsed', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed, mounted]);

  // Toggle sidebar collapse callback
  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !loading && !user) {
      // Store the current path to redirect back after login
      const currentPath = window.location.pathname;
      router.push(`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`);
    }
  }, [user, loading, router, mounted]);

  // CRITICAL: Redirect pending users to pending-approval page
  // This is a client-side check to complement the middleware
  // (Middleware only runs on server requests, not client-side navigation)
  useEffect(() => {
    if (mounted && !loading && user && profile) {
      const accountStatus = profile.accountStatus;

      // If account is not active, redirect to pending-approval
      if (accountStatus && accountStatus !== 'active') {
        console.log(
          `[Dashboard Layout] ⚠️ Account status is '${accountStatus}', redirecting to pending-approval`
        );
        router.replace('/auth/pending-approval');
      }
    }
  }, [mounted, loading, user, profile, router]);

  // ============================================================================
  // APPLICANT ROUTE PROTECTION - Block applicants from employee-only routes
  // ============================================================================
  useEffect(() => {
    // Wait for profile to load
    if (!mounted || loading || profileLoading || !profile || !pathname) {
      return;
    }

    // Only enforce for applicants
    if (profile.userType === 'applicant') {
      // Check if current route is allowed
      if (!isApplicantAllowedRoute(pathname)) {
        console.log(
          `[Dashboard Layout] 🚫 Applicant blocked from: ${pathname}, redirecting to /dashboard/profile`
        );
        router.replace('/dashboard/profile');
      }

      // Redirect /dashboard base route to /dashboard/profile for applicants
      if (pathname === '/dashboard') {
        console.log(
          '[Dashboard Layout] Redirecting applicant from /dashboard to /dashboard/profile'
        );
        router.replace('/dashboard/profile');
      }
    }
  }, [mounted, loading, profileLoading, profile, pathname, router]);

  // Determine user type from profile (now fetched from AuthProvider)
  // Profile includes userType field (employee | applicant)
  // This determines which navigation items are shown in the sidebar
  // CRITICAL: Do NOT default to 'employee' - wait for profile to load
  const userType: 'employee' | 'applicant' | undefined = profile?.userType;

  // Show loading state while checking authentication or profile
  // CRITICAL: Wait for profile to load before rendering sidebar (to get correct userType)
  if (!mounted || loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 dark:border-slate-700 border-t-primary"></div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // CRITICAL: Don't render dashboard if account is not active (will redirect)
  // This prevents any flash of dashboard content for pending users
  if (profile && profile.accountStatus && profile.accountStatus !== 'active') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 dark:border-slate-700 border-t-primary"></div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Checking account status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Mobile Header - Fixed top bar with menu toggle */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 border-b bg-white dark:bg-slate-900 px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="h-9 w-9 shrink-0">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Image
            src="/tup-logo.png"
            alt="TUP Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="text-sm font-semibold">TUPSAFE</span>
        </div>
      </div>

      {/* Desktop/Tablet Sidebar */}
      <aside className={cn(
        "hidden shrink-0 border-r shadow-sm transition-all duration-300 md:block",
        sidebarCollapsed ? "md:w-20 lg:w-72" : "md:w-72"
      )}>
        <DashboardSidebar
          userType={userType}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <DashboardSidebar userType={userType} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-screen-2xl px-4 pt-20 pb-6 md:pt-6 md:px-6 lg:px-8 lg:py-8">
          {/* Temporary Password Reminder Banner */}
          {profile?.temporaryPassword && showPasswordBanner && (
            <TemporaryPasswordBanner
              onDismiss={() => setShowPasswordBanner(false)}
            />
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
