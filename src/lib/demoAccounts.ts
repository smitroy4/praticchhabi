import type { DemoUser } from '@/types';

export const demoAccounts: DemoUser[] = [
  { id: 'admin-1', name: 'Admin', email: 'admin@praticchhabi.com', role: 'admin', avatar: '/avatars/admin.jpg' },
  { id: 'teacher-1', name: 'Debraj Dasgupta', email: 'debraj@praticchhabi.com', role: 'teacher', avatar: '/avatars/debraj.jpg', teacherId: 'TCH001' },
  { id: 'student-1', name: 'Priyangshi Roy', email: 'priyangshi@praticchhabi.com', role: 'student', avatar: '/avatars/priyangshi.jpg', studentId: 'STU001' },
  { id: 'student-2', name: 'Sabarni Kundu', email: 'sabarni@praticchhabi.com', role: 'student', avatar: '/avatars/sabarni.jpg', studentId: 'STU002' },
  { id: 'student-3', name: 'Ankush Das', email: 'ankush@praticchhabi.com', role: 'student', avatar: '/avatars/ankush.jpg', studentId: 'STU003' },
];
