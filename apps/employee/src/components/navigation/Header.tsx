'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Shield, FileText, Users, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@smartgov/mock-data/api';

// UI Components
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Theme Components
import { ThemeToggle } from '@/components/theme/ThemeToggle';

// Types
interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  items?: NavigationSubItem[];
}

interface NavigationSubItem {
  name: string;
  href: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// Navigation configuration
const navigationItems: NavigationItem[] = [
  {
    name: 'Home',
    href: '/',
  },
  {
    name: 'Features',
    href: '#features',
    icon: FileText,
    description: 'Explore our government compliance features',
    items: [
      {
        name: 'e-PDS System',
        href: '/features/pds',
        description: 'Digital Personal Data Sheet management',
        icon: FileText,
      },
      {
        name: 'e-SALN System',
        href: '/features/saln',
        description: 'Statement of Assets, Liabilities, and Net Worth',
        icon: Shield,
      },
      {
        name: 'AI Assistant',
        href: '/features/ai-compliance',
        description: 'Get help with compliance questions',
        icon: Users,
      },
    ],
  },
  {
    name: 'About',
    href: '/about',
  },
];

// Smooth scroll handler with router awareness
const handleNavClick = (
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  pathname: string,
  router?: ReturnType<typeof useRouter>
) => {
  // For hash links (like #features), handle scroll only if on homepage
  if (href.startsWith('#')) {
    if (pathname === '/') {
      // Already on homepage, just scroll
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to homepage first, then scroll
      e.preventDefault();
      if (router) {
        router.push('/' + href);
      } else {
        window.location.href = '/' + href;
      }
    }
  }
  // For regular links, let Next.js Link component handle navigation
};

// Mobile Navigation Component
const MobileNavigation: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}> = ({ isOpen, onClose, user, onLogout }) => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-80 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <SheetHeader className="text-left pb-6">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-government font-bold">SmartGov</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-2 flex-1 px-1">
          {navigationItems.map((item, index) => (
            <div
              key={item.name}
              className="space-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}>
              <Link
                href={item.href}
                onClick={(e) => {
                  handleNavClick(e, item.href, pathname, router);
                  onClose();
                }}
                className={cn(
                  'group flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-all duration-300',
                  'hover:bg-primary/10 hover:text-primary hover:shadow-sm',
                  'focus-government relative overflow-hidden',
                  'border border-transparent hover:border-primary/20',
                  'transform hover:scale-[1.01] active:scale-[0.99]',
                  pathname === item.href
                    ? 'bg-primary/15 text-primary border-primary/30 shadow-sm'
                    : 'text-foreground/80 hover:text-foreground'
                )}>
                {item.icon && (
                  <item.icon className="h-4 w-4 transition-colors" />
                )}
                {item.name}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              {item.items && (
                <div className="ml-6 space-y-2 border-l border-border/30 pl-4">
                  {item.items.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-start gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-200',
                        'hover:bg-primary/8 hover:text-primary',
                        'focus-government',
                        pathname === subItem.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/70 hover:text-foreground'
                      )}>
                      {subItem.icon && (
                        <subItem.icon className="h-3 w-3 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{subItem.name}</div>
                        <div className="text-muted-foreground text-xs leading-tight mt-1">
                          {subItem.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border/30">
          <div className="flex flex-col gap-3 px-1">
            {user ? (
              <>
                <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Signed in</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="btn-government-ghost w-full justify-center h-12 text-base font-medium">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="btn-government-ghost w-full justify-center h-12 text-base font-medium">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  variant="default"
                  className="btn-government w-full justify-center h-12 text-base font-medium shadow-lg">
                  <Link href="/auth/register">Get Started</Link>
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2 px-4">
                  Secure government employee portal
                </p>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Desktop Navigation Component
const DesktopNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="gap-1">
        {navigationItems.map((item) => (
          <NavigationMenuItem key={item.name}>
            {item.items ? (
              <>
                <NavigationMenuTrigger
                  className={cn(
                    'h-9 px-4 py-2 rounded-full transition-all duration-300',
                    'hover:bg-primary/10 hover:text-primary hover:shadow-md',
                    'data-[state=open]:bg-primary/10 data-[state=open]:text-primary',
                    'focus-government text-sm font-medium',
                    'border border-transparent hover:border-primary/20',
                    'transform hover:scale-105 active:scale-95'
                  )}>
                  <span className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.name}
                  </span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-2xl">
                    <div className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          onClick={(e) => handleNavClick(e, item.href, pathname, router)}
                          className="flex h-full w-full select-none flex-col justify-end rounded-xl bg-gradient-government-soft p-6 no-underline outline-none focus:shadow-md hover:shadow-lg transition-all duration-300">
                          {item.icon && (
                            <item.icon className="h-6 w-6 text-government" />
                          )}
                          <div className="mb-2 mt-4 text-lg font-medium text-government">
                            {item.name}
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            {item.description}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                    <div className="grid gap-2">
                      {item.items.map((subItem) => (
                        <NavigationMenuLink key={subItem.name} asChild>
                          <Link
                            href={subItem.href}
                            className="group grid h-auto w-full items-center justify-start gap-1 rounded-xl bg-background/50 hover:bg-primary/5 p-4 text-sm no-underline outline-none transition-all duration-300 border border-transparent hover:border-primary/20">
                            <div className="flex items-center gap-2">
                              {subItem.icon && (
                                <subItem.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              )}
                              <div className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                                {subItem.name}
                              </div>
                            </div>
                            <div className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                              {subItem.description}
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink asChild>
                <Link
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, pathname, router)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
                    'transition-all duration-300 focus-government',
                    'hover:bg-primary/10 hover:text-primary hover:shadow-md',
                    'border border-transparent hover:border-primary/20',
                    'transform hover:scale-105 active:scale-95',
                    pathname === item.href
                      ? 'bg-primary/15 text-primary shadow-sm border-primary/30'
                      : 'text-muted-foreground hover:text-foreground'
                  )}>
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.name}
                </Link>
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

// Tablet Navigation Component (condensed version for medium screens)
const TabletNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const essentialItems = navigationItems.filter((item) =>
    ['Home', 'Features', 'About'].includes(item.name)
  );

  return (
    <NavigationMenu className="hidden md:flex lg:hidden">
      <NavigationMenuList className="gap-1">
        {essentialItems.map((item) => (
          <NavigationMenuItem key={item.name}>
            <NavigationMenuLink asChild>
              <Link
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, pathname, router)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
                  'transition-all duration-300 focus-government',
                  'hover:bg-primary/10 hover:text-primary hover:shadow-md',
                  'border border-transparent hover:border-primary/20',
                  'transform hover:scale-105 active:scale-95',
                  pathname === item.href
                    ? 'bg-primary/15 text-primary shadow-sm border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                )}>
                {item.icon && <item.icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

// Main Header Component
export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Hide header on dashboard routes
  const shouldHideHeader = pathname.startsWith('/dashboard');

  // Handle logout with navigation
  const handleLogout = async () => {
    await signOut();
    // Use hard redirect to ensure complete state reset
    window.location.href = '/';
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle component mount animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Don't render header on dashboard pages
  if (shouldHideHeader) {
    return null;
  }

  return (
    <>
      {/* Floating Pill-Shaped Navbar */}
      <header
        className={cn(
          'fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ease-out',
          'transform-gpu will-change-transform',
          isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'
        )}>
        <div
          className={cn(
            'flex items-center justify-between',
            'px-4 py-2 mx-4',
            'rounded-full border shadow-lg',
            'transition-all duration-500 ease-out',
            'backdrop-blur-md',
            // Dynamic sizing based on screen
            'w-auto max-w-4xl min-w-[280px]',
            // Background and border effects
            isScrolled
              ? 'bg-background/80 border-border/50 shadow-xl shadow-black/10'
              : 'bg-background/70 border-border/30 shadow-lg shadow-black/5',
            // Hover effects
            'hover:bg-background/85 hover:border-border/60 hover:shadow-xl'
          )}>
          {/* Logo Section - Left */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={user ? "/dashboard/profile" : "/"}
              className="group flex items-center gap-2 transition-all duration-300 hover:scale-105 focus-government rounded-full p-1">
              <div className="relative">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-primary transition-all duration-300 group-hover:rotate-12" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm -z-10 transition-all duration-300 group-hover:bg-primary/30 group-hover:scale-110" />
              </div>
              <span className="text-base sm:text-lg font-bold text-government transition-all duration-300 group-hover:text-primary hidden xs:inline">
                SmartGov
              </span>
              <span className="text-sm font-bold text-government transition-all duration-300 group-hover:text-primary xs:hidden">
                SG
              </span>
            </Link>
          </div>

          {/* Navigation - Center */}
          <div className="flex-1 flex justify-center mx-4">
            <DesktopNavigation />
            <TabletNavigation />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme Toggle */}
            <ThemeToggle variant="minimal" size="sm" />

            {/* Auth Buttons - Desktop & Tablet */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20">
                    <UserIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-foreground max-w-[120px] truncate">
                      {user.email}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="btn-government-ghost rounded-full h-8 px-3 text-xs font-medium">
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="btn-government-ghost rounded-full h-8 px-3 text-xs font-medium">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="btn-government rounded-full h-8 px-3 text-xs font-medium">
                    <Link href="/auth/register">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'md:hidden rounded-full h-8 w-8 p-0 relative overflow-hidden',
                'hover:bg-primary/10 transition-all duration-300',
                'focus-government'
              )}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu">
              <Menu className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
              <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
};

export default Header;
