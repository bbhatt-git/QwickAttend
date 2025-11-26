'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import type { Student, AttendanceRecord } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, QrCode, CalendarClock, ArrowUpRight, AppWindow, UserCheck, UserX } from 'lucide-react';
import WelcomeHeader from '@/components/dashboard/welcome-header';

const quickActions = [
  { href: '/dashboard/students', title: 'Manage Students', description: 'View your student roster.', icon: Users },
  { href: '/dashboard/scan', title: 'Scan QR Code', description: 'Start an attendance session.', icon: QrCode },
  { href: '/dashboard/records', title: 'View Records', description: 'Check historical attendance data.', icon: CalendarClock },
  { href: '/dashboard/generate-qr', title: 'Generate QR Code', description: 'Create a QR code for a student ID.', icon: AppWindow },
];

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        // Fetch all students
        const studentsCollection = collection(firestore, `teachers/${user.uid}/students`);
        const studentSnapshot = await getDocs(studentsCollection);
        const totalStudents = studentSnapshot.size;

        // Fetch today's attendance
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const attendanceCollection = collection(firestore, `teachers/${user.uid}/attendance`);
        const attendanceQuery = query(attendanceCollection, where('date', '==', todayStr));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        const presentStudents = attendanceSnapshot.docs.filter(doc => (doc.data() as AttendanceRecord).status === 'present').length;
        const onLeaveStudents = attendanceSnapshot.docs.filter(doc => (doc.data() as AttendanceRecord).status === 'on_leave').length;

        setStats({
          present: presentStudents,
          absent: totalStudents - presentStudents - onLeaveStudents,
          total: totalStudents
        });

      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, firestore]);

  return (
    <div className="space-y-8">
      <WelcomeHeader />

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Today's Overview</h2>
        <p className="text-muted-foreground mb-4">
          A quick look at today's attendance.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
                  <UserX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.present}</div>
                  <p className="text-xs text-muted-foreground">
                    out of {stats.total} students
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
                  <UserX className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.absent}</div>
                  <p className="text-xs text-muted-foreground">
                     out of {stats.total} students
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
        <p className="text-muted-foreground mb-4">
          Jump right into your common tasks.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map(action => (
             <Card key={action.href} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{action.title}</CardTitle>
                <action.icon className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>{action.description}</CardDescription>
                <Button asChild variant="link" className="px-0 -mb-2 -ml-2">
                  <Link href={action.href} className="mt-2">
                    Go to {action.title} <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
