'use client';

import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, Timestamp, addDoc, doc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Check, AlertTriangle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Student, AttendanceRecord } from '@/lib/types';

type ScanResultType = 'success' | 'duplicate' | 'error';

export function QrScanner() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [lastResult, setLastResult] = useState<{ text: string; type: ScanResultType } | null>(null);
  const processingRef = useRef(false);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const studentIdSet = useRef<Set<string>>(new Set());
  const todaysAttendanceSet = useRef<Set<string>>(new Set());

  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const duplicateAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio and data
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
        // Fetch all students for the teacher
        const studentsCollection = collection(firestore, `teachers/${user.uid}/students`);
        const studentSnapshot = await getDocs(studentsCollection);
        const sids = studentSnapshot.docs.map(doc => (doc.data() as Student).studentId);
        studentIdSet.current = new Set(sids);

        // Fetch today's attendance
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const attendanceCollection = collection(firestore, `teachers/${user.uid}/attendance`);
        const attendanceQuery = query(attendanceCollection, where('date', '==', todayStr));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const presentSids = attendanceSnapshot.docs.map(doc => (doc.data() as AttendanceRecord).studentId);
        todaysAttendanceSet.current = new Set(presentSids);
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
    // Stop any currently playing sound
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
      processingRef.current = false;
    }, 1500); // Shorter timeout for faster subsequent scans
  };

  const handleAttendance = useCallback((studentId: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

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

    // --- Success Case ---
    showFeedback(studentId, 'success');
    todaysAttendanceSet.current.add(studentId); // Optimistically update local state

    // Perform the database write in the background
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
        // If background write fails, show a toast. UI already showed success.
        toast({ variant: 'destructive', title: 'Database Error', description: 'Could not save attendance. Please check connection.' });
        // Optional: could add logic to revert optimistic update
        todaysAttendanceSet.current.delete(studentId);
      });
    }
  }, [user, firestore, toast]);

  useEffect(() => {
    if (!scannerRef.current || html5QrCodeRef.current?.getState() === Html5QrcodeScannerState.SCANNING || !user) {
      return;
    }
    
    const html5QrCode = new Html5Qrcode(scannerRef.current.id, false);
    html5QrCodeRef.current = html5QrCode;
    
    const qrCodeSuccessCallback = (decodedText: string) => {
      if (processingRef.current || isDataLoading) return;
      handleAttendance(decodedText);
    };
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 }, showTorchButtonIfSupported: true, aspectRatio: 1.0 };

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          qrCodeSuccessCallback,
          undefined
        );
      } catch (err) {
        console.warn("Failed to start rear camera, trying any camera:", err);
        try {
          await html5QrCode.start(
            {}, 
            config,
            qrCodeSuccessCallback,
            undefined
          );
        } catch (finalErr) {
          console.error("Failed to start any camera:", finalErr);
          toast({
            variant: "destructive",
            title: "Camera Error",
            description: "Could not start camera. Please ensure you have given permission in your browser settings."
          });
        }
      }
    };

    if (!isDataLoading) {
        startScanner();
    }

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop QR scanner.", err));
      }
    };
  }, [user, toast, handleAttendance, isDataLoading]);

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
      <CardContent className="p-0 relative aspect-square">
        <div id="qr-scanner" ref={scannerRef} className="w-full h-full rounded-lg overflow-hidden bg-slate-900"></div>
        
        {isDataLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white z-10">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p className="text-lg font-semibold">Loading Student Data...</p>
            </div>
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
