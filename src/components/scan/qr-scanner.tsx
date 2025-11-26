
'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, Timestamp, setDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { AlertTriangle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';


export function QrScanner() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [scanResult, setScanResult] = useState<{ text: string; type: 'success' | 'duplicate' | 'error' } | null>(null);
  const processingRef = useRef(false);

  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const duplicateAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio on the client to be ready for playback
    successAudioRef.current = new Audio('/sounds/success.mp3');
    duplicateAudioRef.current = new Audio('/sounds/duplicate.mp3');
    errorAudioRef.current = new Audio('/sounds/error.mp3');
    
    // Preload for faster playback
    successAudioRef.current.preload = 'auto';
    duplicateAudioRef.current.preload = 'auto';
    errorAudioRef.current.preload = 'auto';
  }, []);

  useEffect(() => {
    if (!scannerRef.current || html5QrCodeRef.current?.getState() === Html5QrcodeScannerState.SCANNING || !user) {
        return;
    }
    
    const html5QrCode = new Html5Qrcode(scannerRef.current.id, {
       experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    });
    html5QrCodeRef.current = html5QrCode;
    
    const qrCodeSuccessCallback = (decodedText: string) => {
        if(processingRef.current) return;
        
        processingRef.current = true;
        
        // --- Optimistic UI Update ---
        // Play sound and show UI immediately for instant feedback
        successAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
        setScanResult({ text: decodedText, type: 'success' });
        
        // Handle database logic in the background
        handleAttendance(decodedText);
        
        // Set cooldown and reset UI
        setTimeout(() => {
          setScanResult(null);
          processingRef.current = false;
        }, 3000);
    };
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    const cameraConfig = { facingMode: "environment" };

    html5QrCode.start(
        cameraConfig,
        config,
        qrCodeSuccessCallback,
        undefined
    ).catch(err => {
        console.error("Failed to start QR scanner:", err);
        html5QrCode.start(
          { }, // Use any available camera
          config,
          qrCodeSuccessCallback,
          undefined
        ).catch(err => {
            console.error("Failed to start any camera:", err);
            toast({ 
                variant: "destructive", 
                title: "Camera Error", 
                description: "Could not start camera. Please ensure you have given permission in your browser settings." 
            });
        })
    });

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop QR scanner.", err));
      }
    };
  }, [user, toast]);

  const handleAttendance = async (studentId: string): Promise<void> => {
    if (!user) {
        return; // Should not happen if scanner is active
    }
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    try {
        const studentsCollection = collection(firestore, `teachers/${user.uid}/students`);
        const studentQuery = query(studentsCollection, where('studentId', '==', studentId));
        const studentSnapshot = await getDocs(studentQuery);

        if(studentSnapshot.empty) {
            errorAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
            setScanResult({ text: studentId, type: 'error' });
            toast({ variant: 'destructive', title: 'Student not found', description: 'This student is not in your roster.' });
            return;
        }
        const studentName = studentSnapshot.docs[0].data().name;

        const attendanceCollection = collection(firestore, `teachers/${user.uid}/attendance`);
        const attendanceQuery = query(
            attendanceCollection,
            where('studentId', '==', studentId),
            where('date', '==', todayStr)
        );
        const querySnapshot = await getDocs(attendanceQuery);

        if (!querySnapshot.empty) {
            const existingDoc = querySnapshot.docs[0];
            const status = existingDoc.data().status;
            
            if (status === 'present') {
                 duplicateAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
                 setScanResult({ text: studentId, type: 'duplicate' });
                 toast({ variant: 'default', title: 'Already Present', description: `Student ${studentName} has already been marked present.` });
            } else { // if status is 'on_leave'
                 await setDoc(existingDoc.ref, { status: 'present', timestamp: Timestamp.now() }, { merge: true });
                 setScanResult({ text: studentId, type: 'success' }); // Already optimistically set
                 toast({ title: 'Status Updated', description: `${studentName} status updated to present.` });
            }
            return;
        }
        
        // This is the success case for a new attendance record
        addDocumentNonBlocking(attendanceCollection, {
            studentId,
            teacherId: user.uid,
            date: todayStr,
            timestamp: Timestamp.now(),
            status: 'present'
        });
        // UI is already optimistically updated
        toast({ title: 'Success', description: `${studentName} marked as present.` });

    } catch (error) {
        console.error("Error marking attendance:", error);
        errorAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
        setScanResult({ text: studentId, type: 'error' });
        toast({ variant: 'destructive', title: 'Error', description: 'Could not mark attendance. Please try again.' });
    }
  };

  const indicatorColor = {
    success: 'bg-green-500',
    duplicate: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <Card className="w-full max-w-md bg-transparent shadow-none border-none">
      <CardContent className="p-0 relative">
        <div id="qr-scanner" ref={scannerRef} className="w-full rounded-xl overflow-hidden aspect-square bg-muted"></div>
        
        {scanResult && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={cn("w-24 h-24 rounded-full animate-ping-slow opacity-75", indicatorColor[scanResult.type])}></div>
          </div>
        )}

        {scanResult && (
          <div className={cn(
            "absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-mono pointer-events-none flex items-center gap-2",
            indicatorColor[scanResult.type],
            "text-white"
          )}>
            {scanResult.type === 'success' && <Check className="h-4 w-4" />}
            {scanResult.type === 'duplicate' && <AlertTriangle className="h-4 w-4" />}
            {scanResult.type === 'error' && <X className="h-4 w-4" />}
            {scanResult.text}
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none border-[10px] border-black/10 rounded-xl" />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-8 w-10 h-10 border-t-4 border-l-4 border-white/80 rounded-tl-lg"></div>
          <div className="absolute top-8 right-8 w-10 h-10 border-t-4 border-r-4 border-white/80 rounded-tr-lg"></div>
          <div className="absolute bottom-8 left-8 w-10 h-10 border-b-4 border-l-4 border-white/80 rounded-bl-lg"></div>
          <div className="absolute bottom-8 right-8 w-10 h-10 border-b-4 border-r-4 border-white/80 rounded-br-lg"></div>
        </div>

      </CardContent>
    </Card>
  );
}

    