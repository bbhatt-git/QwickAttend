
"use client";

import { useState, useEffect, useMemo } from 'react';
import { format, isValid, startOfMonth, endOfMonth, getDaysInMonth, getDate, getDay } from 'date-fns';
import { Calendar as CalendarIcon, Download, Loader2, UserCheck, UserX, UserMinus } from 'lucide-react';
import Papa from 'papaparse';
import NepaliDate from 'nepali-date-converter';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, addDoc, deleteDoc, doc } from 'firebase/firestore';
import type { Student, AttendanceRecord } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';


export default function AttendanceView() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchStudents = async () => {
      const q = query(collection(firestore, `teachers/${user.uid}/students`), orderBy('name'));
      const querySnapshot = await getDocs(q);
      setStudents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    };
    fetchStudents();
  }, [user, firestore]);
  
  useEffect(() => {
    if (!user || !date || !isValid(date)) return;
    setLoading(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    const fetchAttendance = async () => {
      const q = query(
        collection(firestore, `teachers/${user.uid}/attendance`),
        where('date', '==', dateStr)
      );
      const querySnapshot = await getDocs(q);
      setAttendance(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
      setLoading(false);
    };
    fetchAttendance();
  }, [user, date, firestore, refetchTrigger]);

  const { presentStudents, absentStudents, onLeaveStudents } = useMemo(() => {
    const present = attendance.filter(a => a.status === 'present');
    const onLeave = attendance.filter(a => a.status === 'on_leave');
    
    const presentStudentIds = new Set(present.map(a => a.studentId));
    const onLeaveStudentIds = new Set(onLeave.map(a => a.studentId));

    const presentWithName = students
        .filter(s => presentStudentIds.has(s.studentId))
        .map(s => {
            const att = present.find(a => a.studentId === s.studentId);
            return {...s, attendanceTime: att?.timestamp.toDate()};
        });

    const onLeaveWithName = students
        .filter(s => onLeaveStudentIds.has(s.studentId))
        .map(s => ({ ...s, attendanceId: onLeave.find(a => a.studentId === s.studentId)!.id }));

    const absent = students.filter(s => !presentStudentIds.has(s.studentId) && !onLeaveStudentIds.has(s.studentId));

    return { presentStudents: presentWithName, absentStudents: absent, onLeaveStudents: onLeaveWithName };
  }, [students, attendance]);
  
  const handleMarkAsLeave = async (student: Student) => {
    if (!user || !date) return;
    try {
        const attendanceCollection = collection(firestore, `teachers/${user.uid}/attendance`);
        await addDoc(attendanceCollection, {
            studentId: student.studentId,
            teacherId: user.uid,
            date: format(date, 'yyyy-MM-dd'),
            timestamp: Timestamp.now(),
            status: 'on_leave'
        });
        toast({ title: 'Success', description: `${student.name} marked as on leave.` });
        setRefetchTrigger(c => c + 1);
    } catch (error) {
        console.error("Error marking as leave:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not mark as leave. Please try again.' });
    }
  }

  const handleUndoLeave = async (student: { id: string, attendanceId: string, name: string }) => {
    if (!user) return;
     try {
        const attendanceDocRef = doc(firestore, `teachers/${user.uid}/attendance/${student.attendanceId}`);
        await deleteDoc(attendanceDocRef);
        toast({ title: 'Success', description: `Leave for ${student.name} has been removed.` });
        setRefetchTrigger(c => c + 1);
    } catch (error) {
        console.error("Error undoing leave:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not undo leave. Please try again.' });
    }
  }

  const handleMonthlyExport = async () => {
    if (!date || !user) return;
    setIsDownloading(true);

    try {
      const adMonthStart = startOfMonth(date);
      const adMonthEnd = endOfMonth(date);
      
      const attendanceQuery = query(
        collection(firestore, `teachers/${user.uid}/attendance`),
        where('date', '>=', format(adMonthStart, 'yyyy-MM-dd')),
        where('date', '<=', format(adMonthEnd, 'yyyy-MM-dd'))
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const monthlyAttendance = attendanceSnapshot.docs.map(d => d.data() as AttendanceRecord);
      
      const adDaysInMonth = getDaysInMonth(date);
      const bsDate = new NepaliDate(date);
      const bsMonth = bsDate.getMonth() + 1;
      const bsYear = bsDate.getYear();
      const bsDaysInMonth = new NepaliDate(bsYear, bsMonth, 0).getDate();

      const dateColumns = Array.from({ length: bsDaysInMonth }, (_, i) => (i + 1).toString());

      const headers = ['Class', 'Section', 'Student ID', 'Student Name', ...dateColumns];
      
      const dataToExport = students.map(student => {
        const row: { [key: string]: string } = {
          'Class': student.class,
          'Section': student.section,
          'Student ID': student.studentId,
          'Student Name': student.name,
        };

        dateColumns.forEach(bsDay => {
          const bsDateToCheck = new NepaliDate(bsYear, bsMonth -1, parseInt(bsDay));
          const adDateToCheck = bsDateToCheck.toJsDate();
          
          if (adDateToCheck.getMonth() !== adMonthStart.getMonth()) {
            row[bsDay] = "-";
            return;
          }

          if (bsDateToCheck.getDay() === 6) { // 6 corresponds to Saturday in NepaliDate
            row[bsDay] = 'Saturday';
            return;
          }
          
          const adDateStr = format(adDateToCheck, 'yyyy-MM-dd');
          
          const attendanceRecord = monthlyAttendance.find(
            a => a.studentId === student.studentId && a.date === adDateStr
          );

          if (attendanceRecord) {
            row[bsDay] = attendanceRecord.status === 'present' ? 'Present' : 'On leave';
          } else {
            row[bsDay] = 'Absent';
          }
        });
        return row;
      });

      const csv = Papa.unparse({
          fields: headers,
          data: dataToExport.map(Object.values)
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `monthly_attendance_${bsYear}-${bsMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Failed to export monthly report:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the monthly report.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const bsDate = date ? new NepaliDate(date).format('DD, MMMM YYYY') : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
               <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(d) => d > new Date() || d < new Date("2000-01-01")}
              />
            </PopoverContent>
          </Popover>
          {date && (
            <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
              <span className="font-semibold">BS: </span>{bsDate}
            </div>
          )}
        </div>
        <div className="flex gap-2">
            <Button onClick={handleMonthlyExport} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download Monthly Report
            </Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><UserCheck className="text-green-500" /> Present ({presentStudents.length})</CardTitle>
            <CardDescription>Students marked as present.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
            {loading ? <Skeleton className="h-full w-full"/> : presentStudents.length > 0 ? (
                <ul className="space-y-2">
                    {presentStudents.map(s => <li key={s.id} className="text-sm p-2 rounded-md bg-green-100 dark:bg-green-900/50 flex justify-between items-center">{s.name} <span className="text-xs text-muted-foreground">{s.attendanceTime ? format(s.attendanceTime, 'p') : ''}</span></li>)}
                </ul>
            ) : <p className="text-sm text-muted-foreground text-center pt-10">No students were present.</p>}
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><UserMinus className="text-yellow-500"/> On Leave ({onLeaveStudents.length})</CardTitle>
            <CardDescription>Students marked as on leave.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
            {loading ? <Skeleton className="h-full w-full"/> : onLeaveStudents.length > 0 ? (
                <ul className="space-y-2">
                    {onLeaveStudents.map(s => <li key={s.id} className="text-sm p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/50 flex justify-between items-center">{s.name} <Button variant="ghost" size="sm" onClick={() => handleUndoLeave(s)}>Undo</Button></li>)}
                </ul>
            ) : <p className="text-sm text-muted-foreground text-center pt-10">No students are on leave.</p>}
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><UserX className="text-red-500" /> Absent ({absentStudents.length})</CardTitle>
            <CardDescription>Students not marked present or on leave.</CardDescription>
          </CardHeader>
          <CardContent>
          <ScrollArea className="h-72">
             {loading ? <Skeleton className="h-full w-full"/> : absentStudents.length > 0 ? (
                <ul className="space-y-2">
                    {absentStudents.map(s => <li key={s.id} className="text-sm p-2 rounded-md bg-red-100 dark:bg-red-900/50 flex justify-between items-center">{s.name} <Button variant="outline" size="sm" onClick={() => handleMarkAsLeave(s)}>Mark Leave</Button></li>)}
                </ul>
            ) : <p className="text-sm text-muted-foreground text-center pt-10">All students are accounted for!</p>}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    
    