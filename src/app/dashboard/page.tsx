
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import type { AttendanceRecord } from '@/lib/types';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, UserX, UserMinus, Usb, QrCode, CalendarOff, CalendarClock, Heart } from 'lucide-react';
import WelcomeHeader from '@/components/dashboard/welcome-header';
import { Separator } from '@/components/ui/separator';

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

  const quickLinks = [
    { href: '/dashboard/nfc/external', title: 'External Scan', description: 'Use a USB scanner.' },
    { href: '/dashboard/scan', title: 'QR Scan', description: 'Use your device camera.' },
    { href: '/dashboard/holidays', title: 'Manage Holidays', description: 'Add or remove holidays.' },
    { href: '/dashboard/records', title: 'View Records', description: 'Check attendance history.' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow space-y-6">
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

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Quick Links</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link, index) => {
              const Icon = [Usb, QrCode, CalendarOff, CalendarClock][index];
              return (
                  <Card key={link.href} className="hover:bg-muted/50 transition-colors">
                      <Link href={link.href}>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">{link.title}</CardTitle>
                              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                  <Icon className="h-5 w-5" />
                              </div>
                          </CardHeader>
                          <CardContent>
                              <p className="text-xs text-muted-foreground">{link.description}</p>
                          </CardContent>
                      </Link>
                  </Card>
              )
            })}
          </div>
        </div>
      </div>
      <footer className="mt-auto pt-6">
        <Separator />
        <div className="py-4 text-center text-sm text-muted-foreground">
            Built with <Heart className="inline-block h-4 w-4 -mt-1 text-red-500 fill-red-500" /> by{' '}
            <a 
            href="https://bbhatt.com.np" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-medium text-primary underline-offset-4 hover:underline"
            >
            Bhupesh Raj Bhatt
            </a>
        </div>
      </footer>
    </div>
  );
}
