'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Check, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Student } from '@/lib/types';

type ScanResultType = 'success' | 'duplicate' | 'error';

export function QrScanner() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [lastResult, setLastResult] = useState<{ text: string; type: ScanResultType } | null>(null);
  const processingRef = useRef(false);

  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const duplicateAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio
  useEffect(() => {
    successAudioRef.current = new Audio('/sounds/success.mp3');
    duplicateAudioRef.current = new Audio('/sounds/duplicate.mp3');
    errorAudioRef.current = new Audio('/sounds/error.mp3');
    
    successAudioRef.current.preload = 'auto';
    duplicateAudioRef.current.preload = 'auto';
    errorAudioRef.current.preload = 'auto';
  }, []);

  const playSound = (type: ScanResultType) => {
    // Stop any currently playing sound to prevent overlaps
    successAudioRef.current?.pause();
    successAudioRef.current!.currentTime = 0;
    duplicateAudioRef.current?.pause();
    duplicateAudioRef.current!.currentTime = 0;
    errorAudioRef.current?.pause();
    errorAudioRef.current!.currentTime = 0;

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
    }, 2000);
  };


  const handleAttendance = async (studentId: string): Promise<void> => {
    if (!user) {
      showFeedback(studentId, 'error');
      toast({ variant: 'destructive', title: 'Error', description: 'You are not logged in.' });
      return;
    }

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      // First, check if attendance for this student already exists today
      const attendanceCollection = collection(firestore, `teachers/${user.uid}/attendance`);
      const attendanceQuery = query(
        attendanceCollection,
        where('studentId', '==', studentId),
        where('date', '==', todayStr)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      if (!attendanceSnapshot.empty) {
        showFeedback(studentId, 'duplicate');
        toast({ variant: 'default', title: 'Already Present', description: `Student ID "${studentId}" has already been marked present today.` });
        return;
      }

      // If not present, check if student exists
      const studentsCollection = collection(firestore, `teachers/${user.uid}/students`);
      const studentQuery = query(studentsCollection, where('studentId', '==', studentId));
      const studentSnapshot = await getDocs(studentQuery);
      
      if (studentSnapshot.empty) {
        showFeedback(studentId, 'error');
        toast({ variant: 'destructive', title: 'Student not found', description: `Student ID "${studentId}" is not in your roster.` });
        return;
      }

      // If student exists and is not present, add attendance record
      const studentName = studentSnapshot.docs[0].data().name as string;
      await addDoc(attendanceCollection, {
        studentId,
        teacherId: user.uid,
        date: todayStr,
        timestamp: Timestamp.now(),
        status: 'present'
      });
      showFeedback(studentId, 'success');
      toast({ title: 'Success', description: `${studentName} marked as present.` });
      
    } catch (error) {
      console.error("Error marking attendance:", error);
      showFeedback(studentId, 'error');
      toast({ variant: 'destructive', title: 'Database Error', description: 'Could not mark attendance. Please try again.' });
    }
  };

  useEffect(() => {
    if (!scannerRef.current || html5QrCodeRef.current?.getState() === Html5QrcodeScannerState.SCANNING || !user) {
      return;
    }
    
    const html5QrCode = new Html5Qrcode(scannerRef.current.id, false);
    html5QrCodeRef.current = html5QrCode;
    
    const qrCodeSuccessCallback = (decodedText: string) => {
      if (processingRef.current) return;
      
      processingRef.current = true;
      handleAttendance(decodedText);
    };
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 }, showTorchButtonIfSupported: true };

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

    startScanner();

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop QR scanner.", err));
      }
    };
  }, [user, toast]);


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
      <CardContent className="p-0 relative">
        <div id="qr-scanner" ref={scannerRef} className="w-full rounded-lg overflow-hidden aspect-square bg-slate-900"></div>
        
        {lastResult && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/50">
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
