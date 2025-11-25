"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { useUser, useFirestore, useFirebaseApp, setDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

import { collection, doc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { SECTIONS } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PlusCircle } from 'lucide-react';

const studentFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  class: z.string().min(1, 'Class is required.'),
  section: z.enum(SECTIONS, { required_error: 'Please select a section.' }),
});

export function AddStudentDialog({ onStudentAdded }: { onStudentAdded?: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const storage = getStorage(app);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: '',
      class: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof studentFormSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const studentId = uuidv4().slice(0, 8);
      const qrData = JSON.stringify({ student_id: studentId, teacher_id: user.uid });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
      });

      const storageRef = ref(storage, `qrcodes/${user.uid}/${studentId}.png`);
      await uploadString(storageRef, qrCodeDataUrl, 'data_url');
      const qrCodeUrl = await getDownloadURL(storageRef);

      const studentsCollection = collection(firestore, `teachers/${user.uid}/students`);
      const studentDocRef = doc(studentsCollection);
      
      setDocumentNonBlocking(studentDocRef, {
        ...values,
        studentId,
        qrCodeUrl,
        teacherId: user.uid,
      }, { merge: false });

      toast({ title: 'Success', description: `${values.name} has been added.` });
      form.reset();
      setOpen(false);
      onStudentAdded?.();
    } catch (error) {
      console.error("Error adding student: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add student. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new student to your roster.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Grade 10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a section" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SECTIONS.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Student
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
