
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/header';
import MainSidebar from '@/components/dashboard/main-sidebar';
import { Loader2 } from 'lucide-react';
import { Suspense, useEffect } from 'react';
import { StudentProvider } from '@/context/student-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <StudentProvider>
      <div className="min-h-screen w-full">
        <MainSidebar />
        <div className="flex flex-col md:ml-[220px] lg:ml-[280px] h-screen">
          <Header />
          <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 lg:gap-6 lg:p-6 overflow-auto">
            <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </StudentProvider>
  );
}
