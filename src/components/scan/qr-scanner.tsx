
"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, Timestamp, setDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { CheckCircle } from 'lucide-react';

const QR_BOX_SIZE = 300;

export function QrScanner() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  const processingRef = useRef(false);

  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const duplicateAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio on the client
    successAudioRef.current = new Audio('/sounds/success.mp3');
    duplicateAudioRef.current = new Audio('/sounds/duplicate.mp3');
    errorAudioRef.current = new Audio('/sounds/error.mp3');
  }, []);

  useEffect(() => {
    if (!scannerRef.current || html5QrCodeRef.current || !user) return;
    
    const html5QrCode = new Html5Qrcode(scannerRef.current.id, {
       experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    });
    html5QrCodeRef.current = html5QrCode;
    
    const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
        if(processingRef.current) return;
        
        processingRef.current = true;

        // --- Instant Feedback ---
        successAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
        setScanResult(decodedText);
        setShowSuccessIndicator(true);
        // --- End Instant Feedback ---

        // Asynchronous processing
        markAttendance(decodedText);
        
        setTimeout(() => {
          setScanResult(null);
          setShowSuccessIndicator(false);
          processingRef.current = false;
        }, 3000);
    };
    
    const config = { fps: 10, qrbox: { width: QR_BOX_SIZE, height: QR_BOX_SIZE }, supportedScanTypes: [] };
    const cameraConfig = { facingMode: "environment" };

    html5QrCode.start(
        cameraConfig,
        config,
        qrCodeSuccessCallback,
        undefined
    ).catch(err => {
        console.error("Failed to start QR scanner:", err);
        toast({ 
            variant: "destructive", 
            title: "Camera Error", 
            description: "Could not start camera. Please ensure you have given permission in your browser settings." 
        });
    });

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop QR scanner.", err));
      }
    };
  }, [user, toast, firestore]);

  const markAttendance = async (studentId: string): Promise<void> => {
    if (!user) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    try {
        const studentsCollection = collection(firestore, `teachers/${user.uid}/students`);
        const studentQuery = query(studentsCollection, where('studentId', '==', studentId));
        const studentSnapshot = await getDocs(studentQuery);
        if(studentSnapshot.empty) {
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
                 duplicateAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
                 toast({ variant: 'default', title: 'Already Present', description: `Student ${studentName} has already been marked present.` });
            } else {
                 await setDoc(existingDoc.ref, { status: 'present', timestamp: Timestamp.now() }, { merge: true });
                 // Success sound already played, so we just show toast
                 toast({ title: 'Status Updated', description: `${studentName} status updated to present.` });
            }
            return;
        }
        
        // Success sound already played
        addDocumentNonBlocking(attendanceCollection, {
            studentId,
            teacherId: user.uid,
            date: todayStr,
            timestamp: Timestamp.now(),
            status: 'present'
        });
        toast({ title: 'Success', description: `${studentName} marked as present.` });

    } catch (error) {
        console.error("Error marking attendance:", error);
        errorAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
        toast({ variant: 'destructive', title: 'Error', description: 'Could not mark attendance. Please try again.' });
    }
  };

  return (
    <Card className="w-full max-w-md bg-transparent shadow-none border-none">
      <CardContent className="p-0 relative">
        <div id="qr-scanner" ref={scannerRef} className="w-full rounded-xl overflow-hidden aspect-square bg-muted"></div>
        
        {showSuccessIndicator && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 bg-green-500/80 rounded-full animate-ping-slow opacity-75"></div>
          </div>
        )}

        {scanResult && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-mono pointer-events-none">
            {scanResult}
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/50 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/50 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/50 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/50 rounded-br-lg"></div>
        </div>

      </CardContent>
    </Card>
  );
}
