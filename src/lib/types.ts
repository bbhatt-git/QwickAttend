import type { Timestamp } from 'firebase/firestore';

export type Student = {
  id: string;
  name: string;
  class: string;
  section: string;
  student_id: string;
  qrCodeUrl: string;
  teacher_id: string;
};

export type AttendanceRecord = {
  id: string;
  student_id: string;
  date: string; // 'yyyy-MM-dd'
  timestamp: Timestamp;
  teacher_id: string;
  studentName?: string; // Optional: for display purposes
};
