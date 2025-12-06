'use client';

import { useState, useEffect } from 'react';
import { NfcScanner } from '@/components/scan/nfc-scanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Nfc, ScanLine } from 'lucide-react';

export default function NfcPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [isNfcSupported, setIsNfcSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if ('NDEFReader' in window) {
      setIsNfcSupported(true);
    } else {
      setIsNfcSupported(false);
    }
  }, []);

  const startScan = () => {
    if (isNfcSupported) {
        setIsScanning(true);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan NFC (In-built)</h1>
        <p className="text-muted-foreground">
          Use your device's built-in NFC reader to mark a student as present.
        </p>
      </div>
      
      <Alert variant={isNfcSupported === false ? "destructive" : "default"}>
        <Nfc className="h-4 w-4" />
        <AlertTitle>
            {isNfcSupported === null && "Checking NFC Support..."}
            {isNfcSupported === true && "NFC Ready"}
            {isNfcSupported === false && "NFC Not Supported"}
        </AlertTitle>
        <AlertDescription>
           {isNfcSupported === true && "This feature requires granting permission to use your device's built-in NFC reader."}
           {isNfcSupported === false && "Your browser or device does not support Web NFC. This feature is currently available on Chrome for Android."}
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center">
        {isScanning ? (
          <NfcScanner />
        ) : (
          <div className="flex flex-col items-center justify-center w-full max-w-md h-[400px] bg-muted rounded-lg border-2 border-dashed">
            <ScanLine className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Ready to Scan</h2>
            <p className="text-muted-foreground mb-6 text-center px-4">Click the button below to start scanning for NFC tags.</p>
            <Button size="lg" onClick={startScan} disabled={!isNfcSupported}>
              <Nfc className="mr-2 h-5 w-5" />
              Start Scanning
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
