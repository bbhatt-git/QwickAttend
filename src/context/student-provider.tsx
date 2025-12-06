
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import type { Student } from '@/lib/types';

interface StudentContextType {
  students: WithId<Student>[] | null;
  isLoading: boolean;
  error: Error | null;
  refetchStudents: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const studentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `teachers/${user.uid}/students`), orderBy('name'));
  }, [user, firestore, refetchTrigger]);

  const { data: students, isLoading, error } = useCollection<Student>(studentsQuery);

  const refetchStudents = useCallback(() => {
    setRefetchTrigger(t => t + 1);
  }, []);

  const value = { students, isLoading, error, refetchStudents };

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
};

export const useStudentData = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudentData must be used within a StudentProvider');
  }
  return context;
};
