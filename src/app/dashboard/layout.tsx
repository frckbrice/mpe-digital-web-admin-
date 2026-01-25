'use client';

import { ReactNode, useEffect, memo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useLogout } from '@/components/features/auth';
import { useTheme } from '@/components/ThemeProvider';
import {
  Loader2,
  LogOut,
  LayoutDashboard,
  BarChart2,
  ExternalLink,
  FileText,
  Users,
  UserCog,
  User,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getMpeWebAppBaseUrl } from '@/lib/api-client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const MPE_WEB_APP_URL = process.env.NEXT_PUBLIC_MPE_WEB_APP_URL || getMpeWebAppBaseUrl() || '#';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/stats', label: 'Stats', icon: BarChart2 },
  { href: '/dashboard/quotes', label: 'Quotes', icon: FileText },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/agents', label: 'Agents', icon: UserCog },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const logout = useLogout();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, user?.role, router]);

  if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#091a24]">
        <Loader2 className="h-12 w-12 animate-spin text-[#fe4438]" />
      </div>
    );
  }

  const getInitials = () => {
    if (!user) return '??';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation header - same as MPE Web app dashboard */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background dark:bg-[#091a24] border-[#091a24]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo + mobile menu */}
            <div className="flex items-center space-x-1">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-foreground hover:bg-accent dark:hover:bg-primary/50"
                  >
                    <Menu className="h-10 w-10" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-64 max-w-[85vw] bg-background dark:bg-[#091a24] border-r border-border overflow-hidden"
                >
                  <SheetHeader>
                    <SheetTitle className="text-left text-foreground">Navigation</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 space-y-2 overflow-hidden">
                    {nav.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer w-full min-w-0 max-w-full',
                          pathname === href
                            ? 'text-primary-foreground bg-[#fe4438]'
                            : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{label}</span>
                      </Link>
                    ))}
                  </nav>
                  <Separator className="my-4" />
                  <div className="space-y-3 px-4">
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Toggle theme"
                    >
                      {theme === 'dark' ? '☀️' : '🌙'}
                      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                    </button>
                    <a
                      href={MPE_WEB_APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      Open MPE Web app
                    </a>
                  </div>
                </SheetContent>
              </Sheet>

              <Link href="/dashboard" className="flex items-center sm:space-x-3 cursor-pointer">
                <span className="font-bold text-xl sm:text-2xl leading-tight text-primary">MPE Admin</span>
              </Link>
            </div>

            {/* Right: theme, Open MPE, user dropdown */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors rounded-md dark:hover:bg-primary/50 border border-none bg-primary hover:border hover:border-primary"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <a
                href={MPE_WEB_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                Open MPE Web app
              </a>

              <Separator orientation="vertical" className="h-6 hidden sm:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-1">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.profilePicture || undefined} alt={`${user?.firstName} ${user?.lastName}`} />
                      <AvatarFallback className="text-sm font-medium text-primary-foreground bg-primary border border-primary">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      <span className="text-xs text-muted-foreground">Admin</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={MPE_WEB_APP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open MPE Web app
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className="text-red-600 focus:text-red-600"
                  >
                    {logout.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging out…
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative pt-16">
        {/* Sidebar - same colors as MPE Web app dashboard */}
        <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] border-r hidden md:block dark:bg-[#091a24] border-[#091a24] bg-[#178279] overflow-y-auto">
          <div className="w-full">
            <nav className="p-4 space-y-2">
              {nav.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <NavLink key={href} href={href} icon={Icon} isActive={isActive}>
                    {label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-background">
          <div className="mx-auto max-w-7xl w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

const NavLink = memo(function NavLink({
  href,
  icon: Icon,
  isActive,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center justify-between space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
        isActive
          ? 'text-primary-foreground bg-[#fe4438]'
          : 'text-primary-foreground hover:bg-[#0763b6]/80 dark:hover:bg-[#10c455]/40 hover:text-slate-300 border border-white/20'
      )}
    >
      <div className="flex items-center space-x-3">
        <Icon className="h-4 w-4" />
        <span>{children}</span>
      </div>
    </Link>
  );
});
