
import { Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

export default function Footer() {
  return (
    <footer className="border-t pt-4 text-center">
      <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary">
          <Link href="/dashboard/about">
              <Info className="mr-2 h-4 w-4" />
              <span>About</span>
          </Link>
      </Button>
    </footer>
  );
}
