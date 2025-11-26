'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';

export default function GenerateQrPage() {
  const [studentId, setStudentId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const handleGenerate = () => {
    if (studentId.trim()) {
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(studentId.trim())}&size=256x256`);
    } else {
      setQrCodeUrl('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate QR Code</h1>
        <p className="text-muted-foreground">
          Create a QR code for any Student ID.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QR Code Generator</CardTitle>
          <CardDescription>
            Enter a Student ID below to generate a unique QR code. You can then save the image and upload it to a service like Google Drive to link it to a student.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
            <Button onClick={handleGenerate}>
              <QrCode className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>

          {qrCodeUrl && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted p-6">
               <Image
                src={qrCodeUrl}
                alt={`QR Code for ${studentId}`}
                width={256}
                height={256}
                className="rounded-lg border-4 border-white shadow-lg"
              />
              <p className="text-sm text-muted-foreground">
                Right-click or long-press the image to save it.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
