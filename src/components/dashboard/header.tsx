
"use client";

import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Menu,
  Fingerprint
} from 'lucide-react';
import { UserNav } from './user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { navItems } from '@/lib/nav-items';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Footer from '../common/footer';


export default function Header() {
    const pathname = usePathname();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
       <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <SheetHeader className="p-6 pb-0 sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <div className="p-6">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-lg font-bold"
                >
                  <Fingerprint className="h-6 w-6" />
                  <span className='font-extrabold tracking-tight'>QwickAttend</span>
                </Link>
              </div>
              <nav className="grid gap-2 text-lg font-medium p-6 pt-0">
                {navItems.map((item) => {
                    const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                        <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground",
                            !isActive && "hover:text-foreground",
                            isActive && "bg-muted text-foreground"
                        )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    )
                })}
              </nav>
               <div className="mt-auto p-4">
                <Footer />
              </div>
            </SheetContent>
          </Sheet>
      <div className="w-full flex-1">
        {/* Can add breadcrumbs or search here if needed */}
      </div>
      <ThemeToggle />
      <UserNav />
    </header>
  );
}
