'use client';

import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, AlertTriangle, X, Loader2, Usb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Student, AttendanceRecord } from '@/lib/types';

type ScanResultType = 'success' | 'duplicate' | 'error';

export function UsbScanner() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [lastResult, setLastResult] = useState<{ text: string; type: ScanResultType } | null>(null);
  const [scannedId, setScannedId] = useState('');
  const [isActive, setIsActive] = useState(false);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const studentIdSet = useRef<Set<string>>(new Set());
  const todaysAttendanceSet = useRef<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const duplicateAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio and student data
  useEffect(() => {
    successAudioRef.current = new Audio('/sounds/success.mp3');
    duplicateAudioRef.current = new Audio('/sounds/duplicate.mp3');
    errorAudioRef.current = new Audio('/sounds/error.mp3');
    successAudioRef.current.preload = 'auto';
    duplicateAudioRef.current.preload = 'auto';
    errorAudioRef.current.preload = 'auto';

    const preloadData = async () => {
      if (!user) return;
      setIsDataLoading(true);
      try {
        const studentsCollection = collection(firestore, `teachers/${user.uid}/students`);
        const studentSnapshot = await getDocs(studentsCollection);
        studentIdSet.current = new Set(studentSnapshot.docs.map(doc => (doc.data() as Student).studentId));

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const attendanceCollection = collection(firestore, `teachers/${user.uid}/attendance`);
        const attendanceQuery = query(attendanceCollection, where('date', '==', todayStr));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        todaysAttendanceSet.current = new Set(attendanceSnapshot.docs.map(doc => (doc.data() as AttendanceRecord).studentId));
      } catch (error) {
        console.error("Failed to preload data", error);
        toast({ variant: 'destructive', title: 'Data Load Error', description: 'Could not load student data.' });
      } finally {
        setIsDataLoading(false);
      }
    };

    preloadData();
  }, [user, firestore, toast]);

  const activateScanner = () => {
    inputRef.current?.focus();
    setIsActive(true);
  }
  
  useEffect(() => {
    if (!isDataLoading) {
      activateScanner();
    }
  }, [isDataLoading]);

  const playSound = (type: ScanResultType) => {
    [successAudioRef, duplicateAudioRef, errorAudioRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });

    switch (type) {
      case 'success':
        successAudioRef.current?.play().catch(e => console.error("Success audio play failed:", e));
        break;
      case 'duplicate':
        duplicateAudioRef.current?.play().catch(e => console.error("Duplicate audio play failed:", e));
        break;
      case 'error':
        errorAudioRef.current?.play().catch(e => console.error("Error audio play failed:", e));
        break;
    }
  };
  
  const showFeedback = (text: string, type: ScanResultType) => {
    setLastResult({ text, type });
    playSound(type);
    
    setTimeout(() => {
      setLastResult(null);
      setScannedId('');
      inputRef.current?.focus(); // Re-focus after feedback
    }, 1500);
  };

  const handleAttendance = useCallback((studentId: string) => {
    if (!studentId) return;

    if (todaysAttendanceSet.current.has(studentId)) {
      showFeedback(studentId, 'duplicate');
      toast({ title: 'Already Present', description: `Student ID "${studentId}" has already been marked present today.` });
      return;
    }

    if (!studentIdSet.current.has(studentId)) {
      showFeedback(studentId, 'error');
      toast({ variant: 'destructive', title: 'Student not found', description: `Student ID "${studentId}" is not in your roster.` });
      return;
    }

    // Success Case
    showFeedback(studentId, 'success');
    todaysAttendanceSet.current.add(studentId); // Optimistic update

    if (user) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const attendanceCollection = collection(firestore, `teachers/${user.uid}/attendance`);
      addDoc(attendanceCollection, {
        studentId,
        teacherId: user.uid,
        date: todayStr,
        timestamp: Timestamp.now(),
        status: 'present'
      }).catch(error => {
        console.error("Error marking attendance:", error);
        toast({ variant: 'destructive', title: 'Database Error', description: 'Could not save attendance. Please check connection.' });
        todaysAttendanceSet.current.delete(studentId); // Revert optimistic update
      });
    }
  }, [user, firestore, toast]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleAttendance(scannedId);
  }

  const indicatorColor = {
    success: 'bg-green-500',
    duplicate: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const IndicatorIcon = {
    success: Check,
    duplicate: AlertTriangle,
    error: X,
  };

  return (
    <Card className="w-full max-w-md shadow-lg rounded-xl overflow-hidden relative">
      <CardContent className="p-0 flex flex-col items-center justify-center text-center aspect-square cursor-pointer" onClick={activateScanner}>
        
        {isDataLoading ? (
            <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                <p className="text-lg font-semibold text-foreground">Loading Student Data...</p>
                <p className="text-sm text-muted-foreground">Please wait.</p>
            </div>
        ) : isActive ? (
             <div className='flex flex-col items-center justify-center'>
                <Usb className="h-20 w-20 text-primary animate-pulse" />
                <h2 className="text-2xl font-bold">Scanner Active</h2>
                <p className="text-muted-foreground mt-2 px-4">Ready to receive input from your USB device.</p>
            </div>
        ) : (
            <div className='flex flex-col items-center justify-center'>
                <Usb className="h-20 w-20 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold">Click to Activate Scanner</h2>
                <p className="text-muted-foreground mt-2 px-4">The scanner will be ready once you click this area.</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="absolute -z-10 opacity-0">
          <Input
            ref={inputRef}
            type="text"
            value={scannedId}
            onChange={(e) => setScannedId(e.target.value)}
            onBlur={() => setIsActive(false)}
            onFocus={() => setIsActive(true)}
            disabled={!!lastResult || isDataLoading}
          />
        </form>
        
        {lastResult && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/50 z-20">
            <div className={cn("w-24 h-24 rounded-full flex items-center justify-center animate-ping-slow", indicatorColor[lastResult.type])}>
            </div>
            <div className={cn("absolute w-28 h-28 rounded-full flex items-center justify-center", indicatorColor[lastResult.type])}>
              {React.createElement(IndicatorIcon[lastResult.type], { className: "h-16 w-16 text-white" })}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
