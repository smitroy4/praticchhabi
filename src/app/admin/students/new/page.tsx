'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { studentsApi } from '@/lib/api';
import { X, UserPlus } from 'lucide-react';

export default function AddStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!studentId.trim()) errs.studentId = 'Student ID is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await studentsApi.create({
        name: name.trim(),
        email: email.trim(),
        studentId: studentId.trim(),
        classIds: [],
      });
      toast({
        title: 'Student added',
        description: `${name} has been added to your school.`,
        type: 'success',
      });
      router.push('/admin/students');
    } catch (err) {
      toast({
        title: 'Could not add student',
        description: err instanceof Error ? err.message : 'Something went wrong',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell role="admin" showBottomNav={false} showTopBar topBarTitle="Add Student">
      <div className="px-4 py-4 max-w-[720px] mx-auto pb-24">
        <PageHeader
          title="Add Student"
          description="Register a new student in your school"
          backAction={() => router.back()}
        />

        <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
          <Card variant="default" padding="lg" className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
              <Avatar name={name || '?'} size="lg" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{name || 'Student name'}</p>
                <p className="text-xs text-muted-foreground">{studentId || 'STUXXX'}</p>
              </div>
            </div>

            <Input
              label="Full name"
              placeholder="e.g. Priyangshi Roy"
              value={name}
              onChange={e => setName(e.target.value)}
              error={errors.name}
            />
            <Input
              label="Email"
              type="email"
              placeholder="student@praticchhabi.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={errors.email}
            />
            <Input
              label="Student ID"
              placeholder="e.g. STU004"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              error={errors.studentId}
              helperText="A unique identifier for this student"
            />
          </Card>

          <div className="flex gap-3 sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-t border-border">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()} disabled={isSubmitting}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              <UserPlus className="h-4 w-4" />
              Add Student
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
