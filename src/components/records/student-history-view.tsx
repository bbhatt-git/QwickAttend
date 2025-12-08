
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
import { ChevronsUpDown, Check, UserSearch, Loader2, UserCheck, UserX, UserMinus, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
        
        const adDateStr = new Date(adDate.getTime() - (adDate.getTimezoneOffset() * 60000 )).toISOString().split("T")[0];

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

  const handlePdfExport = () => {
    if (!selectedStudent || !user) return;
  
    const loadImageAsDataUrl = (url: string): Promise<{ dataUrl: string, width: number, height: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous"; // Try to avoid CORS issues
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve({ dataUrl, width: img.width, height: img.height });
            };
            img.onerror = (error) => {
                reject(new Error(`Failed to load image at URL: ${url}: ${error}`));
            };
            img.src = url;
        });
    };
  
    const logoUrl = 'https://raw.githubusercontent.com/bbhatt-git/app/refs/heads/main/sarc.png';
    const signatureUrl = 'https://raw.githubusercontent.com/bbhatt-git/app/refs/heads/main/pdf_sign.png';
    
    Promise.all([
      loadImageAsDataUrl(logoUrl),
      loadImageAsDataUrl(signatureUrl)
    ]).then(([logo, signature]) => {
      const doc = new jsPDF() as jsPDFWithAutoTable;
      const bsMonthYear = new NepaliDate(displayDate).format('MMMM YYYY');
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
  
      // --- HEADER ---
      doc.addImage(logo.dataUrl, 'PNG', margin, 12, 25, 25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor('#2563EB'); // Blue color for foundation name
      doc.text('SARC Education Foundation', pageWidth - margin, 18, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Bhimdatta - 06, Aithpur, Kanchanpur', pageWidth - margin, 24, { align: 'right' });
      doc.setDrawColor(220);
      doc.setLineWidth(0.2);
      doc.line(margin, 40, pageWidth - margin, 40);
  
      // --- REPORT TITLE ---
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40);
      doc.text('Student Attendance Report', pageWidth / 2, 55, { align: 'center' });
  
      // --- STUDENT INFO ---
      const classStr = selectedStudent.class;
      const sectionStr = selectedStudent.section;
      const rollNoRegex = new RegExp(`^${sectionStr.substring(0, 2)}${classStr}(\\d+)$`, 'i');
      const match = selectedStudent.studentId.match(rollNoRegex);
      const rollNo = match ? match[1] : 'N/A';
      
      const infoStartY = 70;

      doc.setFontSize(10);
      const infoLeft = [
          { label: 'Student Name:', value: selectedStudent.name },
          { label: 'Class:', value: classStr },
          { label: 'Section:', value: sectionStr },
          { label: 'Roll No.:', value: rollNo },
      ];
      
      infoLeft.forEach((item, index) => {
          doc.setTextColor(100);
          doc.text(item.label, margin, infoStartY + (index * 7));
          doc.setTextColor(0);
          doc.setFont('helvetica', 'bold');
          doc.text(item.value, margin + 35, infoStartY + (index * 7));
          doc.setFont('helvetica', 'normal');
      });

      const infoRight = [
          { label: 'Student ID:', value: selectedStudent.studentId },
          { label: 'Report Month:', value: bsMonthYear },
      ];
      
       infoRight.forEach((item, index) => {
          doc.setTextColor(100);
          doc.text(item.label, margin + (pageWidth/2.5) , infoStartY + (index * 7));
          doc.setTextColor(0);
          doc.setFont('helvetica', 'bold');
          doc.text(item.value, margin + (pageWidth/2.5) + 35, infoStartY + (index * 7));
          doc.setFont('helvetica', 'normal');
      });
  
      // --- SUMMARY TABLE ---
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Attendance Summary', margin, 115);
  
      doc.autoTable({
        startY: 120,
        theme: 'grid',
        head: [['Status', 'Total Days']],
        body: [
          ['Total Present', `${stats.present} days`],
          ['Total Absent', `${stats.absent} days`],
          ['Total On Leave', `${stats.onLeave} days`],
        ],
        headStyles: {
          fillColor: [79, 70, 229], // Tailwind's indigo-600
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        margin: { left: margin, right: margin },
      });
  
      // --- SIGNATURE ---
      let finalY = (doc as any).lastAutoTable.finalY + 20;
      const signatureBlockWidth = 60;
      const signatureX = pageWidth - margin - signatureBlockWidth;
      const signatureLineY = finalY + 15;
      
      const signatureImageWidth = 40;
      const signatureImageHeight = (signatureImageWidth / signature.width) * signature.height;

      // Position the signature image so its bottom touches the line
      doc.addImage(signature.dataUrl, 'PNG', pageWidth - margin - signatureImageWidth, signatureLineY - signatureImageHeight, signatureImageWidth, signatureImageHeight);

      doc.setLineWidth(0.2);
      doc.line(signatureX, signatureLineY, pageWidth - margin, signatureLineY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Bhagwat Dev Bhatt', pageWidth - margin, signatureLineY + 7, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('Program Coordinator', pageWidth - margin, signatureLineY + 12, { align: 'right' });
      doc.text('SARC Education Foundation', pageWidth - margin, signatureLineY + 17, { align: 'right' });
  
      // --- FOOTER ---
      doc.setDrawColor(220);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
  
      doc.setFontSize(8);
      doc.setTextColor(150);
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(`Generated on: ${formattedDate}`, margin, pageHeight - 10);
  
      doc.setFont('helvetica', 'italic');
      doc.text("Made with QwickAttend", pageWidth / 2, pageHeight - 10, { align: 'center' });
  
      doc.setFont('helvetica', 'normal');
      doc.text(`Page 1 of 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  
      doc.save(`attendance_report_${selectedStudent.studentId}_${bsMonthYear}.pdf`);
    }).catch(error => {
      console.error("Error generating PDF:", error);
      alert(`Failed to load required images for the PDF. ${error.message}`);
    });
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
                                                <span className="text-xs text-muted-foreground">Holiday: {record.holidayName}</span>
                                            )}
                                            {record.status === 'on_leave' && record.leaveReason && (
                                                <span className="text-xs text-muted-foreground">Reason: {record.leaveReason}</span>
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



    

    