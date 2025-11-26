
import type { Timestamp } from 'firebase/firestore';
import type { Student } from './student';

export type { Student };

export type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string; // 'yyyy-MM-dd'
  timestamp: Timestamp;
  teacherId: string;
  status: 'present' | 'on_leave';
  studentName?: string; // Optional: for display purposes
};
