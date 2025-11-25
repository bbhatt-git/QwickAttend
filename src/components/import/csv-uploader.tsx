

"use client";

import { useState } from 'react';
import Papa from 'papaparse';
import { useUser, useFirestore, useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { SECTIONS } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const sectionSet = new Set(SECTIONS);

export default function CsvUploader() {
  const { user } = useUser();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const storage = getStorage(app);

  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setResults(null);
      setProgress(0);
    }
  };

  const processImport = async () => {
    if (!file || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'File or user not available.' });
      return;
    }

    setIsProcessing(true);
    setResults(null);
    setProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data as any[];
        let successCount = 0;
        let failedCount = 0;
        const errorMessages: string[] = [];
        const totalRows = rows.length;

        const batch = writeBatch(firestore);
        const studentsCollectionRef = collection(firestore, `teachers/${user.uid}/students`);

        for (let i = 0; i < totalRows; i++) {
          const row = rows[i];
          const { name, class: className, section } = row;

          if (!name || !className || !section) {
            failedCount++;
            errorMessages.push(`Row ${i + 2}: Missing required fields (name, class, section).`);
            continue;
          }

          if (!sectionSet.has(section)) {
            failedCount++;
            errorMessages.push(`Row ${i + 2}: Invalid section "${section}".`);
            continue;
          }

          try {
            const studentId = uuidv4().slice(0, 8);
            const qrData = JSON.stringify({ student_id: studentId, teacher_id: user.uid });
            const qrCodeDataUrl = await QRCode.toDataURL(qrData);

            const storageRef = ref(storage, `qrcodes/${user.uid}/${studentId}.png`);
            await uploadString(storageRef, qrCodeDataUrl, 'data_url');
            const qrCodeUrl = await getDownloadURL(storageRef);

            const studentDocRef = doc(studentsCollectionRef);
            batch.set(studentDocRef, {
              id: studentDocRef.id,
              name,
              class: className,
              section,
              studentId,
              qrCodeUrl,
              teacherId: user.uid,
            });

            successCount++;
          } catch (error) {
            failedCount++;
            errorMessages.push(`Row ${i + 2}: Failed to process due to an unexpected error.`);
            console.error(error);
          }

          setProgress(((i + 1) / totalRows) * 100);
        }
        
        try {
            await batch.commit();
        } catch (error: any) {
            failedCount += successCount;
            successCount = 0;
            errorMessages.push(`Failed to save data: ${error.message}. This might be a permission issue with Firestore rules.`);
            console.error('Batch commit failed', error);
        }

        setResults({ success: successCount, failed: failedCount, errors: errorMessages });
        setIsProcessing(false);
        toast({ title: 'Import Complete', description: `${successCount} students imported, ${failedCount} failed.` });
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input type="file" accept=".csv" onChange={handleFileChange} className="max-w-xs" disabled={isProcessing}/>
        <Button onClick={processImport} disabled={!file || isProcessing}>
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Import Students
        </Button>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <p>Processing... {Math.round(progress)}%</p>
          <Progress value={progress} />
        </div>
      )}
      
      {results && (
         <div className="space-y-4">
            <Alert variant={results.failed > 0 ? "destructive" : "default"}>
                {results.failed > 0 ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <AlertTitle>Import Summary</AlertTitle>
                <AlertDescription>
                    <p>Successfully imported: {results.success}</p>
                    <p>Failed to import: {results.failed}</p>
                </AlertDescription>
            </Alert>
            {results.errors.length > 0 && (
                <Alert variant="destructive">
                    <AlertTitle>Error Details</AlertTitle>
                    <AlertDescription className="max-h-40 overflow-y-auto">
                        <ul className="list-disc pl-5">
                            {results.errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                        {results.errors.length > 10 && <p className="mt-2">...and {results.errors.length - 10} more errors.</p>}
                    </AlertDescription>
                </Alert>
            )}
        </div>
      )}
    </div>
  );
}
