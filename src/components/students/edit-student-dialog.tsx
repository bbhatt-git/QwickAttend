
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import type { Student } from '@/lib/types';

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
import { Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const studentFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  class: z.string().min(1, 'Class is required.'),
  section: z.enum(SECTIONS, { required_error: 'Please select a section.' }),
});

type EditStudentDialogProps = {
  student: Student;
  onStudentUpdated?: () => void;
  children: React.ReactNode;
};

export function EditStudentDialog({ student, onStudentUpdated, children }: EditStudentDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: student.name,
      class: student.class,
      section: student.section,
    },
  });

  const onSubmit = async (values: z.infer<typeof studentFormSchema>) => {
    setIsSubmitting(true);
    if (!student.teacherId || !student.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Student data is incomplete. Cannot update.' });
        setIsSubmitting(false);
        return;
    }
    const studentDocRef = doc(firestore, `teachers/${student.teacherId}/students`, student.id);
    try {
      await updateDoc(studentDocRef, values);
      toast({ title: 'Success', description: 'Student record has been updated.' });
      onStudentUpdated?.();
      setOpen(false);
    } catch (error: any) {
      console.error("Error updating student: ", error);
      const permissionError = new FirestorePermissionError({
        path: studentDocRef.path,
        operation: 'update',
        requestResourceData: values,
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update student. Please check permissions and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      form.reset({
        name: student.name,
        class: student.class,
        section: student.section,
      });
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student Record</DialogTitle>
          <DialogDescription>
            Update the details for {student.name}. Click save when you're done.
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
                    <Input {...field} disabled={isSubmitting} />
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
                    <Input {...field} disabled={isSubmitting}/>
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
                  <Select onValuechange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
