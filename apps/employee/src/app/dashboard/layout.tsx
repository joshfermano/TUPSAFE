'use client';

import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@tupsafe/mock-data/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Landmark,
  Settings,
  LogOut,
  Menu,
  User,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  onClick: () => void;
  prefersReducedMotion: boolean;
}

interface UserInfoProps {
  email?: string;
  initials: string;
  prefersReducedMotion: boolean;
}

interface DashboardSidebarProps {
  className?: string;
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
function getAnimationProps(prefersReducedMotion: boolean, animationProps: object) {
  return prefersReducedMotion ? {} : animationProps;
}

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

/**
 * Minimalistic UserInfo component with clean design
 * Simple hover effect with subtle scale
 */
const UserInfo = memo<UserInfoProps>(({ email, initials, prefersReducedMotion }) => {
  return (
    <motion.div
      className="group cursor-pointer"
      {...getAnimationProps(prefersReducedMotion, {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' }
      })}
    >
<<<<<<< HEAD
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 transition-all duration-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-[#093FB4]/20 dark:hover:border-[#093FB4]/30">
=======
      <div className="relative flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-300 group-hover:border-[#8B1538]/30 group-hover:shadow-lg group-hover:shadow-[#8B1538]/10">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8B1538]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

>>>>>>> 71598573d189041eaa79c66dfb2f6ac4867149a6
        <motion.div
          {...getAnimationProps(prefersReducedMotion, {
            whileHover: { scale: 1.05 },
            transition: { duration: 0.2 }
          })}
        >
<<<<<<< HEAD
          <Avatar className="h-10 w-10 ring-2 ring-slate-200 dark:ring-slate-700 transition-all duration-300 group-hover:ring-[#093FB4]/30">
            <AvatarFallback className="bg-[#093FB4] text-white font-semibold text-sm">
=======
          <Avatar className="h-10 w-10 border-2 border-[#8B1538]/20 group-hover:border-[#8B1538]/40 transition-colors duration-300">
            <AvatarFallback className="bg-gradient-to-br from-[#8B1538] to-[#B8264D] text-white font-semibold">
>>>>>>> 71598573d189041eaa79c66dfb2f6ac4867149a6
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
});

UserInfo.displayName = 'UserInfo';

/**
 * Clean, minimalistic NavItem component
 * Simple design with subtle hover effect and smooth transitions
 */
const NavItem = memo<NavItemProps>(({ item, isActive, onClick, prefersReducedMotion }) => {
  const Icon = item.icon;

  return (
    <motion.button
      onClick={onClick}
      {...getAnimationProps(prefersReducedMotion, {
        whileHover: { x: 2 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.2 }
      })}
      className={cn(
        "relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group",
        isActive
          ? "bg-[#093FB4] text-white shadow-sm shadow-[#093FB4]/20"
          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
      )}
    >
<<<<<<< HEAD
      <Icon
        className={cn(
          "h-5 w-5 transition-all duration-300",
          isActive
            ? "text-white"
            : "text-slate-500 dark:text-slate-400 group-hover:text-[#093FB4] dark:group-hover:text-[#093FB4]"
        )}
      />
      <span className="flex-1 text-left">{item.name}</span>
=======
      {/* Active state static gradient background - removed infinite animation */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#8B1538] via-[#B8264D] to-[#8B1538]" />
      )}

      {/* Hover glow effect */}
      {!isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#8B1538]/5 via-[#B8264D]/10 to-[#8B1538]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
      )}

      {/* Hover border glow */}
      <motion.div
        className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-[#8B1538]/20 transition-colors duration-300"
      />

      <motion.div
        {...getAnimationProps(prefersReducedMotion, {
          whileHover: { rotate: isActive ? 0 : 5, scale: 1.1 },
          transition: { type: "spring", stiffness: 400, damping: 10 }
        })}
        className="relative z-10"
      >
        <Icon
          className={cn(
            "h-5 w-5 transition-all duration-300",
            isActive
              ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
              : "text-slate-500 dark:text-slate-400 group-hover:text-[#8B1538] dark:group-hover:text-[#B8264D]"
          )}
        />
      </motion.div>

      <span className="relative flex-1 text-left z-10">{item.name}</span>
>>>>>>> 71598573d189041eaa79c66dfb2f6ac4867149a6

      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-1.5 w-1.5 rounded-full bg-white"
        />
      )}
    </motion.button>
  );
});

