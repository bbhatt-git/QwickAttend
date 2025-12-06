
"use client";

import { useState, useMemo } from 'react';
import { useStudentData } from '@/context/student-provider';
import { useDebounce } from '@/hooks/use-debounce';
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
import { StudentActions } from '@/components/students/student-actions';

export function StudentsTable() {
  const { students, isLoading, refetchStudents } = useStudentData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('studentId');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const uniqueClasses = useMemo(() => {
    if (!students) return [];
    const classes = new Set(students.map(s => s.class));
    return Array.from(classes).sort();
  }, [students]);

  const sortedAndFilteredStudents = useMemo(() => {
    if (!students) return [];
    
    let filtered = [...students];

    if (sectionFilter !== 'all') {
      filtered = filtered.filter(student => student.section === sectionFilter);
    }

    if (classFilter !== 'all') {
      filtered = filtered.filter(student => student.class === classFilter);
    }
    
    if (debouncedSearchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        }
        return a.studentId.localeCompare(b.studentId);
    });

  }, [students, debouncedSearchTerm, sectionFilter, classFilter, sortBy]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
        <CardDescription>
        Manage your students and their QR codes.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="flex items-center pb-4 gap-2 flex-wrap">
          <Input
            placeholder="Filter by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <div className="flex gap-2 w-full sm:w-auto">
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="studentId">Sort by Student ID</SelectItem>
              </SelectContent>
            </Select>
        </div>
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
            ) : sortedAndFilteredStudents.length > 0 ? (
              sortedAndFilteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{student.studentId}</TableCell>
                  <TableCell className="hidden md:table-cell">{student.class}</TableCell>
                  <TableCell className="hidden md:table-cell">{student.section}</TableCell>
                  <TableCell className="hidden lg:table-cell">{student.contact || '-'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <StudentActions student={student} onActionComplete={refetchStudents} />
                    </div>
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
