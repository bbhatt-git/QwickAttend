
'use client';

import { UsbScanner } from '@/components/scan/usb-scanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Usb } from 'lucide-react';

export default function UsbScanPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">External USB Scanner</h1>
        <p className="text-muted-foreground">
          Use a USB-connected NFC or QR code scanner to take attendance.
        </p>
      </div>
      
      <Alert>
        <Usb className="h-4 w-4" />
        <AlertTitle>External Scanner Required</AlertTitle>
        <AlertDescription>
          This feature requires a USB-connected scanner (NFC or QR) configured in "Keyboard Emulation" or "Keyboard Wedge" mode. Click the area below to begin scanning.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center">
        <UsbScanner />
      </div>
    </div>
  );
}
