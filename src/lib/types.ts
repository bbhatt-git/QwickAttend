
import type { Timestamp } from 'firebase/firestore';

export type Student = {
  id: string;
  name: string;
  class: string;
  section: string;
  studentId: string;
  qrCodeUrl: string;
  teacherId: string;
  contact?: string;
};

export type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string; // 'yyyy-MM-dd'
  timestamp: Timestamp;
  teacherId: string;
  status: 'present' | 'on_leave';
  studentName?: string; // Optional: for display purposes
};

export type Holiday = {
  id: string;
  date: string; // 'yyyy-MM-dd'
  name: string;
  teacherId: string;
};
