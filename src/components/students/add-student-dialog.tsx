
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { collection, doc, setDoc } from 'firebase/firestore';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const studentFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  class: z.string().min(1, 'Class is required.'),
  section: z.enum(SECTIONS, { required_error: 'Please select a section.' }),
  contact: z.string().min(10, 'Please enter a valid contact number.').optional().or(z.literal('')),
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
      contact: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof studentFormSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setIsSubmitting(true);
    const studentDocRef = doc(collection(firestore, `teachers/${user.uid}/students`));

    try {
      const studentId = uuidv4().slice(0, 8).toUpperCase();
      
      const qrCodeDataUrl = await QRCode.toDataURL(studentId);
      const storageRef = ref(storage, `qrcodes/${user.uid}/${studentId}.png`);
      await uploadString(storageRef, qrCodeDataUrl, 'data_url');
      const qrCodeUrl = await getDownloadURL(storageRef);

      const newStudent = {
        id: studentDocRef.id,
        name: values.name,
        class: values.class,
        section: values.section,
        contact: values.contact || '',
        studentId,
        qrCodeUrl,
        teacherId: user.uid,
      };

      await setDoc(studentDocRef, newStudent);

      toast({ title: 'Success', description: `${values.name} has been added.` });
      onStudentAdded?.();
      form.reset({ name: '', class: '', section: undefined, contact: '' });
      setOpen(false);

    } catch (error: any) {
      console.error("Error adding student: ", error);
       const permissionError = new FirestorePermissionError({
        path: studentDocRef.path,
        operation: 'create',
        requestResourceData: values,
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add student. Please check permissions and try again.'
      });
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
                    <Input placeholder="John Doe" {...field} disabled={isSubmitting} />
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
                    <Input placeholder="e.g., Grade 10" {...field} disabled={isSubmitting}/>
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
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
             <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent's Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 98XXXXXXXX" {...field} disabled={isSubmitting} />
                  </FormControl>
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
