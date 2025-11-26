
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Student } from '@/lib/types';

export default function DashboardStats() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [totalStudents, setTotalStudents] = useState(0);
  const [presentStudents, setPresentStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    };

    setIsLoading(true);
    
    // 1. Get all students first to establish a total count.
    const studentsCollection = collection(firestore, `teachers/${user.uid}/students`);
    const studentsQuery = query(studentsCollection);

    const fetchInitialData = async () => {
      try {
        const studentSnapshot = await getDocs(studentsQuery);
        const allStudents = studentSnapshot.docs.map(doc => doc.data() as Student);
        setTotalStudents(allStudents.length);

        // 2. Now that we have the total, set up the real-time listener for attendance.
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const attendanceCollection = collection(firestore, `teachers/${user.uid}/attendance`);
        const attendanceQuery = query(
          attendanceCollection,
          where('date', '==', todayStr)
        );

        const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
          setPresentStudents(snapshot.size);
          // Data is now consistent
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching present students:", error);
          setIsLoading(false);
        });
        
        // Also listen for changes in student count in case a student is added/deleted
        const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
          setTotalStudents(snapshot.size);
        });

        return () => {
          unsubscribeAttendance();
          unsubscribeStudents();
        };

      } catch (error) {
        console.error("Error fetching initial student data:", error);
        setIsLoading(false);
      }
    };

    fetchInitialData();

  }, [user, firestore]);

  const absentStudents = Math.max(0, totalStudents - presentStudents);

  const stats = {
    total: totalStudents,
    present: presentStudents,
    absent: absentStudents,
  };

  if (isLoading) {
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
