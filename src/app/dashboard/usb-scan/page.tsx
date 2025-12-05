
'use client';

import { UsbScanner } from '@/components/scan/usb-scanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Usb } from 'lucide-react';

export default function UsbScanPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan with USB Reader</h1>
        <p className="text-muted-foreground">
          Use a USB QR or NFC scanner in keyboard mode to take attendance.
        </p>
      </div>
      
      <Alert>
        <Usb className="h-4 w-4" />
        <AlertTitle>USB Scanner Required</AlertTitle>
        <AlertDescription>
          This feature requires a USB-connected scanner configured in "Keyboard Emulation" or "Keyboard Wedge" mode. Click on the area below to begin scanning.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center">
        <UsbScanner />
      </div>
    </div>
  );
}
