
"use client";

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, QrCode, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import type { Student } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function StudentActions({ student, onActionComplete }: { student: Student; onActionComplete: () => void; }) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const storage = getStorage(app);

  const handleDelete = async () => {
    setIsDeleting(true);
    const studentDocRef = doc(firestore, `teachers/${student.teacherId}/students`, student.id);
    try {
      await deleteDoc(studentDocRef);

      if (student.qrCodeUrl && student.qrCodeUrl.includes('firebasestorage.googleapis.com')) {
        const qrCodeRef = ref(storage, `qrcodes/${student.teacherId}/${student.studentId}.png`);
        await deleteObject(qrCodeRef).catch((error) => {
          if (error.code !== 'storage/object-not-found') {
            throw error;
          }
        });
      }

      toast({ title: 'Success', description: `${student.name} has been deleted.` });
      setIsDeleteAlertOpen(false);
      onActionComplete();
    } catch (error) {
      console.error("Error deleting student: ", error);
      const permissionError = new FirestorePermissionError({
          path: studentDocRef.path,
          operation: 'delete',
        });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete student. Check permissions.' });
    } finally {
      setIsDeleting(false);
    }
  };
  
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsDeleteAlertOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
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
      
      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the record for {student.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
