'use client';

import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Check, AlertTriangle, X, Loader2, Nfc } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Student, AttendanceRecord } from '@/lib/types';

type ScanResultType = 'success' | 'duplicate' | 'error';

export function NfcScanner() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'scanned' | 'error'>('idle');
  const [lastResult, setLastResult] = useState<{ text: string; type: ScanResultType } | null>(null);
  const processingRef = useRef(false);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const studentIdSet = useRef<Set<string>>(new Set());
  const todaysAttendanceSet = useRef<Set<string>>(new Set());

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
      processingRef.current = false; // Allow next scan
    }, 1500);
  };

  const handleAttendance = useCallback((studentId: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanStatus('scanned');

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

  useEffect(() => {
    if (isDataLoading || !('NDEFReader' in window)) return;
    
    const abortController = new AbortController();

    const startNfcScan = async () => {
      try {
        const ndef = new NDEFReader();
        await ndef.scan({ signal: abortController.signal });
        
        ndef.addEventListener('reading', event => {
          const { message } = event;
          for (const record of message.records) {
            if (record.recordType === 'text') {
              const textDecoder = new TextDecoder(record.encoding);
              const studentId = textDecoder.decode(record.data);
              handleAttendance(studentId);
              return; // Handle first text record and stop
            }
          }
        });

        ndef.addEventListener('readingerror', () => {
          toast({ variant: 'destructive', title: 'NFC Read Error', description: 'Could not read the NFC tag. Please try again.' });
          setScanStatus('error');
        });
        
        setScanStatus('scanning');
      } catch (error: any) {
        console.error('NFC Scan failed:', error);
        toast({
          variant: 'destructive',
          title: 'NFC Error',
          description: error.message || 'Could not start NFC scanning. Please check permissions.',
        });
        setScanStatus('error');
      }
    };
    
    startNfcScan();

    return () => {
      abortController.abort();
    };
  }, [isDataLoading, toast, handleAttendance]);


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
    <Card className="w-full max-w-md shadow-lg rounded-xl overflow-hidden bg-muted">
      <CardContent className="p-0 relative aspect-square flex flex-col items-center justify-center text-center">
        
        {isDataLoading && (
            <>
                <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                <p className="text-lg font-semibold text-foreground">Loading Student Data...</p>
                <p className="text-sm text-muted-foreground">Please wait.</p>
            </>
        )}
        
        {!isDataLoading && scanStatus === 'scanning' && (
            <>
                <Nfc className="h-20 w-20 text-primary animate-pulse" />
                <h2 className="text-2xl font-bold mt-4">Ready to Scan</h2>
                <p className="text-muted-foreground mt-2">Hold an NFC tag near your device.</p>
            </>
        )}

        {!isDataLoading && scanStatus === 'error' && (
             <>
                <X className="h-20 w-20 text-destructive" />
                <h2 className="text-2xl font-bold mt-4">Scan Error</h2>
                <p className="text-muted-foreground mt-2">Could not start scanning. Please refresh and try again.</p>
            </>
        )}
        
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
