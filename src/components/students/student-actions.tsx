
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
import { MoreHorizontal, QrCode, Info, User, Hash, Book, Users, Phone } from 'lucide-react';
import Image from 'next/image';
import type { Student } from '@/lib/types';
import { Badge } from '../ui/badge';

export function StudentActions({ student, onActionComplete }: { student: Student; onActionComplete: () => void; }) {
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  
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
          <DropdownMenuItem onSelect={() => setIsInfoDialogOpen(true)}>
            <Info className="mr-2 h-4 w-4" /> View Info
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsQrDialogOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" /> View QR Code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Student Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Student Information</DialogTitle>
            <DialogDescription>
              Details for {student.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{student.name}</p>
                </div>
            </div>
             <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Hash className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium">{student.studentId}</p>
                </div>
            </div>
             <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Book className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">{student.class}</p>
                </div>
            </div>
             <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Section</p>
                    <Badge variant="secondary">{student.section}</Badge>
                </div>
            </div>
             <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Phone className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{student.contact || 'N/A'}</p>
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              unoptimized
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
