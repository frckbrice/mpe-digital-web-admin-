'use client';

import { ReactNode, useEffect, memo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useLogout } from '@/components/features/auth';
import { useTheme } from '@/components/ThemeProvider';
import {
  Loader2,
  LogOut,
  LayoutDashboard,
  BarChart2,
  ExternalLink,
  FileText,
  UserCog,
  User,
  Users,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { FlagIcon } from '@/components/ui/FlagIcon';
import { NotificationsDropdown } from '@/components/features/notifications';
import i18n from '@/lib/i18n/config';
import type { Locale } from '@/constants';

const MPE_WEB_APP_URL = getMpeWebAppBaseUrl() || process.env.NEXT_PUBLIC_MPE_WEB_APP_URL || '#';

const ADMIN_BADGE_CLASS = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';

const nav = [
  { href: '/dashboard', labelKey: 'dashboard.layout.navDashboard', icon: LayoutDashboard },
  { href: '/dashboard/stats', labelKey: 'dashboard.layout.navStats', icon: BarChart2 },
  { href: '/dashboard/quotes', labelKey: 'dashboard.layout.navQuotes', icon: FileText },
  { href: '/dashboard/clients', labelKey: 'dashboard.layout.navClients', icon: User },
  { href: '/dashboard/agents', labelKey: 'dashboard.layout.navAgents', icon: UserCog },
  { href: '/dashboard/users', labelKey: 'dashboard.layout.navUsers', icon: Users },
  { href: '/dashboard/profile', labelKey: 'dashboard.layout.navProfile', icon: User },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const logout = useLogout();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentLocale = (i18n.language?.split('-')[0] as Locale) || 'fr';

  const toggleLocale = () => {
    const newLocale: Locale = currentLocale === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLocale).catch(() => { });
    if (typeof window !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; sameSite=lax`;
    }
  };

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
    if (!user) return '?';
    const fromName = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
    if (fromName) return fromName;
    return (user.email?.charAt(0) || '?').toUpperCase();
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
                    <SheetTitle className="text-left text-foreground">{t('dashboard.layout.navigation')}</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 space-y-2 overflow-hidden">
                    {nav.map(({ href, labelKey, icon: Icon }) => (
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
                        <span className="truncate">{t(labelKey)}</span>
                      </Link>
                    ))}
                  </nav>
                  <Separator className="my-4" />
                  <div className="space-y-3 px-4">
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label={t('common.toggleTheme')}
                    >
                      {theme === 'dark' ? '☀️' : '🌙'}
                      <span>{theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}</span>
                    </button>
                    <button
                      onClick={toggleLocale}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <FlagIcon locale={currentLocale === 'en' ? 'fr' : 'en'} className="w-5 h-5" />
                      <span>{currentLocale === 'en' ? 'FR' : 'EN'}</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>

              <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0">
                <div className="relative w-32 h-32 xl:w-36 xl:h-36 flex-shrink-0">
                  <Image
                    src="/images/logo-icon.png"
                    alt={t('dashboard.layout.logoAlt')}
                    width={96}
                    height={96}
                    className="object-contain w-full h-full"
                    priority
                  />
                </div>
                <span className="font-bold text-base sm:text-xl md:text-2xl leading-tight text-primary truncate hidden sm:inline">
                  {t('dashboard.layout.brandName')}
                </span>
                <span className="font-bold text-base sm:text-xl leading-tight text-primary truncate sm:hidden">
                  {t('dashboard.layout.brandNameAdmin')}
                </span>
              </Link>
            </div>

            {/* Right: theme, locale, user dropdown */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary transition-colors rounded-md dark:hover:bg-primary/50 border border-none bg-primary hover:border hover:border-primary flex-shrink-0"
                aria-label={t('common.toggleTheme')}
                title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
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

              <button
                onClick={toggleLocale}
                className="relative px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white transition-colors border border-slate-600 dark:border-neutral-700 rounded-md hover:border-primary dark:hover:border-primary overflow-hidden flex-shrink-0 whitespace-nowrap"
              >
                <div className="absolute inset-0 opacity-50">
                  <FlagIcon locale={currentLocale === 'en' ? 'fr' : 'en'} className="w-full h-full" />
                </div>
                <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-semibold">
                  {currentLocale === 'en' ? 'FR' : 'EN'}
                </span>
              </button>

              <NotificationsDropdown />

              <Separator orientation="vertical" className="h-6 hidden sm:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-1">
                    <Avatar className="h-9 w-9">
                      {user?.profilePicture ? (
                        <AvatarImage src={user.profilePicture} alt={`${user?.firstName} ${user?.lastName}`} />
                      ) : null}
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
                      <Badge className={cn('w-fit mt-1', ADMIN_BADGE_CLASS)}>
                        {t('dashboard.layout.admin')}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={MPE_WEB_APP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t('dashboard.layout.openMpeWeb')}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {t('dashboard.layout.profile')}
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
                        {t('dashboard.layout.loggingOut')}
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('dashboard.layout.logout')}
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
              {nav.map(({ href, labelKey, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <NavLink key={href} href={href} icon={Icon} isActive={isActive}>
                    {t(labelKey)}
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
