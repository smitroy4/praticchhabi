'use client';

import { ReactNode } from 'react';
import { cn, formatDateShort } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Menu, Bell, LogOut, CheckCheck, Inbox } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useAsync } from '@/lib/useAsync';
import { notificationsApi } from '@/lib/api';

interface TopBarProps {
  title?: string;
  action?: ReactNode;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

function notificationsHome(role: string): string {
  if (role === 'admin') return '/admin/notifications';
  if (role === 'teacher') return '/teacher/notifications';
  return '/student/notifications';
}

export function TopBar({ title, action, showMenu = true, onMenuClick }: TopBarProps) {
  const { user, logout, role } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData, reload, loading } = useAsync(() => notificationsApi.list(), []);
  const notifications = notificationsData?.notifications ?? [];
  const unread = notificationsData?.unreadCount ?? 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openNotifications = () => {
    setShowNotifications((v) => !v);
    setShowProfileMenu(false);
  };

  const markAllRead = async () => {
    await notificationsApi.markRead();
    reload();
  };

  return (
    <header className={cn('sticky top-0 z-30 bg-surface/80 backdrop-blur-sm border-b border-border', 'px-4 py-3')}>
      <div className="max-w-[720px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showMenu && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xl font-light tracking-tight text-foreground">praticchhabi</span>
            {title && <span className="text-sm text-muted-foreground hidden sm:block">/ {title}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {action}

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={openNotifications}
              className="relative"
              aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
              aria-expanded={showNotifications}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-error text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div
                ref={notificationsRef}
                className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-surface border border-border rounded-xl shadow-lg animate-scale-in overflow-hidden"
                role="menu"
                aria-label="Notifications"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">Notifications</p>
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1 pressable"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {loading && (
                    <p className="px-4 py-6 text-sm text-muted-foreground text-center">Loading…</p>
                  )}
                  {!loading && notifications.length === 0 && (
                    <div className="px-4 py-6 text-center">
                      <Inbox className="mx-auto h-8 w-8 text-muted mb-2" />
                      <p className="text-sm text-muted-foreground">You are all caught up.</p>
                    </div>
                  )}
                  {notifications.slice(0, 15).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'px-4 py-3 border-b border-border/50 last:border-0',
                        !n.read && 'bg-primary-light/40'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{formatDateShort(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border p-2">
                  <a
                    href={notificationsHome(role ?? 'student')}
                    onClick={() => setShowNotifications(false)}
                    className="block text-center text-sm text-primary hover:text-primary-hover font-medium py-1.5 pressable"
                  >
                    View all notifications
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              aria-label="Account menu"
              aria-expanded={showProfileMenu}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Avatar src={user?.avatar} name={user?.name} size="sm" />
            </button>

            {showProfileMenu && (
              <div
                ref={profileMenuRef}
                className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-lg py-2 animate-scale-in"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  {user?.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                </div>
                <div className="border-t border-border pt-1">
                  <button
                    onClick={() => { logout(); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-muted transition-smooth pressable"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
