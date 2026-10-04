'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { FileUpload, UploadedFile } from '@/components/ui/FileUpload';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { useAsync } from '@/lib/useAsync';
import { classesApi, homeworkApi, studentsApi, uploadsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CheckCircle, X, Users, Plus } from 'lucide-react';

export default function CreateHomeworkPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, error, loading, reload } = useAsync(
    () => Promise.all([studentsApi.list(), classesApi.list()]).then(([students, classes]) => ({
      students: students.students,
      classes: classes.classes,
    })),
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classId, setClassId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[] | null>(null);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const students = data?.students ?? [];
  const selectedIds = selectedStudents ?? students.map(s => s.id);

  const classOptions = [
    { value: '', label: 'Select a class' },
    ...(data?.classes ?? []).map(c => ({ value: c.id, label: `${c.title} · ${c.date}` })),
  ];

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev =>
      (prev ?? students.map(s => s.id)).filter(s => s !== id)
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!dueDate) errs.dueDate = 'Due date is required';
    if (error) errs.students = 'Could not load students';
    else if (selectedIds.length === 0) errs.students = 'Select at least one student';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const pending = attachments.filter(f => !f.error);
      const uploaded = pending.length ? await uploadsApi.upload(pending.map(f => f.file)) : [];
      await homeworkApi.create({
        title: title.trim(),
        description: description.trim(),
        assignedDate: new Date().toISOString().slice(0, 10),
        dueDate,
        classId: classId || null,
        studentIds: selectedIds,
        attachments: uploaded,
      });
      toast({
        title: 'Homework created',
        description: `"${title}" has been assigned to ${selectedIds.length} student${selectedIds.length === 1 ? '' : 's'}.`,
        type: 'success',
        action: { label: 'View homework', onClick: () => router.push('/admin/homework') },
      });
      router.push('/admin/homework');
    } catch (err) {
      toast({
        title: 'Could not create homework',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell role="admin" showBottomNav={false} showTopBar topBarTitle="Create Homework">
        <div className="px-4 py-4 max-w-[720px] mx-auto pb-24 space-y-4" aria-busy="true" aria-label="Loading form">
          <div className="h-9 w-2/3 bg-muted rounded-lg animate-pulse" />
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell role="admin" showBottomNav={false} showTopBar topBarTitle="Create Homework">
        <div className="px-4 py-4 max-w-[720px] mx-auto">
          <PageHeader title="Create Homework" backAction={() => router.back()} />
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-1">Could not load form data</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={reload}>Try again</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="admin" showBottomNav={false} showTopBar topBarTitle="Create Homework">
      <div className="px-4 py-4 max-w-[720px] mx-auto pb-24">
        <PageHeader
          title="Create Homework"
          description="Assign a new practice activity for your students"
          backAction={() => router.back()}
        />

        <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
          <Card variant="default" padding="lg" className="space-y-5">
            <Input
              label="Title"
              placeholder="e.g. Pencil Shading Practice"
              value={title}
              onChange={e => setTitle(e.target.value)}
              error={errors.title}
              maxLength={100}
            />
            <Textarea
              label="Description"
              placeholder="Describe the assignment, techniques to practice, and expectations…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              error={errors.description}
              rows={4}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                error={errors.dueDate}
              />
              <Select
                label="Class"
                options={classOptions}
                value={classId}
                onChange={e => setClassId(e.target.value)}
              />
            </div>
          </Card>

          <Card variant="default" padding="lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">Assigned students</label>
              </div>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedStudents(null)}>All</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedStudents([])}>None</Button>
              </div>
            </div>
            {errors.students && <p className="text-sm text-error mb-2" role="alert">{errors.students}</p>}
            <div className="space-y-2" role="group" aria-label="Select students">
              {students.map(student => {
                const selected = selectedIds.includes(student.id);
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
                      <p className="text-xs text-muted-foreground">{student.studentId}</p>
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
          </Card>

          <Card variant="default" padding="lg">
            <label className="text-sm font-medium text-foreground mb-3 block">Attachments</label>
            <FileUpload
              onFilesChange={setAttachments}
              maxFiles={5}
              label="Upload reference material"
              description="Images, PDFs, or videos — drag & drop or click to browse"
            />
          </Card>

          <div className="flex gap-3 sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-t border-border">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()} disabled={isSubmitting}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              <Plus className="h-4 w-4" />
              Create Homework
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
