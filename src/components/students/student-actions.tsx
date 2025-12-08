
"use client";

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, QrCode } from 'lucide-react';
import Image from 'next/image';
import type { Student } from '@/lib/types';

export function StudentActions({ student, onActionComplete }: { student: Student; onActionComplete: () => void; }) {
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  
  const qrSrc = student.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?data=${student.studentId}&size=256x256`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-haspopup="true" size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setIsQrDialogOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" /> View QR Code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* QR Code Viewer Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for {student.name}</DialogTitle>
            <DialogDescription>
              Student ID: {student.studentId}. Scan this to mark attendance.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <Image
              src={qrSrc}
              alt={`QR Code for ${student.name}`}
              width={256}
              height={256}
              className="rounded-lg border"
              unoptimized // Recommended for dynamically generated external images
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
