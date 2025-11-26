"use client";

import { useState, useEffect, useMemo } from 'react';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon, Download, BrainCircuit, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import NepaliDate from 'nepali-date-converter';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Student, AttendanceRecord } from '@/lib/types';
import { analyzeAbsenteeism, AnalyzeAbsenteeismOutput } from '@/ai/flows/analyze-absenteeism';
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
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogFooter
} from '@/components/ui/alert-dialog';
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
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeAbsenteeismOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
  }, [user, date, firestore]);

  const { presentStudents, absentStudents } = useMemo(() => {
    const presentStudentIds = new Set(attendance.map(a => a.studentId));
    const present = students
      .filter(s => presentStudentIds.has(s.studentId))
      .map(s => ({ ...s, attendanceTime: attendance.find(a => a.studentId === s.studentId)?.timestamp.toDate() }));
    const absent = students.filter(s => !presentStudentIds.has(s.studentId));
    return { presentStudents: present, absentStudents: absent };
  }, [students, attendance]);
  
  const handleExport = () => {
    if (!date) return;
    const bsDate = new NepaliDate(date).format('YYYY-MM-DD');
    const dataToExport = students.map(student => {
      const isPresent = presentStudents.some(ps => ps.id === student.id);
      return {
        'Student Name': student.name,
        'Student ID': student.studentId,
        'Class': student.class,
        'Section': student.section,
        'Status': isPresent ? 'Present' : 'Absent',
        'Attendance Time': isPresent ? format(presentStudents.find(ps => ps.id === student.id)!.attendanceTime!, 'HH:mm:ss') : 'N/A',
        'Date (AD)': format(date, 'yyyy-MM-dd'),
        'Date (BS)': bsDate,
      };
    });
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${format(date, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleAnalyze = async () => {
    if(!user) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setIsAnalysisDialogOpen(true);

    try {
        const attendanceQuery = query(collection(firestore, `teachers/${user.uid}/attendance`));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const records = attendanceSnapshot.docs.map(d => ({
            student_id: d.data().studentId,
            date: d.data().date,
            timestamp: d.data().timestamp.toMillis()
        }));

        if (records.length === 0) {
            setAnalysisResult({ analysis: 'Not enough attendance data to perform analysis.' });
            return;
        }

        const result = await analyzeAbsenteeism({
            attendanceRecords: records,
            teacher_id: user.uid
        });
        setAnalysisResult(result);
    } catch(err) {
        console.error("AI Analysis failed", err);
        toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not generate analysis.'});
        setIsAnalysisDialogOpen(false);
    } finally {
        setIsAnalyzing(false);
    }
  }

  const bsDate = date ? new NepaliDate(date).format('dd, mmmm yyyy') : '';


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
            <PopoverContent className="w-auto p-0">
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
            <Button onClick={handleExport} variant="outline" disabled={!date}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
            <Button onClick={handleAnalyze}><BrainCircuit className="mr-2 h-4 w-4" /> Analyze</Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Present ({presentStudents.length})</CardTitle>
            <CardDescription>Students marked as present on the selected date.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
            {loading ? <Skeleton className="h-full w-full"/> : presentStudents.length > 0 ? (
                <ul className="space-y-2">
                    {presentStudents.map(s => <li key={s.id} className="text-sm p-2 rounded-md bg-green-100 dark:bg-green-900/50">{s.name} <span className="text-xs text-muted-foreground ml-2">{s.attendanceTime ? format(s.attendanceTime, 'p') : ''}</span></li>)}
                </ul>
            ) : <p className="text-sm text-muted-foreground text-center pt-10">No students were present.</p>}
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Absent ({absentStudents.length})</CardTitle>
            <CardDescription>Students not marked as present on the selected date.</CardDescription>
          </CardHeader>
          <CardContent>
          <ScrollArea className="h-72">
             {loading ? <Skeleton className="h-full w-full"/> : absentStudents.length > 0 ? (
                <ul className="space-y-2">
                    {absentStudents.map(s => <li key={s.id} className="text-sm p-2 rounded-md bg-red-100 dark:bg-red-900/50">{s.name}</li>)}
                </ul>
            ) : <p className="text-sm text-muted-foreground text-center pt-10">All students were present!</p>}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Absenteeism Analysis</AlertDialogTitle>
                  <AlertDialogDescription>
                      AI-powered insights into student attendance patterns.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="max-h-[400px] overflow-y-auto p-1">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Analyzing data...</p>
                    </div>
                ) : (
                    <p className="text-sm whitespace-pre-wrap">{analysisResult?.analysis}</p>
                )}
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
