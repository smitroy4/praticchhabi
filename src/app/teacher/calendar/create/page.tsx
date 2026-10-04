'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/useAsync';
import { classesApi, studentsApi } from '@/lib/api';
import type { Recurrence } from '@/types';
import { cn } from '@/lib/utils';
import { X, Calendar, Video, MapPin, Users, CheckCircle } from 'lucide-react';

export default function ScheduleClassPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<'offline' | 'online'>('offline');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [location, setLocation] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [recurrenceUntil, setRecurrenceUntil] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, loading, error, reload } = useAsync(() => studentsApi.list(), []);
  const students = data?.students ?? [];

  const typeOptions = [
    { value: 'offline', label: 'Offline (in studio)' },
    { value: 'online', label: 'Online (Google Meet)' },
  ];

  const recurrenceOptions = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Every day' },
    { value: 'weekly', label: 'Every week' },
    { value: 'biweekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Every month' },
  ];

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Class title is required';
    if (!date) errs.date = 'Date is required';
    if (!startTime) errs.startTime = 'Start time is required';
    if (!endTime) errs.endTime = 'End time is required';
    if (startTime && endTime && endTime <= startTime) errs.endTime = 'End time must be after start time';
    if (type === 'online' && !meetingUrl.trim()) errs.meetingUrl = 'Google Meet URL is required for online classes';
    if (type === 'offline' && !location.trim()) errs.location = 'Location is required for offline classes';
    if (selectedStudents.length === 0) errs.students = 'Select at least one student';
    if (recurrence !== 'none') {
      if (!recurrenceUntil) errs.recurrenceUntil = 'Repeat-until date is required';
      else if (date && recurrenceUntil < date) errs.recurrenceUntil = 'Repeat until must be on or after the class date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await classesApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        startTime,
        endTime,
        type,
        meetingUrl: type === 'online' ? meetingUrl.trim() : undefined,
        location: type === 'offline' ? location.trim() : undefined,
        studentIds: selectedStudents,
        recurrence,
        recurrenceUntil: recurrence !== 'none' ? recurrenceUntil : undefined,
      });
      toast({
        title: 'Class scheduled',
        description: `"${title}" has been scheduled for ${date} at ${startTime}.`,
        type: 'success',
        action: { label: 'View calendar', onClick: () => router.push('/teacher/calendar') },
      });
      router.push('/teacher/calendar');
    } catch (err) {
      toast({
        title: 'Could not schedule class',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell role="teacher" showBottomNav={false} showTopBar topBarTitle="Schedule Class">
      <div className="px-4 py-4 max-w-[720px] mx-auto pb-24">
        <PageHeader
          title="Schedule Class"
          description="Create a new class session for students"
          backAction={() => router.back()}
        />

        <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
          <Card variant="default" padding="lg" className="space-y-5">
            <Input
              label="Class title"
              placeholder="e.g. Portrait Drawing Workshop"
              value={title}
              onChange={e => setTitle(e.target.value)}
              error={errors.title}
            />
            <Textarea
              label="Description"
              placeholder="What will students learn in this session?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />

            <div className="grid sm:grid-cols-3 gap-4">
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                error={errors.date}
              />
              <Input
                label="Start time"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                error={errors.startTime}
              />
              <Input
                label="End time"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                error={errors.endTime}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Repeat"
                options={recurrenceOptions}
                value={recurrence}
                onChange={e => setRecurrence(e.target.value as Recurrence)}
              />
              {recurrence !== 'none' && (
                <Input
                  label="Repeat until"
                  type="date"
                  value={recurrenceUntil}
                  onChange={e => setRecurrenceUntil(e.target.value)}
                  error={errors.recurrenceUntil}
                  min={date || undefined}
                />
              )}
            </div>
          </Card>

          <Card variant="default" padding="lg" className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {type === 'online' ? <Video className="h-4 w-4 text-secondary" /> : <MapPin className="h-4 w-4 text-primary" />}
                <label className="text-sm font-medium text-foreground">Class type</label>
              </div>
              <Badge type={type} />
            </div>

            <Select
              options={typeOptions}
              value={type}
              onChange={e => setType(e.target.value as 'offline' | 'online')}
              label="Select type"
            />

            {type === 'online' && (
              <div className="animate-slide-down">
                <Input
                  label="Google Meet URL"
                  type="url"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={meetingUrl}
                  onChange={e => setMeetingUrl(e.target.value)}
                  error={errors.meetingUrl}
                  helperText="Students will use this link to join the class"
                />
              </div>
            )}

            {type === 'offline' && (
              <div className="animate-slide-down">
                <Input
                  label="Location"
                  placeholder="e.g. Studio 2, 4th Floor"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  error={errors.location}
                  helperText="Where the class takes place"
                />
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Teacher</p>
                <p className="text-xs text-muted-foreground">{user?.name ?? 'Teacher'} · Drawing Teacher</p>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">Students</label>
                {selectedStudents.length > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {selectedStudents.length} selected
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedStudents(students.map(s => s.id))}>All</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedStudents([])}>None</Button>
              </div>
            </div>
            {errors.students && <p className="text-sm text-error mb-2" role="alert">{errors.students}</p>}

            {loading && (
              <div className="space-y-2" aria-busy="true" aria-label="Loading students">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {!loading && error && (
              <EmptyState
                title="Could not load students"
                description={error}
                action={<Button variant="outline" onClick={reload}>Try again</Button>}
              />
            )}

            {!loading && !error && students.length === 0 && (
              <EmptyState
                icon={<Users className="h-10 w-10 text-muted" />}
                title="No students yet"
                description="Add students first so you can assign them to this class."
              />
            )}

            {!loading && !error && students.length > 0 && (
              <div className="space-y-2" role="group" aria-label="Select students">
                {students.map(student => {
                  const selected = selectedStudents.includes(student.id);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleStudent(student.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg border transition-smooth pressable text-left',
                        selected ? 'border-primary bg-primary-light' : 'border-border hover:border-border-strong hover:bg-muted'
                      )}
                      aria-pressed={selected}
                    >
                      <Avatar src={student.avatar} name={student.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.studentId ?? student.email}</p>
                      </div>
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-smooth',
                        selected ? 'bg-primary border-primary text-white' : 'border-border-strong'
                      )}>
                        {selected && <CheckCircle className="h-3.5 w-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <div className="flex gap-3 sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-t border-border">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()} disabled={isSubmitting}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              <Calendar className="h-4 w-4" />
              Schedule Class
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Badge({ type }: { type: 'offline' | 'online' }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      type === 'online' ? 'bg-secondary-light text-secondary' : 'bg-primary-light text-primary'
    )}>
      {type === 'online' ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
      {type === 'online' ? 'Online' : 'Offline'}
    </span>
  );
}
