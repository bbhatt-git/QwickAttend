
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { Holiday } from '@/lib/types';
import NepaliDate from 'nepali-date-converter';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, PlusCircle, Trash2, Loader2, CalendarOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const holidayFormSchema = z.object({
  name: z.string().min(2, 'Holiday name must be at least 2 characters.'),
  date: z.date({
    required_error: 'A date is required.',
  }),
});

export default function HolidaysPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const holidaysQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `teachers/${user.uid}/holidays`), orderBy('date', 'desc'));
  }, [user, firestore, refetchTrigger]);

  const { data: holidays, isLoading } = useCollection<Holiday>(holidaysQuery);

  const form = useForm<z.infer<typeof holidayFormSchema>>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof holidayFormSchema>) => {
    if (!user) return;
    try {
      await addDoc(collection(firestore, `teachers/${user.uid}/holidays`), {
        teacherId: user.uid,
        name: values.name,
        date: format(values.date, 'yyyy-MM-dd'),
      });
      toast({ title: 'Success', description: 'Holiday has been added.' });
      form.reset({name: '', date: undefined});
      setRefetchTrigger(t => t + 1);
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add holiday.' });
    }
  };

  const deleteHoliday = async (holidayId: string) => {
    if (!user) return;
    try {
        await deleteDoc(doc(firestore, `teachers/${user.uid}/holidays`, holidayId));
        toast({ title: 'Success', description: 'Holiday has been removed.' });
        setRefetchTrigger(t => t + 1);
    } catch (error) {
         console.error('Error deleting holiday:', error);
         toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete holiday.' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Holidays</h1>
        <p className="text-muted-foreground">
          Add or remove holidays for your school. These days will not count towards absence.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Holiday</CardTitle>
            <CardDescription>Select a date and give the holiday a name.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Holiday Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Winter Break" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date('2000-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Add Holiday
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Holidays</CardTitle>
            <CardDescription>A list of all scheduled holidays.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              ) : holidays && holidays.length > 0 ? (
                holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{holiday.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new NepaliDate(new Date(holiday.date.replace(/-/g, '/'))).format('dddd, DD MMMM, YYYY')}
                      </p>
                    </div>
                    <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the "{holiday.name}" holiday. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteHoliday(holiday.id)} className='bg-destructive hover:bg-destructive/90'>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                       </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                    <CalendarOff className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-semibold">No holidays scheduled</p>
                    <p className='text-sm text-muted-foreground'>Add a holiday using the form on the left.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
