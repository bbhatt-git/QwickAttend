
import Header from '@/components/dashboard/header';
import MainSidebar from '@/components/dashboard/main-sidebar';
import { Loader2, Facebook, Github, Instagram } from 'lucide-react';
import Link from 'next/link';
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
        <footer className="flex flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
            <p>Made with ♥ by Bhupesh Raj Bhatt</p>
            <a href="mailto:hello@bbhatt.com.np" className="hover:text-primary transition-colors">
              hello@bbhatt.com.np
            </a>
            <div className="mt-2 flex items-center gap-4">
              <Link href="https://www.facebook.com/bhupesh.bhatt.35" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="https://github.com/bhupeshbhatt" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="https://www.instagram.com/bhupeshbhatt_" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </footer>
      </div>
    </div>
  );
}
