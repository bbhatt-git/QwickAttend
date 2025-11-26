
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, QrCode, Edit, Trash2, Loader2, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import type { Student } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';

// NOTE: Edit functionality is not implemented in this component as it's a larger feature.
// A similar dialog to AddStudentDialog would be created for editing.

export function StudentActions({ student }: { student: Student }) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isLinkQrDialogOpen, setIsLinkQrDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [qrLink, setQrLink] = useState(student.qrCodeUrl || '');
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const storage = getStorage(app);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const studentDocRef = doc(firestore, `teachers/${student.teacherId}/students`, student.id);
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
    } catch (error) {
      console.error("Error deleting student: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete student. Please try again.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLinkQr = async () => {
    setIsLinking(true);
    try {
      const studentDocRef = doc(firestore, `teachers/${student.teacherId}/students`, student.id);
      await updateDoc(studentDocRef, { qrCodeUrl: qrLink });
      toast({ title: 'Success', description: 'QR Code URL has been updated.' });
      setIsLinkQrDialogOpen(false);
    } catch (error) {
      console.error("Error linking QR code: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to link QR code. Please try again.' });
    } finally {
      setIsLinking(false);
    }
  };

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
          <DropdownMenuItem onSelect={() => setIsQrDialogOpen(true)} disabled={!student.qrCodeUrl}>
            <QrCode className="mr-2 h-4 w-4" /> View QR Code
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsLinkQrDialogOpen(true)}>
            <LinkIcon className="mr-2 h-4 w-4" /> Link QR Code
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => alert('Edit functionality to be implemented.')}>
            <Edit className="mr-2 h-4 w-4" /> Edit
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
            {student.qrCodeUrl ? (
              <Image
                src={student.qrCodeUrl}
                alt={`QR Code for ${student.name}`}
                width={256}
                height={256}
                className="rounded-lg border"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                <Skeleton className="h-64 w-64 rounded-lg" />
                <p>QR Code not available. Please link one.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Link QR Code Dialog */}
      <Dialog open={isLinkQrDialogOpen} onOpenChange={setIsLinkQrDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate and Link QR Code</DialogTitle>
            <DialogDescription>
              Save the QR code below, upload it to a service like Google Drive, and paste the public link to associate it with {student.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 p-4">
            <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${student.studentId}&size=256x256`}
                alt={`QR Code for ${student.studentId}`}
                width={256}
                height={256}
                className="rounded-lg border"
              />
              <div className="w-full space-y-2">
                <label htmlFor="qr-link" className="text-sm font-medium">QR Code Link</label>
                <Input
                  id="qr-link"
                  placeholder="https://drive.google.com/..."
                  value={qrLink}
                  onChange={(e) => setQrLink(e.target.value)}
                />
              </div>
          </div>
           <DialogFooter>
            <Button onClick={handleLinkQr} disabled={isLinking}>
              {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Link
            </Button>
          </DialogFooter>
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
