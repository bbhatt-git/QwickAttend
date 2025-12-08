
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useStudentData } from '@/context/student-provider';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { Student, AttendanceRecord, Holiday } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check, UserSearch, Loader2, UserCheck, UserX, UserMinus, ChevronLeft, ChevronRight, CalendarOff, FileText, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import NepaliDate from 'nepali-date-converter';


type MonthlyRecord = {
  date: string; // BS Date string 'YYYY-MM-DD'
  bsDay: string;
  adDate: Date;
  status: 'present' | 'on_leave' | 'absent' | 'saturday' | 'holiday';
  holidayName?: string;
  leaveReason?: string;
};

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export default function StudentHistoryView() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { students, isLoading: isLoadingStudents } = useStudentData();

  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [studentHistory, setStudentHistory] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [displayDate, setDisplayDate] = useState(new Date());

  
  useEffect(() => {
    const fetchHistoryAndHolidays = async () => {
        if (!selectedStudent || !user) return;
        
        setIsLoadingHistory(true);

        const attendanceQuery = query(
            collection(firestore, `teachers/${user.uid}/attendance`),
            where('studentId', '==', selectedStudent.studentId),
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const history = attendanceSnapshot.docs.map(doc => doc.data() as AttendanceRecord);
        setStudentHistory(history);
        
        const holidaysQuery = query(collection(firestore, `teachers/${user.uid}/holidays`));
        const holidaysSnapshot = await getDocs(holidaysQuery);
        const holidayData = holidaysSnapshot.docs.map(doc => doc.data() as Holiday);
        setHolidays(holidayData);
        
        setIsLoadingHistory(false);
    };
    fetchHistoryAndHolidays();
  }, [selectedStudent, user, firestore]);


  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    setOpen(false);
    setDisplayDate(new Date()); // Reset to current month on new student selection
  };
  
  const monthlyRecords = useMemo((): MonthlyRecord[] => {
    if (!selectedStudent) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bsDate = new NepaliDate(displayDate);
    const bsYear = bsDate.getYear();
    const bsMonth = bsDate.getMonth();
    const daysInMonth = new NepaliDate(bsYear, bsMonth + 1, 0).getDate();
    
    const holidayDateSet = new Map(holidays.map(h => [h.date, h.name]));

    const records: MonthlyRecord[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const currentBsDate = new NepaliDate(bsYear, bsMonth, day);
        const adDate = currentBsDate.toJsDate();
        adDate.setHours(0, 0, 0, 0);

        if (adDate > today) {
            continue; // Skip future dates
        }
        
        const adDateStr = format(adDate, 'yyyy-MM-dd');
        
        const holidayName = holidayDateSet.get(adDateStr);
        if (holidayName) {
            records.push({
                date: currentBsDate.format('YYYY-MM-DD'),
                bsDay: currentBsDate.format('DD'),
                adDate: adDate,
                status: 'holiday',
                holidayName: holidayName,
            });
            continue;
        }

        if (currentBsDate.getDay() === 6) { // Saturday
             records.push({
                date: currentBsDate.format('YYYY-MM-DD'),
                bsDay: currentBsDate.format('DD'),
                adDate: adDate,
                status: 'saturday',
            });
            continue;
        }

        const firestoreRecord = studentHistory.find(rec => rec.date === adDateStr);

        records.push({
            date: currentBsDate.format('YYYY-MM-DD'),
            bsDay: currentBsDate.format('DD'),
            adDate: adDate,
            status: firestoreRecord ? firestoreRecord.status : 'absent',
            leaveReason: firestoreRecord?.status === 'on_leave' ? firestoreRecord.leaveReason : undefined,
        });
    }

    return records.reverse(); // Show most recent first
  }, [studentHistory, holidays, displayDate, selectedStudent]);

  const stats = useMemo(() => {
    const present = monthlyRecords.filter(r => r.status === 'present').length;
    const onLeave = monthlyRecords.filter(r => r.status === 'on_leave').length;
    const absent = monthlyRecords.filter(r => r.status === 'absent').length;
    return { present, onLeave, absent };
  }, [monthlyRecords]);

  const handlePdfExport = async () => {
    if (!selectedStudent || !user) return;
  
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const bsMonthYear = new NepaliDate(displayDate).format('MMMM YYYY');
    const primaryColor = '#1e40af';
  
    const loadImageAsDataUrl = (url: string): Promise<string> => {
        return fetch(url)
            .then(response => response.blob())
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }));
    };
  
    try {
      const logoDataUrl = await loadImageAsDataUrl('/sarc.png');
  
      const header = (data: any) => {
        // Logo
        doc.addImage(logoDataUrl, 'PNG', 14, 12, 25, 25);
  
        // School Info
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(primaryColor);
        doc.text('SARC Education Foundation', doc.internal.pageSize.getWidth() - 14, 20, { align: 'right' });
  
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.text('Bhimdatta - 06, Aithpur, Kanchanpur', doc.internal.pageSize.getWidth() - 14, 26, { align: 'right' });
  
        // Line separator
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(14, 40, doc.internal.pageSize.getWidth() - 14, 40);
      };
  
      const footer = (data: any) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setLineWidth(0.5);
        doc.setDrawColor(200);
        doc.line(14, doc.internal.pageSize.height - 20, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.height - 20);
  
        doc.setFontSize(8);
        doc.setTextColor(150);
        const footerText = `Generated on: ${new Date().toLocaleDateString()}`;
        doc.text(footerText, 14, doc.internal.pageSize.height - 10);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
      };
  
      // Report Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40);
      doc.text('Student Attendance Report', doc.internal.pageSize.getWidth() / 2, 55, { align: 'center' });
  
      // Student Info
      let startY = 65;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Student Name:`, 14, startY);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedStudent.name}`, 45, startY);
  
      doc.setFont('helvetica', 'normal');
      doc.text(`Class:`, 14, startY + 6);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedStudent.class} - ${selectedStudent.section}`, 45, startY + 6);
  
      doc.setFont('helvetica', 'normal');
      doc.text(`Student ID:`, doc.internal.pageSize.getWidth() - 80, startY);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedStudent.studentId}`, doc.internal.pageSize.getWidth() - 14, startY, { align: 'right' });
  
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Month:`, doc.internal.pageSize.getWidth() - 80, startY + 6);
      doc.setFont('helvetica', 'bold');
      doc.text(`${bsMonthYear}`, doc.internal.pageSize.getWidth() - 14, startY + 6, { align: 'right' });
  
      // Table Data
      const tableData = monthlyRecords.map((record, index) => {
        let statusText: string;
        switch(record.status) {
            case 'present': statusText = 'Present'; break;
            case 'absent': statusText = 'Absent'; break;
            case 'on_leave': statusText = `On Leave (${record.leaveReason || 'N/A'})`; break;
            case 'saturday': statusText = 'Saturday'; break;
            case 'holiday': statusText = `Holiday (${record.holidayName || 'N/A'})`; break;
            default: statusText = 'N/A';
        }
        return [
            monthlyRecords.length - index,
            new NepaliDate(record.adDate).format('DD MMMM, YYYY'),
            statusText,
        ];
      });
  
      doc.autoTable({
        startY: startY + 16,
        head: [['S.N.', 'Date (BS)', 'Status']],
        body: tableData,
        theme: 'grid',
        didDrawPage: (data) => {
            header(data);
            footer(data);
        },
        headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: 'bold',
        },
        foot: [
            [{ content: 'Total Summary', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fillColor: [230, 230, 230] } }],
            ['Present', { content: `${stats.present} days`, colSpan: 2, styles: { fontStyle: 'bold' } }],
            ['Absent', { content: `${stats.absent} days`, colSpan: 2, styles: { fontStyle: 'bold' } }],
            ['On Leave', { content: `${stats.onLeave} days`, colSpan: 2, styles: { fontStyle: 'bold' } }],
        ],
        footStyles: {
            fillColor: [245, 245, 245],
            textColor: 40,
        },
        margin: { top: 45, bottom: 25 }
      });
  
      // Signature Line
      let finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setLineWidth(0.2);
      doc.line(14, finalY, 70, finalY);
      doc.text('Class Teacher', 14, finalY + 5);
  
      doc.save(`attendance_report_${selectedStudent.studentId}_${bsMonthYear}.pdf`);
  
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to load school logo. Could not generate PDF.");
    }
  };


  const badgeVariant = {
    present: 'default',
    on_leave: 'secondary',
    absent: 'destructive',
    saturday: 'outline',
    holiday: 'outline'
  } as const;
  
  const statusText = {
    present: 'Present',
    on_leave: 'On Leave',
    absent: 'Absent',
    saturday: 'Saturday',
    holiday: 'Holiday'
  };
  
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const currentDate = new NepaliDate(displayDate);
    let newDate: NepaliDate;
    if (direction === 'prev') {
        newDate = new NepaliDate(currentDate.getYear(), currentDate.getMonth() - 1, 1);
    } else {
        newDate = new NepaliDate(currentDate.getYear(), currentDate.getMonth() + 1, 1);
    }
    setDisplayDate(newDate.toJsDate());
  };
  
  const isNextMonthDisabled = () => {
    const currentMonth = new NepaliDate();
    const viewingMonth = new NepaliDate(displayDate);
    return viewingMonth.getYear() === currentMonth.getYear() && viewingMonth.getMonth() === currentMonth.getMonth();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Student Attendance History</CardTitle>
        <CardDescription>
          Select a student to view their complete monthly attendance record.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full sm:w-[300px] justify-between"
                >
                {selectedStudent
                    ? `${selectedStudent.name} (${selectedStudent.studentId})`
                    : 'Select a student...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                <CommandInput placeholder="Search student..." />
                <CommandList>
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup>
                    {isLoadingStudents ? <div className='p-2'><Loader2 className="h-4 w-4 animate-spin"/></div> : students?.map((student) => (
                        <CommandItem
                        key={student.id}
                        value={`${student.name} ${student.studentId}`}
                        onSelect={() => handleStudentSelect(student)}
                        >
                        <Check
                            className={cn(
                            'mr-2 h-4 w-4',
                            selectedStudent?.id === student.id ? 'opacity-100' : 'opacity-0'
                            )}
                        />
                        {student.name} ({student.studentId})
                        </CommandItem>
                    ))}
                    </CommandGroup>
                </CommandList>
                </Command>
            </PopoverContent>
            </Popover>
        </div>

        {!selectedStudent && (
            <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed rounded-lg">
                <UserSearch className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Select a Student</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Choose a student from the list to see their attendance history.
                </p>
            </div>
        )}

        {selectedStudent && (
          <div className="space-y-4">
             <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center space-x-4">
                        <div className='p-3 rounded-lg text-green-500 bg-green-100 dark:bg-green-900/50'><UserCheck className="h-6 w-6" /></div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Present</p>
                            <p className="text-2xl font-bold">{stats.present}</p>
                        </div>
                    </div>
                </Card>
                 <Card className="p-4">
                    <div className="flex items-center space-x-4">
                        <div className='p-3 rounded-lg text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50'><UserMinus className="h-6 w-6" /></div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total On Leave</p>
                            <p className="text-2xl font-bold">{stats.onLeave}</p>
                        </div>
                    </div>
                </Card>
                 <Card className="p-4">
                    <div className="flex items-center space-x-4">
                        <div className='p-3 rounded-lg text-red-500 bg-red-100 dark:bg-red-900/50'><UserX className="h-6 w-6" /></div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Absent</p>
                            <p className="text-2xl font-bold">{isLoadingHistory ? <Loader2 className='h-6 w-6 animate-spin' /> : stats.absent}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div className='space-y-1'>
                         <CardTitle>Attendance Log</CardTitle>
                         <CardDescription>{new NepaliDate(displayDate).format('MMMM YYYY')}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')} disabled={isNextMonthDisabled()}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button onClick={handlePdfExport}>
                           <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-72">
                        {isLoadingHistory ? (
                             <div className="space-y-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                             </div>
                        ) : monthlyRecords.length > 0 ? (
                            <ul className="space-y-2">
                                {monthlyRecords.map(record => (
                                    <li key={record.date} className="flex justify-between items-center p-2 rounded-md bg-muted">
                                        <div className='flex flex-col'>
                                            <span className="font-medium">{new NepaliDate(record.adDate).format('DD MMMM, YYYY')}</span>
                                            {record.status === 'holiday' && record.holidayName && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1"><CalendarOff className="h-3 w-3" />{record.holidayName}</span>
                                            )}
                                            {record.status === 'on_leave' && record.leaveReason && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" />{record.leaveReason}</span>
                                            )}
                                        </div>
                                        <Badge variant={badgeVariant[record.status]}>{statusText[record.status]}</Badge>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="text-center text-muted-foreground pt-10">
                                No attendance records found for this student in this month.
                             </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    

    

    