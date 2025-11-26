'use client';

import { useState } from 'react';
import { QrScanner } from '@/components/scan/qr-scanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Camera, ScanLine } from 'lucide-react';

export default function ScanPage() {
  const [isScanning, setIsScanning] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan QR Code</h1>
        <p className="text-muted-foreground">
          Point your camera at a student's QR code to mark them as present.
        </p>
      </div>
      
      <Alert>
        <Camera className="h-4 w-4" />
        <AlertTitle>Camera and Audio Access</AlertTitle>
        <AlertDescription>
          This feature requires access to your camera. Please grant permission when prompted. Audio will play to confirm scan status.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center">
        {isScanning ? (
          <QrScanner />
        ) : (
          <div className="flex flex-col items-center justify-center w-full max-w-md h-[400px] bg-muted rounded-lg border-2 border-dashed">
            <ScanLine className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Ready to Scan</h2>
            <p className="text-muted-foreground mb-6">Click the button below to start the camera.</p>
            <Button size="lg" onClick={() => setIsScanning(true)}>
              <Camera className="mr-2 h-5 w-5" />
              Start Scanning
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
