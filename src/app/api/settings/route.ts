import { requireUser, guarded, json, apiError } from '@/lib/server/http';
import { getSettings, saveSettings } from '@/lib/server/repo';
import type { AppSettings } from '@/types';

export async function GET() {
  const auth = await requireUser(['admin']);
  if (!auth.ok) return guarded(auth);
  return json({ settings: await getSettings() });
}

export async function PUT(request: Request) {
  const auth = await requireUser(['admin']);
  if (!auth.ok) return guarded(auth);
  const body = await request.json().catch(() => null);
  if (!body) return apiError(400, 'Invalid settings payload');
  const current = await getSettings();
  const settings: AppSettings = {
    notifications: { ...current.notifications, ...(body.notifications ?? {}) },
    general: { ...current.general, ...(body.general ?? {}) },
  };
  await saveSettings(settings);
  return json({ settings });
}
