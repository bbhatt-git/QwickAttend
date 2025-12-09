
"use client";

import { useState, useEffect, useMemo } from 'react';
import { format, isValid, eachDayOfInterval, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Download, Loader2, UserCheck, UserX, UserMinus, Phone, ChevronLeft, ChevronRight, MessageSquare, CalendarOff, FileText, FileDown } from 'lucide-react';
import Papa from 'papaparse';
import NepaliDate from 'nepali-date-converter';
import { useUser, useFirestore } from '@/firebase';
import { useStudentData } from '@/context/student-provider';
import { collection, query, where, getDocs, orderBy, Timestamp, addDoc, deleteDoc, doc } from 'firebase/firestore';
import type { Student, AttendanceRecord, Holiday } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { SECTIONS } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { NepaliCalendar } from '@/components/ui/nepali-calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


export default function AttendanceView() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { students: allStudents, isLoading: isLoadingStudents } = useStudentData();
  
  const [bsDate, setBsDate] = useState(new NepaliDate());
  const adDate = useMemo(() => bsDate.toJsDate(), [bsDate]);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingOverall, setIsDownloadingOverall] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  // State for the leave reason dialog
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [studentForLeave, setStudentForLeave] = useState<Student | null>(null);
  const [leaveReason, setLeaveReason] = useState('');

  // State for summary report dialog
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [summaryStartDate, setSummaryStartDate] = useState(() => new NepaliDate(new NepaliDate().getYear(), 0, 1));


  useEffect(() => {
    if (!user || !adDate || !isValid(adDate)) return;
    setLoading(true);
    const dateStr = format(adDate, 'yyyy-MM-dd');
    const fetchAttendanceAndHolidays = async () => {
      const attendanceQuery = query(
        collection(firestore, `teachers/${user.uid}/attendance`),
        where('date', '==', dateStr)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      setAttendance(attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));

      const holidaysQuery = query(collection(firestore, `teachers/${user.uid}/holidays`));
      const holidaysSnapshot = await getDocs(holidaysQuery);
      setHolidays(holidaysSnapshot.docs.map(doc => doc.data() as Holiday));
      
      setLoading(false);
    };
    fetchAttendanceAndHolidays();
  }, [user, adDate, firestore, refetchTrigger]);

  const uniqueClasses = useMemo(() => {
    if (!allStudents) return [];
    const classes = new Set(allStudents.map(s => s.class));
    return Array.from(classes);
  }, [allStudents]);
  
  const students = useMemo(() => {
    if (!allStudents) return [];
    let filteredStudents = allStudents;
    if (sectionFilter !== 'all') {
      filteredStudents = filteredStudents.filter(student => student.section === sectionFilter);
    }
    if (classFilter !== 'all') {
      filteredStudents = filteredStudents.filter(student => student.class === classFilter);
    }
    return filteredStudents;
  }, [allStudents, sectionFilter, classFilter]);

  const isSaturday = useMemo(() => {
    if (!bsDate) return false;
    return bsDate.getDay() === 6; // 6 corresponds to Saturday
  }, [bsDate]);
  
  const todayHoliday = useMemo(() => {
    if (!adDate) return null;
    const dateStr = format(adDate, 'yyyy-MM-dd');
    return holidays.find(h => h.date === dateStr);
  }, [holidays, adDate]);


  const { presentStudents, absentStudents, onLeaveStudents } = useMemo(() => {
    if (todayHoliday || isSaturday) {
      return { presentStudents: [], absentStudents: [], onLeaveStudents: [] };
    }
    if (!students) {
      return { presentStudents: [], absentStudents: [], onLeaveStudents: [] };
    }

    const present = attendance.filter(a => a.status === 'present');
    const onLeave = attendance.filter(a => a.status === 'on_leave');
    
    const presentStudentIds = new Set(present.map(a => a.studentId));
    const onLeaveStudentIds = new Set(onLeave.map(a => a.studentId));

    const presentWithName = students
        .filter(s => presentStudentIds.has(s.studentId))
        .map(s => {
            const att = present.find(a => a.studentId === s.studentId);
            const attendanceTimestamp = att?.timestamp as unknown as Timestamp;
            return {...s, attendanceTime: attendanceTimestamp?.toDate()};
        });

    const onLeaveWithName = students
        .filter(s => onLeaveStudentIds.has(s.studentId))
        .map(s => {
            const att = onLeave.find(a => a.studentId === s.studentId);
            return { ...s, attendanceId: att!.id, leaveReason: att!.leaveReason };
        });


    const absent = students.filter(s => !presentStudentIds.has(s.studentId) && !onLeaveStudentIds.has(s.studentId));

    return { presentStudents: presentWithName, absentStudents: absent, onLeaveStudents: onLeaveWithName };
  }, [students, attendance, todayHoliday, isSaturday]);
  
  const handleMarkAsLeave = async () => {
    if (!user || !adDate || !studentForLeave) return;
    try {
        const attendanceCollection = collection(firestore, `teachers/${user.uid}/attendance`);
        await addDoc(attendanceCollection, {
            studentId: studentForLeave.studentId,
            teacherId: user.uid,
            date: format(adDate, 'yyyy-MM-dd'),
            timestamp: Timestamp.now(),
            status: 'on_leave',
            leaveReason: leaveReason || 'Not specified'
        });
        toast({ title: 'Success', description: `${studentForLeave.name} marked as on leave.` });
        setRefetchTrigger(c => c + 1);
    } catch (error) {
        console.error("Error marking as leave:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not mark as leave. Please try again.' });
    } finally {
        setLeaveDialogOpen(false);
        setStudentForLeave(null);
        setLeaveReason('');
    }
  }

  const openLeaveDialog = (student: Student) => {
    setStudentForLeave(student);
    setLeaveDialogOpen(true);
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
    if (!bsDate || !user) return;
    setIsDownloading(true);
    const todayAD = new Date(); // Today's Gregorian date
    todayAD.setHours(0, 0, 0, 0); // Normalize to the start of the day

    try {
        const bsMonth = bsDate.getMonth();
        const bsYear = bsDate.getYear();
        const bsDaysInMonth = new NepaliDate(bsYear, bsMonth + 1, 0).getDate();

        // Find the AD date range for the selected BS month
        const firstDayOfBSMonth = new NepaliDate(bsYear, bsMonth, 1);
        const lastDayOfBSMonth = new NepaliDate(bsYear, bsMonth, bsDaysInMonth);
        const adMonthStart = firstDayOfBSMonth.toJsDate();
        const adMonthEnd = lastDayOfBSMonth.toJsDate();

      const attendanceQuery = query(
        collection(firestore, `teachers/${user.uid}/attendance`),
        where('date', '>=', format(adMonthStart, 'yyyy-MM-dd')),
        where('date', '<=', format(adMonthEnd, 'yyyy-MM-dd'))
      );
  
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const monthlyAttendance = attendanceSnapshot.docs.map(d => d.data() as AttendanceRecord);
      const holidayDateMap = new Map(holidays.map(h => [h.date, h.name]));
  
      const dateColumns = Array.from({ length: bsDaysInMonth }, (_, i) => (i + 1).toString());
  
      let headers = ['Student ID', 'Student Name'];
      if (classFilter === 'all') {
        headers.push('Class');
      }
      if (sectionFilter === 'all') {
        headers.push('Section');
      }
      headers.push(...dateColumns, 'Total Present', 'Total Absent', 'Total On Leave');
      
      const studentsForReport = [...(students || [])].sort((a, b) => a.studentId.localeCompare(b.studentId));

      const dataToExport = studentsForReport.map(student => {
        const rowData: { [key: string]: string | number } = {
          'Student ID': student.studentId,
          'Student Name': student.name,
        };
        if (classFilter === 'all') {
          rowData['Class'] = student.class;
        }
        if (sectionFilter === 'all') {
          rowData['Section'] = student.section;
        }

        let presentCount = 0;
        let absentCount = 0;
        let leaveCount = 0;
  
        dateColumns.forEach(bsDay => {
          const bsDateToCheck = new NepaliDate(bsYear, bsMonth, parseInt(bsDay));
          const adDateToCheck = bsDateToCheck.toJsDate();
          adDateToCheck.setHours(0, 0, 0, 0);
          const adDateStr = format(adDateToCheck, 'yyyy-MM-dd');
  
          if (adDateToCheck > todayAD) {
            rowData[bsDay] = ''; // Leave future dates blank
            return;
          }
  
          if (adDateToCheck < adMonthStart || adDateToCheck > adMonthEnd) {
             rowData[bsDay] = "-"; // Not part of the month
             return;
          }
          
          if(holidayDateMap.has(adDateStr)) {
            rowData[bsDay] = 'H';
            return;
          }

          if (bsDateToCheck.getDay() === 6) { // 6 corresponds to Saturday in NepaliDate
            rowData[bsDay] = 'S';
            return;
          }
          
          const attendanceRecord = monthlyAttendance.find(
            a => a.studentId === student.studentId && a.date === adDateStr
          );
  
          if (attendanceRecord) {
            if (attendanceRecord.status === 'present') {
              rowData[bsDay] = 'P';
              presentCount++;
            } else {
              rowData[bsDay] = 'L';
              leaveCount++;
            }
          } else {
            rowData[bsDay] = 'A';
            absentCount++;
          }
        });

        rowData['Total Present'] = presentCount;
        rowData['Total Absent'] = absentCount;
        rowData['Total On Leave'] = leaveCount;

        return rowData;
      });
  
      const csv = Papa.unparse(dataToExport, {
          columns: headers,
      });
  
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      let downloadFileName = `monthly_attendance_${bsYear}-${bsMonth + 1}`;
      if (classFilter !== 'all') {
        downloadFileName += `_${classFilter.replace(' ', '_')}`;
      }
      if (sectionFilter !== 'all') {
        downloadFileName += `_${sectionFilter}`;
      }
      downloadFileName += '.csv';

      link.setAttribute('href', url);
      link.setAttribute('download', downloadFileName);
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

  const handleOverallExport = async () => {
    if (!user || !allStudents) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load student data.' });
        return;
    }
    setIsDownloadingOverall(true);

    try {
        const today = new Date();
        const startOfYearAD = summaryStartDate.toJsDate();
        
        // 1. Fetch all attendance and holidays for the selected range
        const attendanceQuery = query(
            collection(firestore, `teachers/${user.uid}/attendance`),
            where('date', '>=', format(startOfYearAD, 'yyyy-MM-dd')),
            where('date', '<=', format(today, 'yyyy-MM-dd'))
        );
        const holidaysQuery = query(collection(firestore, `teachers/${user.uid}/holidays`));

        const [attendanceSnapshot, holidaysSnapshot] = await Promise.all([
            getDocs(attendanceQuery),
            getDocs(holidaysQuery)
        ]);

        const allAttendance = attendanceSnapshot.docs.map(d => d.data() as AttendanceRecord);
        const allHolidays = holidaysSnapshot.docs.map(d => d.data() as Holiday);
        const holidayDateSet = new Set(allHolidays.map(h => h.date));
        
        // 2. Determine school open days for the selected range
        const allDatesInRange = eachDayOfInterval({ start: startOfYearAD, end: today });
        
        const schoolOpenDays = allDatesInRange.filter(date => {
            const isSaturday = date.getDay() === 6; // 0 is Sunday, 6 is Saturday
            const isHoliday = holidayDateSet.has(format(date, 'yyyy-MM-dd'));
            return !isSaturday && !isHoliday;
        });
        const totalSchoolOpenDays = schoolOpenDays.length;
        const schoolOpenDateSet = new Set(schoolOpenDays.map(d => format(d, 'yyyy-MM-dd')));

        // 3. Process data for each student
        const dataToExport = allStudents.map(student => {
            const studentAttendance = allAttendance.filter(a => a.studentId === student.studentId);
            
            const presentDays = studentAttendance.filter(a => a.status === 'present').length;
            const onLeaveDays = studentAttendance.filter(a => a.status === 'on_leave').length;
            
            // Calculate absent days only on days the school was open in the selected range
            const attendedDateSet = new Set(studentAttendance.map(a => a.date));
            const absentDays = Array.from(schoolOpenDateSet).filter(d => !attendedDateSet.has(d)).length;

            return {
                'Student ID': student.studentId,
                'Student Name': student.name,
                'Class': student.class,
                'Section': student.section,
                'School Open Days': totalSchoolOpenDays,
                'Present Days': presentDays,
                'Absent Days': absentDays,
                'On Leave Days': onLeaveDays,
            };
        });

        // 4. Generate and download CSV
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const start_date_str = summaryStartDate.format('YYYY_MM_DD');
        link.setAttribute('href', url);
        link.setAttribute('download', `overall_attendance_summary_from_${start_date_str}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsSummaryDialogOpen(false);
    } catch (error) {
        console.error('Failed to export overall report:', error);
        toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the summary report.' });
    } finally {
        setIsDownloadingOverall(false);
    }
};

  const handleDateChange = (direction: 'prev' | 'next') => {
    try {
      const year = bsDate.getYear();
      const month = bsDate.getMonth();
      const day = bsDate.getDate();

      const tempDate = new NepaliDate(year, month, day);

      if (direction === 'prev') {
        tempDate.setDate(day - 1);
      } else {
        tempDate.setDate(day + 1);
      }

      if (tempDate.toJsDate() <= new Date()) {
        setBsDate(tempDate);
      }
    } catch (error) {
      console.error("Error changing date:", error);
      // Fallback to a known good state if something goes wrong
      setBsDate(new NepaliDate());
    }
  };

  const isToday = bsDate.toJsDate().setHours(0,0,0,0) === new Date().setHours(0,0,0,0);

  const handleNotifyParent = (student: Student) => {
    if (!student.contact) {
      toast({
        variant: 'destructive',
        title: 'No Contact Info',
        description: `No contact number is saved for ${student.name}.`,
      });
      return;
    }

    const message = `Dear Parent, this is to inform you that your child, ${student.name}, was absent from school today, ${bsDate ? bsDate.format('YYYY-MM-DD') : ''}. Thank you.`;
    const smsUrl = `sms:${student.contact}?&body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  const pageIsLoading = loading || isLoadingStudents;

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={() => handleDateChange('prev')} className="h-10 w-10 rounded-r-none">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal rounded-none",
                    !bsDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {bsDate ? `BS: ${bsDate.format('DD, MMMM YYYY')}` : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                 <NepaliCalendar
                  value={bsDate}
                  onSelect={setBsDate}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => handleDateChange('next')} disabled={isToday} className="h-10 w-10 rounded-l-none">
              <ChevronRight className="h-4 w-4" />
            </Button>
            </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {SECTIONS.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <div className="flex gap-2 flex-wrap">
            <Button onClick={handleMonthlyExport} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download Monthly Report
            </Button>
             <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary">
                        <FileDown className="mr-2 h-4 w-4" />
                        Download Summary Report
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Download Attendance Summary</DialogTitle>
                        <DialogDescription>
                            Please select the start date for the summary report. The report will include data from this date up to today.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center py-4">
                        <NepaliCalendar
                            mode="single"
                            value={summaryStartDate}
                            onSelect={(date) => date && setSummaryStartDate(date)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSummaryDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleOverallExport} disabled={isDownloadingOverall}>
                            {isDownloadingOverall ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>
      {todayHoliday ? (
        <Card className="text-center p-8">
            <CardHeader>
                <CardTitle className='flex items-center justify-center gap-2 text-2xl'><CalendarOff className="h-8 w-8 text-primary"/>Holiday</CardTitle>
                <CardDescription className="text-lg">{todayHoliday.name}</CardDescription>
            </CardHeader>
        </Card>
      ) : isSaturday ? (
        <Card className="text-center p-8">
            <CardHeader>
                <CardTitle className='flex items-center justify-center gap-2 text-2xl'><CalendarOff className="h-8 w-8 text-primary"/>Saturday</CardTitle>
                <CardDescription className="text-lg">No attendance is recorded on Saturdays.</CardDescription>
            </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
            <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><UserCheck className="text-green-500" /> Present ({presentStudents.length})</CardTitle>
                <CardDescription>Students marked as present.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                {pageIsLoading ? <Skeleton className="h-full w-full"/> : presentStudents.length > 0 ? (
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
                {pageIsLoading ? <Skeleton className="h-full w-full"/> : onLeaveStudents.length > 0 ? (
                    <ul className="space-y-2">
                        {onLeaveStudents.map(s => (
                            <li key={s.id} className="text-sm p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/50 flex justify-between items-center">
                                <div>
                                    <p>{s.name}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><FileText className="h-3 w-3" />{s.leaveReason || 'Not specified'}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleUndoLeave(s)}>Undo</Button>
                            </li>
                        ))}
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
                {pageIsLoading ? <Skeleton className="h-full w-full"/> : absentStudents.length > 0 ? (
                    <ul className="space-y-2">
                        {absentStudents.map(s => (
                        <li key={s.id} className="text-sm p-2 rounded-md bg-red-100 dark:bg-red-900/50 flex justify-between items-center">
                            <div className="flex-1">
                            {s.name}
                            {s.contact && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Phone className="h-3 w-3" />
                                <a href={`tel:${s.contact}`} className="hover:underline">{s.contact}</a>
                                </div>
                            )}
                            </div>
                            <div className="flex items-center gap-1">
                            {s.contact && (
                                <Button variant="secondary" size="sm" onClick={() => handleNotifyParent(s)}>
                                <MessageSquare className="h-3 w-3" />
                                <span className="sr-only">Notify Parent</span>
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => openLeaveDialog(s)}>Mark Leave</Button>
                            </div>
                        </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground text-center pt-10">All students are accounted for!</p>}
                </ScrollArea>
            </CardContent>
            </Card>
        </div>
      )}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Mark {studentForLeave?.name} as On Leave</AlertDialogTitle>
            <AlertDialogDescription>
                Please provide a brief reason for the student's absence. This will be saved in the record.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="leave-reason" className="text-right">
                    Reason
                    </Label>
                    <Input
                    id="leave-reason"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Sick, Family event"
                    />
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                    setStudentForLeave(null);
                    setLeaveReason('');
                }}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkAsLeave}>Confirm Leave</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
     </AlertDialog>
    </div>
  );
}

    

    

    
