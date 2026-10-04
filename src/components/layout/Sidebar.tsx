'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  Home, Calendar, ClipboardList, Megaphone, User, LayoutDashboard,
  Users, Settings, LogOut, Palette,
} from 'lucide-react';

const navItems = {
  student: [
    { href: '/student/home', label: 'Home', icon: Home },
    { href: '/student/calendar', label: 'Calendar', icon: Calendar },
    { href: '/student/homework', label: 'Homework', icon: ClipboardList },
    { href: '/student/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/student/profile', label: 'Profile', icon: User },
  ],
  teacher: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teacher/calendar', label: 'Calendar', icon: Calendar },
    { href: '/teacher/homework', label: 'Homework', icon: ClipboardList },
    { href: '/teacher/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/teacher/students', label: 'Students', icon: Users },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
    { href: '/admin/homework', label: 'Homework', icon: ClipboardList },
    { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ],
};

const roleLabels = { student: 'Student', teacher: 'Teacher', admin: 'Admin' } as const;

interface SidebarProps {
  role: 'student' | 'teacher' | 'admin';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const items = navItems[role];

  return (
    <aside
      className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-surface border-r border-border z-40"
      aria-label="Sidebar navigation"
    >
      <div className="px-5 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
          <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
            <Palette className="h-4.5 w-4.5" />
          </span>
          <span className="text-lg font-light tracking-tight text-foreground">praticchhabi</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth pressable',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'bg-primary-light text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 mb-3">
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-error"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}