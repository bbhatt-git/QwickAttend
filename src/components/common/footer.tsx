
import { Globe, Facebook, Github, Instagram, Copyright, Info } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';

export default function Footer() {
  const appVersion = process.env.npm_package_version || "1.0.0";
  return (
    <footer className="border-t pt-4">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-0 text-center text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-1.5">
          <Copyright className="h-4 w-4" /> {new Date().getFullYear()}{' '}
          <Link href="https://github.com/bbhatt-git" target="_blank" rel="noopener noreferrer" className="font-medium transition-colors hover:text-primary">
            Bhupesh Raj Bhatt
          </Link>
        </div>
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Info className='h-5 w-5' />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>About QwickAttend</DialogTitle>
                    <DialogDescription>
                        Version {appVersion}
                    </DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-2">
                    <p>This application is developed and maintained by Bhupesh Raj Bhatt. Connect with the developer:</p>
                     <div className="flex items-center justify-center gap-6 pt-4">
                        <Link href="https://bbhatt.com.np" target="_blank" rel="noopener noreferrer" aria-label="Website" className="transition-colors hover:text-primary">
                            <Globe className="h-6 w-6" />
                        </Link>
                        <Link href="https://www.facebook.com/share/1BnJr4X2Ec/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-colors hover:text-primary">
                            <Facebook className="h-6 w-6" />
                        </Link>
                        <Link href="https://github.com/bbhatt-git" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="transition-colors hover:text-primary">
                            <Github className="h-6 w-6" />
                        </Link>
                        <Link href="https://www.instagram.com/_bbhatt?igsh=MWdjZnc3Y2t6bXp1bA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-colors hover:text-primary">
                            <Instagram className="h-6 w-6" />
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </footer>
  );
}
