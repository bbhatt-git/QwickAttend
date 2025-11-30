
import { Globe, Facebook, Github, Instagram, Copyright } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t py-4">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-1.5">
          <Copyright className="h-4 w-4" /> {new Date().getFullYear()}{' '}
          <Link href="https://github.com/bbhatt-git" target="_blank" rel="noopener noreferrer" className="font-medium transition-colors hover:text-primary">
            Bhupesh Raj Bhatt
          </Link>
          . All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <Link href="https://bbhatt.com.np" target="_blank" rel="noopener noreferrer" aria-label="Website" className="transition-colors hover:text-primary">
            <Globe className="h-5 w-5" />
          </Link>
          <Link href="https://www.facebook.com/share/1BnJr4X2Ec/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-colors hover:text-primary">
            <Facebook className="h-5 w-5" />
          </Link>
          <Link href="https://github.com/bbhatt-git" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="transition-colors hover:text-primary">
            <Github className="h-5 w-5" />
          </Link>
          <Link href="https://www.instagram.com/_bbhatt?igsh=MWdjZnc3Y2t6bXp1bA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-colors hover:text-primary">
            <Instagram className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
