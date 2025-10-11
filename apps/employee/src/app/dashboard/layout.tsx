'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@smartgov/mock-data/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Landmark,
  Settings,
  LogOut,
  Menu,
  User,
  ChevronRight,
} from 'lucide-react';

const navigation = [
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
];

function DashboardSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.email?.[0]?.toUpperCase() || '';
    return firstInitial;
  };

  return (
    <div className={cn("flex h-full flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800", className)}>
      {/* Sidebar Header */}
      <div className="flex flex-col gap-4 p-6 border-b border-slate-200 dark:border-slate-800">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
              SmartGov
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Employee Portal
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <Avatar className="h-10 w-10 border-2 border-blue-500/20">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {user?.email || 'user@gov.ph'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                )}
              />
              <span className="flex-1 text-left">{item.name}</span>
              {isActive && (
                <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </Button>
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
              className="fixed top-4 left-4 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-lg"
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
