
'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, Timestamp, setDoc, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Check, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


export function QrScanner() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [lastResult, setLastResult] = useState<{ text: string; type: 'success' | 'duplicate' | 'error' } | null>(null);
  const processingRef = useRef(false);

  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const duplicateAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    successAudioRef.current = new Audio('/sounds/success.mp3');
    duplicateAudioRef.current = new Audio('/sounds/duplicate.mp3');
    errorAudioRef.current = new Audio('/sounds/error.mp3');
    
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
        
        // Optimistic UI update
        successAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
        setLastResult({ text: decodedText, type: 'success' });

        // Handle DB logic in the background
        handleAttendance(decodedText);
        
        // Cooldown and UI reset
        setTimeout(() => {
          setLastResult(null);
          processingRef.current = false;
        }, 3000);
    };
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

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
            {}, // Use any available camera
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

 const handleAttendance = async (studentId: string): Promise<void> => {
    if (!user) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    try {
        const studentsCollection = collection(firestore, `teachers/${user.uid}/students`);
        const studentQuery = query(studentsCollection, where('studentId', '==', studentId));
        const studentSnapshot = await getDocs(studentQuery);

        if(studentSnapshot.empty) {
            setLastResult({ text: studentId, type: 'error' });
            errorAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
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
                 setLastResult({ text: studentId, type: 'duplicate' });
                 duplicateAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
                 toast({ variant: 'default', title: 'Already Present', description: `Student ${studentName} has already been marked present.` });
            } else { // if status is 'on_leave'
                 await setDoc(existingDoc.ref, { status: 'present', timestamp: Timestamp.now() }, { merge: true });
                 setLastResult({ text: studentId, type: 'success' });
                 successAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
                 toast({ title: 'Status Updated', description: `${studentName} status updated to present.` });
            }
            return;
        }
        
        await addDoc(attendanceCollection, {
            studentId,
            teacherId: user.uid,
            date: todayStr,
            timestamp: Timestamp.now(),
            status: 'present'
        });
        setLastResult({ text: studentId, type: 'success' });
        successAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
        toast({ title: 'Success', description: `${studentName} marked as present.` });

    } catch (error) {
        console.error("Error marking attendance:", error);
        setLastResult({ text: studentId, type: 'error' });
        errorAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
        toast({ variant: 'destructive', title: 'Error', description: 'Could not mark attendance. Please try again.' });
    }
  };


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
    <Card className="w-full max-w-md shadow-lg rounded-xl overflow-hidden border-4 border-primary/20 bg-muted">
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
