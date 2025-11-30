'use client';

import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Landmark,
  Settings,
  LogOut,
  Menu,
  User,
  Briefcase,
  Building2,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

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
}

interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  onClick: () => void;
  prefersReducedMotion: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onNavigate?: (href: string) => void;
  currentPathname?: string;
}

interface UserInfoProps {
  email?: string;
  initials: string;
  prefersReducedMotion: boolean;
}

interface DashboardSidebarProps {
  className?: string;
  userType?: 'employee' | 'applicant';
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to detect if user prefers reduced motion
 * Respects system accessibility preferences
 */
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

/**
 * Returns animation props based on reduced motion preference
 * Disables animations if user prefers reduced motion
 */
function getAnimationProps(
  prefersReducedMotion: boolean,
  animationProps: object
) {
  return prefersReducedMotion ? {} : animationProps;
}

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

/**
 * Minimalistic UserInfo component with clean design
 * Simple hover effect with subtle scale
 */
const UserInfo = memo<UserInfoProps>(
  ({ email, initials, prefersReducedMotion }) => {
    return (
      <motion.div
        className="group cursor-pointer"
        {...getAnimationProps(prefersReducedMotion, {
          initial: { opacity: 0, y: -8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: 'easeOut' },
        })}>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 transition-all duration-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-[#093FB4]/20 dark:hover:border-[#093FB4]/30">
          <motion.div
            {...getAnimationProps(prefersReducedMotion, {
              whileHover: { scale: 1.05 },
              transition: { duration: 0.2 },
            })}>
            <Avatar className="h-10 w-10 ring-2 ring-slate-200 dark:ring-slate-700 transition-all duration-300 group-hover:ring-primary/30">
              <AvatarFallback className="bg-primary text-white font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {email || 'user@gov.ph'}
            </p>
          </div>
        </div>
      </motion.div>
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
    prefersReducedMotion,
    isExpanded,
    onToggle,
    onNavigate,
    currentPathname
  }) => {
    const Icon = item.icon;
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div>
        <motion.button
          onClick={hasSubItems ? onToggle : onClick}
          {...getAnimationProps(prefersReducedMotion, {
            whileHover: { x: 2 },
            whileTap: { scale: 0.98 },
            transition: { duration: 0.2 },
          })}
          className={cn(
            'relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group',
            isActive
              ? 'bg-primary text-white shadow-sm shadow-primary/20'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
          )}>
          <Icon
            className={cn(
              'h-5 w-5 transition-all duration-300',
              isActive
                ? 'text-white'
                : 'text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-primary'
            )}
          />
          <span className="flex-1 text-left">{item.name}</span>

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
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-1.5 w-1.5 rounded-full bg-white"
            />
          ) : null}
        </motion.button>

        {/* Sub-items with smooth expand/collapse animation */}
        {hasSubItems && (
          <motion.div
            initial={false}
            animate={{
              height: isExpanded ? 'auto' : 0,
              opacity: isExpanded ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden">
            <div className="mt-1 ml-4 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-1">
              {item.subItems?.map((subItem) => {
                const isSubActive = currentPathname === subItem.href;

                return (
                  <motion.button
                    key={subItem.href}
                    onClick={() => onNavigate?.(subItem.href)}
                    {...getAnimationProps(prefersReducedMotion, {
                      whileHover: { x: 2 },
                      transition: { duration: 0.2 },
                    })}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200',
                      isSubActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                    )}>
                    {subItem.name}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
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
  userType = 'employee',
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Memoize navigation items array based on user type
  const navigationItems = useMemo<NavigationItem[]>(() => {
    if (userType === 'applicant') {
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
          { name: 'Create', href: '/dashboard/saln/create' },
          { name: 'Submissions', href: '/dashboard/saln/submissions' },
          { name: 'Pending', href: '/dashboard/saln/pending' },
          { name: 'Archive', href: '/dashboard/saln/archive' },
        ],
      },
      {
        name: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ];
  }, [userType]);

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
          {/* Logo - Minimalistic with single accent color */}
          <motion.div
            className="flex items-center gap-3"
            {...getAnimationProps(prefersReducedMotion, {
              initial: { opacity: 0, y: -12 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5, ease: 'easeOut' },
            })}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                TUPSAFE
              </h1>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Employee Portal
              </span>
            </div>
          </motion.div>

          {/* Memoized User Info */}
          <UserInfo
            email={user?.email}
            initials={userInitials}
            prefersReducedMotion={prefersReducedMotion}
          />
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
              <motion.div
                key={item.name}
                {...getAnimationProps(prefersReducedMotion, {
                  initial: { opacity: 0, x: -12 },
                  animate: { opacity: 1, x: 0 },
                  transition: {
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: 'easeOut',
                  },
                })}>
                <NavItem
                  item={item}
                  isActive={isActive}
                  onClick={() => item.href && handleNavigate(item.href)}
                  prefersReducedMotion={prefersReducedMotion}
                  isExpanded={isExpanded}
                  onToggle={() => handleToggle(item.name)}
                  onNavigate={handleNavigate}
                  currentPathname={pathname || ''}
                />
              </motion.div>
            );
          })}
        </nav>

        {/* Sidebar Footer - Simple Sign Out Button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <motion.div
            {...getAnimationProps(prefersReducedMotion, {
              whileHover: { x: 2 },
              whileTap: { scale: 0.98 },
            })}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300"
              onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !loading && !user) {
      // Store the current path to redirect back after login
      const currentPath = window.location.pathname;
      router.push(`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`);
    }
  }, [user, loading, router, mounted]);

  // Determine user type from profile (now fetched from AuthProvider)
  // Profile includes userType field (employee | applicant)
  // This determines which navigation items are shown in the sidebar
  const userType: 'employee' | 'applicant' = profile?.userType || 'employee';

  // Show loading state while checking authentication
  if (!mounted || loading) {
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-shrink-0">
        <DashboardSidebar userType={userType} />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <DashboardSidebar userType={userType} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
