import { QrScanner } from "@/components/scan/qr-scanner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera } from "lucide-react";

export default function ScanPage() {
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
        <AlertTitle>Camera Access Required</AlertTitle>
        <AlertDescription>
          This feature requires access to your device's camera. Please grant permission when prompted by your browser.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center">
        <QrScanner />
      </div>
    </div>
  );
}
