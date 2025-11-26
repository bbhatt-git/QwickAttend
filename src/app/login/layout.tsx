import Footer from '@/components/common/footer';
import { ThemeToggle } from '@/components/theme-toggle';
import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <main className="flex w-full flex-1 flex-col items-center justify-center p-4">
        {children}
      </main>
      <Footer />
    </div>
  );
}
