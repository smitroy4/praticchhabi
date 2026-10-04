'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { demoAccounts } from '@/lib/demoAccounts';
import { useAuth } from '@/lib/auth';
import { Palette, Pencil, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(email, password);
      router.push(getDashboardRoute(user.role));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Use demo/demo or select a demo account below.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (user: { email: string; role: string }) => {
    setError('');
    setIsLoading(true);
    try {
      const signedIn = await login(user.email, 'demo');
      router.push(getDashboardRoute(signedIn.role));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in with that demo account.');
      setIsLoading(false);
    }
  };

  const getDashboardRoute = (role: string) => {
    switch (role) {
      case 'admin': return '/admin/dashboard';
      case 'teacher': return '/teacher/dashboard';
      default: return '/student/home';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-light text-primary mb-4">
            <Palette className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-light tracking-tight text-foreground">praticchhabi</h1>
          <p className="text-sm text-muted-foreground mt-2">Drawing School &mdash; Sign in to continue</p>
        </div>

        <Card variant="elevated" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-error-light border border-error/20 rounded-lg text-sm text-error" role="alert">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@praticchhabi.com"
              autoComplete="email"
              required
              disabled={isLoading || authLoading}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                disabled={isLoading || authLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground transition-smooth"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading || authLoading}>
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider text-muted-foreground">
              <span className="bg-surface px-2">Or continue with demo account</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3" role="list" aria-label="Demo accounts">
            {demoAccounts.map(user => (
              <button
                key={user.id}
                onClick={() => handleDemoLogin(user)}
                disabled={isLoading || authLoading}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted transition-smooth pressable',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
                role="listitem"
                aria-label={`Sign in as ${user.name} (${user.role})`}
              >
                <Avatar src={user.avatar} name={user.name} size="sm" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Demo password: <code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">demo</code>
        </p>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground">
        <Pencil className="h-3.5 w-3.5" />
        <span>Praticchhabi Drawing School</span>
      </div>
    </div>
  );
}