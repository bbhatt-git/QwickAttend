
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Usb, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function NfcOptionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan with NFC</h1>
        <p className="text-muted-foreground">
          Choose how you want to scan student NFC tags for attendance.
        </p>
      </div>

      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertTitle>What is NFC?</AlertTitle>
        <AlertDescription>
          Near-Field Communication (NFC) allows for quick, contactless data exchange. You can use your device's built-in reader (on compatible phones) or an external USB scanner to take attendance.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Use In-Built NFC Reader</CardTitle>
            </div>
            <CardDescription className="pt-2">
              Use your Android phone or tablet's built-in NFC capability to scan tags. Best for mobile use.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
            <Link href="/dashboard/nfc/in-built" className="w-full">
              <Button className="w-full">
                Start In-Built Scan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Usb className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Use External NFC Reader</CardTitle>
            </div>
            <CardDescription className="pt-2">
              Use a USB-connected NFC scanner in keyboard mode. Ideal for a stationary attendance station with a laptop.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
            <Link href="/dashboard/nfc/external" className="w-full">
              <Button className="w-full">
                Start External Scan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
