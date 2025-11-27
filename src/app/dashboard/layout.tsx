
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/header';
import MainSidebar from '@/components/dashboard/main-sidebar';
import { Loader2 } from 'lucide-react';
import { Suspense, useEffect } from 'react';
import Footer from '@/components/common/footer';

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
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <MainSidebar />
      <div className="flex flex-1 flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            {children}
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  );
}
