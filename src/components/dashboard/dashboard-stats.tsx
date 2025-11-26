"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardStats() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [totalStudents, setTotalStudents] = useState(0);
  const [presentStudents, setPresentStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const studentsCollection = collection(firestore, `teachers/${user.uid}/students`);
    const studentsQuery = query(studentsCollection);

    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      setTotalStudents(snapshot.size);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching total students:", error);
      setLoading(false);
    });

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const attendanceCollection = collection(firestore, `teachers/${user.uid}/attendance`);
    const attendanceQuery = query(
      attendanceCollection,
      where('date', '==', todayStr)
    );

    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      setPresentStudents(snapshot.size);
    }, (error) => {
      console.error("Error fetching present students:", error);
    });
    
    return () => {
      unsubscribeStudents();
      unsubscribeAttendance();
    };
  }, [user, firestore]);

  const absentStudents = totalStudents - presentStudents;
  const stats = {
    total: totalStudents,
    present: presentStudents,
    absent: absentStudents < 0 ? 0 : absentStudents,
  };

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
