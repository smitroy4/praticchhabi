'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/useAsync';
import { settingsApi } from '@/lib/api';
import type { AppSettings } from '@/types';
import { User, Shield, Bell, Palette, LogOut, BookOpen, Megaphone, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(() => settingsApi.get(), []);
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const settings = draft ?? data?.settings ?? null;

  const patchSettings = (patch: Partial<AppSettings>) => {
    if (!settings) return;
    setDraft({ ...settings, ...patch });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await settingsApi.save(settings);
      setDraft(saved.settings);
      toast({
        title: 'Settings saved',
        description: 'Your school settings have been updated.',
        type: 'success',
      });
      reload();
    } catch (err) {
      toast({
        title: 'Could not save settings',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell role="admin" showBottomNav showTopBar topBarTitle="Settings">
      <div className="px-4 py-4 max-w-[720px] mx-auto space-y-6">
        <PageHeader
          title="Settings"
          description="Manage school settings and preferences"
          action={
            <Button onClick={handleSave} isLoading={saving} disabled={loading || !settings}>
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          }
        />

        {loading && (
          <div className="space-y-6" aria-busy="true" aria-label="Loading settings">
            <div className="h-40 bg-muted rounded-xl animate-pulse" />
            <div className="h-56 bg-muted rounded-xl animate-pulse" />
            <div className="h-28 bg-muted rounded-xl animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <EmptyState
            title="Could not load settings"
            description={error}
            action={<Button variant="outline" onClick={reload}>Try again</Button>}
          />
        )}

        {!loading && !error && settings && (
          <>
            <section aria-labelledby="general">
              <h3 id="general" className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                General
              </h3>
              <Card variant="default" padding="none">
                <div className="space-y-0">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                        <Palette className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">School Name</p>
                        <p className="text-xs text-muted-foreground">Shown across the app</p>
                      </div>
                    </div>
                    <Input
                      aria-label="School name"
                      value={settings.general.schoolName}
                      onChange={e => patchSettings({ general: { ...settings.general, schoolName: e.target.value } })}
                      className="max-w-[200px]"
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-success-light text-success flex items-center justify-center">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                        <p className="text-xs text-muted-foreground">Disable access for students</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.general.maintenanceMode}
                      onCheckedChange={checked => patchSettings({ general: { ...settings.general, maintenanceMode: checked } })}
                    />
                  </div>
                </div>
              </Card>
            </section>

            <section aria-labelledby="notifications">
              <h3 id="notifications" className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </h3>
              <Card variant="default" padding="none">
                <div className="space-y-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Class Reminders</p>
                        <p className="text-xs text-muted-foreground">Send reminders before classes</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.classReminders}
                      onCheckedChange={checked => patchSettings({ notifications: { ...settings.notifications, classReminders: checked } })}
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-warning-light text-warning flex items-center justify-center">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Homework Due Alerts</p>
                        <p className="text-xs text-muted-foreground">Notify students of upcoming deadlines</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.homeworkDueAlerts}
                      onCheckedChange={checked => patchSettings({ notifications: { ...settings.notifications, homeworkDueAlerts: checked } })}
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary-light text-secondary flex items-center justify-center">
                        <Megaphone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Announcement Notifications</p>
                        <p className="text-xs text-muted-foreground">Notify when new announcements are posted</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.announcementNotifications}
                      onCheckedChange={checked => patchSettings({ notifications: { ...settings.notifications, announcementNotifications: checked } })}
                    />
                  </div>
                </div>
              </Card>
            </section>

            <section aria-labelledby="account">
              <h3 id="account" className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Account
              </h3>
              <Card variant="default" padding="md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Administrator</p>
                  </div>
                </div>
              </Card>
            </section>

            <Button variant="destructive" className="w-full" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
