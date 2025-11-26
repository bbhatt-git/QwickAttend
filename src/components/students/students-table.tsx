
"use client";

import { useState, useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import type { Student } from '@/lib/types';
import { SECTIONS } from '@/lib/constants';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AddStudentDialog } from '@/components/students/add-student-dialog';
import { StudentActions } from '@/components/students/student-actions';

export function StudentsTable() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('studentId');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const studentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    
    let q = collection(firestore, `teachers/${user.uid}/students`);

    const finalQuery = query(q, orderBy(sortBy, 'asc'));

    return finalQuery;
  }, [firestore, user, refetchTrigger, sortBy]);


  const { data: studentsFromHook, isLoading } = useCollection<Student>(studentsQuery);

  const students = useMemo(() => {
    if (!studentsFromHook || !user) return [];
    return studentsFromHook.map(student => ({
      ...student,
      teacherId: user.uid,
    }));
  }, [studentsFromHook, user]);

  const uniqueClasses = useMemo(() => {
    if (!students) return [];
    const classes = new Set(students.map(s => s.class));
    return Array.from(classes).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    
    let filtered = students;

    if (sectionFilter !== 'all') {
      filtered = filtered.filter(student => student.section === sectionFilter);
    }

    if (classFilter !== 'all') {
      filtered = filtered.filter(student => student.class === classFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [students, searchTerm, sectionFilter, classFilter]);

  const handleActionComplete = () => {
    setRefetchTrigger(count => count + 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Students</CardTitle>
        <CardDescription>
          A list of all students in your classes.
        </CardDescription>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-4 flex-wrap">
          <Input
            placeholder="Filter by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <div className="flex w-full sm:w-auto gap-2">
             <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {SECTIONS.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="studentId">Sort by Student ID</SelectItem>
              </SelectContent>
            </Select>
            <AddStudentDialog onStudentAdded={handleActionComplete} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Student ID</TableHead>
              <TableHead className="hidden md:table-cell">Class</TableHead>
              <TableHead className="hidden md:table-cell">Section</TableHead>
              <TableHead className="hidden lg:table-cell">Contact</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{student.studentId}</TableCell>
                  <TableCell className="hidden md:table-cell">{student.class}</TableCell>
                  <TableCell className="hidden md:table-cell">{student.section}</TableCell>
                  <TableCell className="hidden lg:table-cell">{student.contact || '-'}</TableCell>
                  <TableCell>
                    <StudentActions student={student} onActionComplete={handleActionComplete} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No students found for the selected criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
