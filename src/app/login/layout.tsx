
'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import React from 'react';
import { Fingerprint } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:flex lg:items-center lg:justify-center lg:flex-col p-8">
         <div className="flex items-center gap-4 text-primary mb-4">
          <Fingerprint className="h-10 w-10" />
          <h1 className="text-4xl font-bold">QwickAttend</h1>
        </div>
        <p className="text-center text-muted-foreground max-w-sm">
          The seamless attendance tracking solution for modern educators. Sign in to get started.
        </p>
      </div>
       <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
    </div>
  );
}
