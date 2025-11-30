
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { Student, AttendanceRecord } from '@/lib/types';
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
import { ChevronsUpDown, Check, UserSearch, Loader2, UserCheck, UserX, UserMinus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parse } from 'date-fns';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';


export default function StudentHistoryView() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [studentHistory, setStudentHistory] = useState<AttendanceRecord[]>([]);

  const studentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `teachers/${user.uid}/students`), orderBy('name'));
  }, [user, firestore]);

  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  
  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    setOpen(false);
    setIsLoadingHistory(true);
    if (user) {
      const attendanceQuery = query(
        collection(firestore, `teachers/${user.uid}/attendance`),
        where('studentId', '==', student.studentId)
      );
      const snapshot = await getDocs(attendanceQuery);
      const history = snapshot.docs.map(doc => doc.data() as AttendanceRecord);
      // Sort on the client side to avoid needing a composite index
      history.sort((a, b) => b.date.localeCompare(a.date));
      setStudentHistory(history);
    }
    setIsLoadingHistory(false);
  };

  const stats = useMemo(() => {
    if (!studentHistory) return { present: 0, absent: 0, onLeave: 0 };
    return {
      present: studentHistory.filter(r => r.status === 'present').length,
      onLeave: studentHistory.filter(r => r.status === 'on_leave').length,
    };
  }, [studentHistory]);

  const badgeVariant = {
    present: 'default',
    on_leave: 'secondary',
    absent: 'destructive',
  } as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Student Attendance History</CardTitle>
        <CardDescription>
          Select a student to view their complete attendance record.
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
                    {isLoadingStudents ? <div className='p-2'>Loading...</div> : students?.map((student) => (
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
                            <p className="text-2xl font-bold">...</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-72">
                        {isLoadingHistory ? (
                             <div className="space-y-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                             </div>
                        ) : studentHistory.length > 0 ? (
                            <ul className="space-y-2">
                                {studentHistory.map(record => (
                                    <li key={record.id} className="flex justify-between items-center p-2 rounded-md bg-muted">
                                        <span className="font-medium">{format(parse(record.date, 'yyyy-MM-dd', new Date()), 'PPP')}</span>
                                        <Badge variant={badgeVariant[record.status]}>{record.status.replace('_', ' ').toLocaleUpperCase()}</Badge>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="text-center text-muted-foreground pt-10">
                                No attendance records found for this student.
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

    