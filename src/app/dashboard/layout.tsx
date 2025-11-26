import Header from '@/components/dashboard/header';
import MainSidebar from '@/components/dashboard/main-sidebar';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <MainSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            {children}
          </Suspense>
        </main>
        <footer className="text-center p-4 text-muted-foreground text-sm">
          Developed by Bhupesh Raj Bhatt | Contact: 9761184935
        </footer>
      </div>
    </div>
  );
}
