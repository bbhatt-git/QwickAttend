
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import type { AttendanceRecord } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, UserX, UserMinus } from 'lucide-react';
import WelcomeHeader from '@/components/dashboard/welcome-header';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [stats, setStats] = useState({ present: 0, absent: 0, onLeave: 0, total: 0 });
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
          onLeave: onLeaveStudents,
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

  const statCards = [
    { title: 'Total Students', value: stats.total, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
    { title: 'Present Today', value: stats.present, icon: UserCheck, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/20' },
    { title: 'Absent Today', value: stats.absent, icon: UserX, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/20' },
    { title: 'On Leave', value: stats.onLeave, icon: UserMinus, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' },
  ];

  return (
    <div className="space-y-6">
      <WelcomeHeader />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mt-2" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
