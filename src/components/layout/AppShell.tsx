'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  children: ReactNode;
  role: 'student' | 'teacher' | 'admin';
  showBottomNav?: boolean;
  showTopBar?: boolean;
  topBarTitle?: string;
  topBarAction?: ReactNode;
}

function homeFor(role: string): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'teacher') return '/teacher/dashboard';
  return '/student/home';
}

export function AppShell({ children, role, showBottomNav = true, showTopBar = false, topBarTitle, topBarAction }: AppShellProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== role) router.replace(homeFor(user.role));
  }, [isLoading, user, role, router]);

  if (isLoading || !user || user.role !== role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar role={role} />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {showTopBar && <TopBar title={topBarTitle} action={topBarAction} />}
        <main className="flex-1 pb-[calc(70px+env(safe-area-inset-bottom))] md:pb-8">
          {children}
        </main>
        {showBottomNav && <BottomNavigation role={role} />}
      </div>
    </div>
  );
}
