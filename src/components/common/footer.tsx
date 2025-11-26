import { Lightbulb, Heart, Globe, Facebook, Github, Instagram } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t py-6">
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 font-medium">
            <Lightbulb className="h-4 w-4" />
            <span>An idea by Bhupesh Raj Bhatt & Sanjay Thapa</span>
          </div>
          <div className="flex items-center gap-1.5">
            Made with <Heart className="h-4 w-4 text-red-500 fill-current" /> by Bhupesh Raj Bhatt
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="https://bbhatt.com.np" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
            <Globe className="h-5 w-5" />
            <span className="sr-only">Website</span>
          </Link>
          <Link href="https://www.facebook.com/share/1BnJr4X2Ec/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
            <Facebook className="h-5 w-5" />
            <span className="sr-only">Facebook</span>
          </Link>
          <Link href="https://github.com/bbhatt-git" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </Link>
          <Link href="https://www.instagram.com/_bbhatt?igsh=MWdjZnc3Y2t6bXp1bA==" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
            <Instagram className="h-5 w-5" />
            <span className="sr-only">Instagram</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
