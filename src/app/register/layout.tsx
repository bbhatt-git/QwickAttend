
import { ThemeToggle } from '@/components/theme-toggle';
import React from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { UserPlus } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const bgImage = PlaceHolderImages.find(img => img.id === 'login-bg');

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:flex lg:items-center lg:justify-center lg:flex-col">
         <div className="flex items-center gap-4 text-primary mb-4">
          <UserPlus className="h-10 w-10" />
          <h1 className="text-4xl font-bold">Get Started</h1>
        </div>
        <p className="text-center text-muted-foreground">Create your account to start managing attendance effortlessly.</p>
        {bgImage && (
            <Image
              src={bgImage.imageUrl}
              alt={bgImage.description}
              width="1920"
              height="1080"
              className="w-full h-[calc(100vh-200px)] object-cover dark:brightness-[0.2] dark:grayscale mt-8 rounded-lg"
              data-ai-hint={bgImage.imageHint}
              priority
            />
        )}
      </div>
       <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
    </div>
  );
}
