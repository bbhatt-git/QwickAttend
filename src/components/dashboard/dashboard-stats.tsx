"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs,getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        // Get total students
        const studentsQuery = query(collection(db, 'students'), where('teacher_id', '==', user.uid));
        const studentsSnapshot = await getCountFromServer(studentsQuery);
        const totalStudents = studentsSnapshot.data().count;

        // Get present students
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('teacher_id', '==', user.uid),
          where('date', '==', todayStr)
        );
        const attendanceSnapshot = await getCountFromServer(attendanceQuery);
        const presentStudents = attendanceSnapshot.data().count;

        const absentStudents = totalStudents - presentStudents;

        setStats({
          total: totalStudents,
          present: presentStudents,
          absent: absentStudents < 0 ? 0 : absentStudents,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <>
        <Skeleton className="h-[126px] w-full" />
        <Skeleton className="h-[126px] w-full" />
        <Skeleton className="h-[126px] w-full" />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Total students enrolled</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Present Today</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.present}</div>
          <p className="text-xs text-muted-foreground">Students marked present today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.absent}</div>
          <p className="text-xs text-muted-foreground">Students not yet present</p>
        </CardContent>
      </Card>
    </>
  );
}
