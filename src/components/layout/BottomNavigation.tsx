'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Calendar, ClipboardList, Megaphone, User, LayoutDashboard, Users, Settings } from 'lucide-react';
import Link from 'next/link';

const navigationItems = {
  student: [
    { href: '/student/home', label: 'Home', icon: Home, activePatterns: ['/student/home'] },
    { href: '/student/calendar', label: 'Calendar', icon: Calendar, activePatterns: ['/student/calendar'] },
    { href: '/student/homework', label: 'Homework', icon: ClipboardList, activePatterns: ['/student/homework'] },
    { href: '/student/announcements', label: 'Announcements', icon: Megaphone, activePatterns: ['/student/announcements'] },
    { href: '/student/profile', label: 'Profile', icon: User, activePatterns: ['/student/profile'] },
  ],
  teacher: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard, activePatterns: ['/teacher/dashboard'] },
    { href: '/teacher/calendar', label: 'Calendar', icon: Calendar, activePatterns: ['/teacher/calendar'] },
    { href: '/teacher/homework', label: 'Homework', icon: ClipboardList, activePatterns: ['/teacher/homework'] },
    { href: '/teacher/announcements', label: 'Announcements', icon: Megaphone, activePatterns: ['/teacher/announcements'] },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, activePatterns: ['/admin/dashboard'] },
    { href: '/admin/students', label: 'Students', icon: Users, activePatterns: ['/admin/students'] },
    { href: '/admin/calendar', label: 'Calendar', icon: Calendar, activePatterns: ['/admin/calendar'] },
    { href: '/admin/homework', label: 'Homework', icon: ClipboardList, activePatterns: ['/admin/homework'] },
    { href: '/admin/announcements', label: 'Announcements', icon: Megaphone, activePatterns: ['/admin/announcements'] },
    { href: '/admin/settings', label: 'Settings', icon: Settings, activePatterns: ['/admin/settings'] },
  ],
};

interface BottomNavigationProps {
  role: 'student' | 'teacher' | 'admin';
  className?: string;
}

export function BottomNavigation({ role, className }: BottomNavigationProps) {
  const pathname = usePathname();
  const items = navigationItems[role];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border safe-area-inset-bottom',
        'md:hidden',
        className
      )}
      aria-label="Main navigation"
    >
      <div className="grid gap-1 px-1.5 py-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const isActive = item.activePatterns.some(pattern => pathname?.startsWith(pattern));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-1 py-2.5 rounded-lg transition-smooth pressable',
                isActive
                  ? 'text-primary bg-primary-light'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon className={cn('h-5 w-5', isActive && 'fill-current')} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}