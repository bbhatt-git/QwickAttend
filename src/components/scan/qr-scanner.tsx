
"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, Timestamp, setDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const QR_BOX_SIZE = 300;

export function QrScanner() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processingRef = useRef(false); // To prevent concurrent processing

  useEffect(() => {
    // Pre-load the audio
    audioRef.current = new Audio('/sounds/beep.mp3');
  }, []);

  useEffect(() => {
    if (!scannerRef.current || html5QrCodeRef.current || !user) return;
    
    html5QrCodeRef.current = new Html5Qrcode(scannerRef.current.id);
    const html5QrCode = html5QrCodeRef.current;
    
    const qrCodeSuccessCallback = async (decodedText: string, decodedResult: any) => {
        if(processingRef.current) return;
        
        processingRef.current = true;
        setScanResult(decodedText);
        
        // Play sound immediately for instant feedback
        audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
        
        try {
            const studentId = decodedText;
            if (studentId) {
                await markAttendance(studentId);
            } else {
                toast({ variant: 'destructive', title: 'Invalid QR Code', description: 'The QR code appears to be empty.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Scan Error', description: 'Could not process the QR code.' });
        } finally {
            // No need to pause/resume, just be ready for the next scan after processing
            setScanResult(null);
            processingRef.current = false;
        }
    };
    
    const config = { fps: 10, qrbox: { width: QR_BOX_SIZE, height: QR_BOX_SIZE } };

    Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
            html5QrCode.start(
                { facingMode: "environment" },
                config,
                qrCodeSuccessCallback,
                undefined
            ).catch(err => {
                console.error("Failed to start QR scanner with back camera, trying default.", err);
                html5QrCode.start(
                    cameras[0].id,
                    config,
                    qrCodeSuccessCallback,
                    undefined
                ).catch(err_front => {
                  toast({ variant: "destructive", title: "Camera Error", description: "Could not start the camera. Please check permissions."})
                  console.error("Failed to start QR scanner with any camera.", err_front)
                });
            });
        }
    }).catch(err => {
      toast({ variant: "destructive", title: "Camera Error", description: "Could not find any cameras on this device."})
      console.error("Failed to get cameras.", err)
    });

    return () => {
        if (html5QrCodeRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
            html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop QR scanner.", err));
        }
    };
  }, [user, toast, firestore]);

  const markAttendance = async (studentId: string): Promise<void> => {
    if (!user) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    try {
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
                 toast({ variant: 'default', title: 'Already Present', description: 'This student has already been marked present today.' });
            } else {
                 await setDoc(existingDoc.ref, { status: 'present', timestamp: Timestamp.now() }, { merge: true });
                 toast({ title: 'Status Updated', description: 'Student status updated to present.' });
            }
            return;
        }
        
        const studentsCollection = collection(firestore, `teachers/${user.uid}/students`);
        const studentQuery = query(studentsCollection, where('studentId', '==', studentId));
        const studentSnapshot = await getDocs(studentQuery);
        if(studentSnapshot.empty) {
            toast({ variant: 'destructive', title: 'Student not found', description: 'This student is not in your roster.' });
            return;
        }
        const studentName = studentSnapshot.docs[0].data().name;

        // Use non-blocking write
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
        toast({ variant: 'destructive', title: 'Error', description: 'Could not mark attendance. Please try again.' });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4 relative">
        <div id="qr-scanner" ref={scannerRef} className="w-full rounded-md overflow-hidden aspect-square bg-muted"></div>
         {scanResult && (
          <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center pointer-events-none">
            <p className="text-white text-lg font-bold bg-black/50 px-4 py-2 rounded-lg">
              Scanned: {scanResult}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
