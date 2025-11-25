"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, Timestamp, setDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

const QR_BOX_SIZE = 300;

export function QrScanner() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    if (!scannerRef.current || html5QrCodeRef.current || !user) return;
    
    html5QrCodeRef.current = new Html5Qrcode(scannerRef.current.id);
    const html5QrCode = html5QrCodeRef.current;
    
    const qrCodeSuccessCallback = async (decodedText: string, decodedResult: any) => {
        if(html5QrCode.getState() !== Html5QrcodeScannerState.SCANNING) return;
        
        html5QrCode.pause();
        setScanResult(decodedText);
        
        try {
            const data = JSON.parse(decodedText);
            if (data.student_id && data.teacher_id) {
                if (data.teacher_id !== user?.uid) {
                    toast({ variant: 'destructive', title: 'Invalid QR Code', description: 'This student does not belong to your class.' });
                    return;
                }
                await markAttendance(data.student_id);
            } else {
                toast({ variant: 'destructive', title: 'Invalid QR Code', description: 'The QR code format is incorrect.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Invalid QR Code', description: 'This does not appear to be a valid QwickAttend code.' });
        } finally {
            setTimeout(() => {
                setScanResult(null);
                if (html5QrCode.getState() === Html5QrcodeScannerState.PAUSED) {
                    html5QrCode.resume();
                }
            }, 2000);
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
                console.error("Failed to start QR scanner with back camera, trying front.", err);
                html5QrCode.start(
                    cameras[0].id,
                    config,
                    qrCodeSuccessCallback,
                    undefined
                ).catch(err_front => console.error("Failed to start QR scanner with any camera.", err_front));
            });
        }
    }).catch(err => console.error("Failed to get cameras.", err));

    return () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop QR scanner.", err));
        }
    };
  }, [user, toast, firestore]);

  const markAttendance = async (studentId: string) => {
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
            toast({ variant: 'default', title: 'Already Present', description: 'This student has already been marked present today.' });
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

        const attendanceDocRef = doc(attendanceCollection);
        addDocumentNonBlocking(attendanceCollection, {
            studentId,
            teacherId: user.uid,
            date: todayStr,
            timestamp: Timestamp.now(),
        });
        toast({ title: 'Success', description: `${studentName} marked as present.` });
    } catch (error) {
        console.error("Error marking attendance:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not mark attendance. Please try again.' });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div id="qr-scanner" ref={scannerRef} className="w-full rounded-md overflow-hidden aspect-square bg-muted"></div>
      </CardContent>
    </Card>
  );
}