NavItem.displayName = 'NavItem';

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  // Memoize navigation items array to prevent recreation on every render
  const navigationItems = useMemo<NavigationItem[]>(() => [
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
    },
    {
      name: 'e-PDS',
      href: '/dashboard/pds',
      icon: FileText,
    },
    {
      name: 'e-SALN',
      href: '/dashboard/saln',
      icon: Landmark,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ], []);

  // Memoize sign out handler to prevent recreation on every render
  const handleSignOut = useCallback(async () => {
    await signOut();
    // Small delay to ensure all state cleanup completes before page reload
    await new Promise(resolve => setTimeout(resolve, 50));
    // Force complete page reload to clear all state and go to homepage
    window.location.href = '/';
  }, [signOut]);

  // Memoize navigation click handler
  const handleNavigate = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  // Memoize user initials calculation
  const userInitials = useMemo(() => {
    if (!user) return 'U';
    return user.email?.[0]?.toUpperCase() || '';
  }, [user]);

  return (
    <div className={cn("relative flex h-full flex-col", className)}>
<<<<<<< HEAD
      {/* Clean white/dark background with subtle border */}
      <div className="relative z-10 flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">

        {/* Sidebar Header - Clean and Simple */}
        <div className="flex flex-col gap-4 p-6 border-b border-slate-200 dark:border-slate-800">
          {/* Logo - Minimalistic with single accent color */}
=======
      {/* ShineBorder effect wrapper - kept as it's lightweight */}
      <div className="absolute inset-0 pointer-events-none">
        <ShineBorder
          borderWidth={2}
          duration={12}
          shineColor={["#8B1538", "#B8264D", "#8B1538"]}
          className="!rounded-none"
        />
      </div>

      {/* Particles background - reduced from 30 to 15 for better performance */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Particles
            className="absolute inset-0"
            quantity={15}
            ease={80}
            color="#8B1538"
            size={0.5}
            staticity={50}
            refresh={false}
          />
        </div>
      )}

      {/* Main sidebar content with glassmorphism */}
      <div className="relative z-10 flex h-full flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50">
        {/* Sidebar Header */}
        <div className="flex flex-col gap-4 p-6 border-b border-slate-200/50 dark:border-slate-800/50">
          {/* Logo with shimmer effect */}
>>>>>>> 71598573d189041eaa79c66dfb2f6ac4867149a6
          <motion.div
            className="flex items-center gap-3"
            {...getAnimationProps(prefersReducedMotion, {
              initial: { opacity: 0, y: -12 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5, ease: 'easeOut' }
            })}
          >
<<<<<<< HEAD
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#093FB4] shadow-sm">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
=======
            <motion.div
              className="relative flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden"
              {...getAnimationProps(prefersReducedMotion, {
                whileHover: { scale: 1.05 },
                transition: { type: "spring", stiffness: 400, damping: 10 }
              })}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B1538] via-[#B8264D] to-[#6B0F2A]" />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent animate-shimmer" />
              <LayoutDashboard className="relative h-5 w-5 text-white z-10" />
            </motion.div>
            <div className="flex flex-col">
              <AnimatedShinyText className="text-lg font-bold !mx-0 !max-w-none bg-gradient-to-r from-[#8B1538] via-[#B8264D] to-[#8B1538] bg-clip-text text-transparent">
>>>>>>> 71598573d189041eaa79c66dfb2f6ac4867149a6
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
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <motion.div
                key={item.name}
                {...getAnimationProps(prefersReducedMotion, {
                  initial: { opacity: 0, x: -12 },
                  animate: { opacity: 1, x: 0 },
                  transition: { duration: 0.3, delay: index * 0.05, ease: 'easeOut' }
                })}
              >
                <NavItem
                  item={item}
                  isActive={isActive}
                  onClick={() => handleNavigate(item.href)}
                  prefersReducedMotion={prefersReducedMotion}
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
              whileTap: { scale: 0.98 }
            })}
          >
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
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

  // Show loading state while checking authentication
  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
<<<<<<< HEAD
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 dark:border-slate-700 border-t-[#093FB4]"></div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading dashboard...</p>
=======
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading dashboard...</p>
>>>>>>> 71598573d189041eaa79c66dfb2f6ac4867149a6
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
        <DashboardSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <DashboardSidebar />
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
