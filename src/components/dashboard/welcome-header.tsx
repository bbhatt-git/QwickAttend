
'use client';

import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function WelcomeHeader() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
    );
  }

  return (
    <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.displayName || 'Teacher'}!</h1>
        <p className="text-muted-foreground">
        Here's a quick overview of today's attendance.
        </p>
    </div>
  );
}
