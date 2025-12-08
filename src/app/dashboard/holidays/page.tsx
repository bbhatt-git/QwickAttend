
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, deleteDoc, doc, writeBatch, where, getDocs } from 'firebase/firestore';
import { format, eachDayOfInterval } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { Holiday } from '@/lib/types';
import NepaliDate from 'nepali-date-converter';
import { v4 as uuidv4 } from 'uuid';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NepaliCalendar, type DateRange } from '@/components/ui/nepali-calendar';
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
import { ScrollArea } from '@/components/ui/scroll-area';

const holidayFormSchema = z.object({
  name: z.string().min(2, 'Holiday name must be at least 2 characters.'),
  dateRange: z.custom<DateRange>(val => val && val.from, {
    message: 'A date or date range is required.',
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
    const { from, to } = values.dateRange;
    const startDate = from.toJsDate();
    // If 'to' is not provided (single date selection), use 'from' as the end date
    const endDate = (to || from).toJsDate();
    
    try {
      const batch = writeBatch(firestore);
      const holidaysCollection = collection(firestore, `teachers/${user.uid}/holidays`);
      
      const interval = eachDayOfInterval({ start: startDate, end: endDate });
      
      // If there is more than one day, create a rangeId
      const rangeId = interval.length > 1 ? uuidv4() : undefined;

      interval.forEach(day => {
          const newDocRef = doc(holidaysCollection);
          const holidayData: any = {
              teacherId: user.uid,
              name: values.name,
              date: format(day, 'yyyy-MM-dd'),
          };
          if(rangeId) {
            holidayData.rangeId = rangeId;
          }
          batch.set(newDocRef, holidayData);
      });
      

      await batch.commit();

      toast({ title: 'Success', description: 'Holiday(s) have been added.' });
      form.reset({name: '', dateRange: undefined});
      setRefetchTrigger(t => t + 1);
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add holiday.' });
    }
  };

  const deleteHoliday = async (holiday: Holiday) => {
    if (!user) return;
    try {
        if (holiday.rangeId) {
            const batch = writeBatch(firestore);
            const q = query(collection(firestore, `teachers/${user.uid}/holidays`), where("rangeId", "==", holiday.rangeId));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } else {
            await deleteDoc(doc(firestore, `teachers/${user.uid}/holidays`, holiday.id));
        }
        toast({ title: 'Success', description: 'Holiday(s) have been removed.' });
        setRefetchTrigger(t => t + 1);
    } catch (error) {
         console.error('Error deleting holiday:', error);
         toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete holiday.' });
    }
  };

  const processedHolidays = useMemo(() => {
    if (!holidays) return [];
    
    const holidayMap = new Map<string, Holiday[]>();
    const singleHolidays: Holiday[] = [];

    holidays.forEach(h => {
        if (h.rangeId) {
            if (!holidayMap.has(h.rangeId)) {
                holidayMap.set(h.rangeId, []);
            }
            holidayMap.get(h.rangeId)!.push(h);
        } else {
            singleHolidays.push(h);
        }
    });

    const displayList: any[] = [];

    singleHolidays.forEach(h => {
        displayList.push({ ...h, isRange: false });
    });

    holidayMap.forEach((rangeHolidays) => {
        if (rangeHolidays.length > 0) {
            rangeHolidays.sort((a, b) => a.date.localeCompare(b.date));
            const firstDay = rangeHolidays[0];
            const lastDay = rangeHolidays[rangeHolidays.length - 1];
            displayList.push({
                ...firstDay,
                isRange: true,
                startRange: firstDay.date,
                endRange: lastDay.date,
            });
        }
    });

    return displayList.sort((a,b) => b.date.localeCompare(a.date));
  }, [holidays]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Holidays</h1>
        <p className="text-muted-foreground">
          Add or remove single holidays or date ranges for your school.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Holiday(s)</CardTitle>
            <CardDescription>Select a date or a range of dates.</CardDescription>
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
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date or Date Range</FormLabel>
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
                              {field.value?.from ? (
                                field.value.to ? (
                                  (field.value.to as any).isSame(field.value.from, 'day') ? (
                                    `BS: ${field.value.from.format('DD, MMMM YYYY')}`
                                  ) : (
                                    `BS: ${field.value.from.format('DD, MMMM')} - ${field.value.to.format('DD, MMMM YYYY')}`
                                  )
                                ) : (
                                  `BS: ${field.value.from.format('DD, MMMM YYYY')}`
                                )
                              ) : (
                                <span>Pick a date or range</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <NepaliCalendar
                            mode="range"
                            value={field.value}
                            onSelect={(range) => {
                                field.onChange(range)
                            }}
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
                  Add Holiday(s)
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
              ) : processedHolidays && processedHolidays.length > 0 ? (
                <ScrollArea className='h-full'>
                {processedHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between rounded-md border p-3 mb-2"
                  >
                    <div>
                      <p className="font-medium">{holiday.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {holiday.isRange ? 
                          `${new NepaliDate(new Date(holiday.startRange!.replace(/-/g, '/'))).format('DD MMMM')} - ${new NepaliDate(new Date(holiday.endRange!.replace(/-/g, '/'))).format('DD MMMM, YYYY')}` :
                          new NepaliDate(new Date(holiday.date.replace(/-/g, '/'))).format('DD MMMM, YYYY')
                        }
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
                              <AlertDialogAction onClick={() => deleteHoliday(holiday)} className='bg-destructive hover:bg-destructive/90'>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                       </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
                </ScrollArea>
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
