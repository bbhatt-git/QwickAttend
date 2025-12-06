
'use client';

import { UsbScanner } from '@/components/scan/usb-scanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Usb, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ExternalNfcPage() {
  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="outline" size="sm" className="mb-4">
            <Link href="/dashboard/nfc">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to NFC Options
            </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Scan with External NFC Reader</h1>
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
