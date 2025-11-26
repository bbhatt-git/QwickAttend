import Footer from '@/components/common/footer';
import { ThemeToggle } from '@/components/theme-toggle';
import React from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const bgImage = PlaceHolderImages.find(img => img.id === 'login-bg');

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          className="object-cover -z-10"
          data-ai-hint={bgImage.imageHint}
          priority
        />
      )}
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
