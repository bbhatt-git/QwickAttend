
"use client";

import { useState, useMemo, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import type { Student } from '@/lib/types';
import Image from 'next/image';

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
import { Skeleton } from '@/components/ui/skeleton';
import { AddStudentDialog } from '@/components/students/add-student-dialog';
import { StudentActions } from '@/components/students/student-actions';

export function StudentsTable() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // A simple way to force a refetch
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const studentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `teachers/${user.uid}/students`),
      orderBy('name', 'asc')
    );
  }, [firestore, user, refetchTrigger]);

  const { data: studentsFromHook, isLoading } = useCollection<Omit<Student, 'teacherId'>>(studentsQuery);

  const students = useMemo(() => {
    if (!studentsFromHook || !user) return [];
    return studentsFromHook.map(student => ({
      ...student,
      teacherId: user.uid,
    }));
  }, [studentsFromHook, user]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchTerm) return students;
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleActionComplete = () => {
    // Incrementing the trigger will cause the useMemoFirebase hook to re-evaluate
    // and the useCollection hook to refetch the data.
    setRefetchTrigger(count => count + 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Students</CardTitle>
        <CardDescription>
          A list of all students in your classes.
        </CardDescription>
        <div className="flex items-center gap-4 pt-4">
          <Input
            placeholder="Filter by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <AddStudentDialog onStudentAdded={handleActionComplete} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Class & Section</TableHead>
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
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>{student.class} - {student.section}</TableCell>
                  <TableCell>
                    <StudentActions student={student} onActionComplete={handleActionComplete} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No students found. Add your first student to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
