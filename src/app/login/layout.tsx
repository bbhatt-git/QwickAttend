import Footer from '@/components/common/footer';
import { ThemeToggle } from '@/components/theme-toggle';
import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <main className="flex w-full flex-1 flex-col items-center justify-center">
        {children}
      </main>
      <Footer />
    </div>
  );
}
