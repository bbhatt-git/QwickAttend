
"use client";

import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Menu,
  School
} from 'lucide-react';
import { UserNav } from './user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { navItems } from '@/lib/nav-items';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';


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
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <School className="h-6 w-6" />
                  <span className="sr-only">QwickAttend</span>
                </Link>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                            isActive && "bg-muted text-foreground"
                        )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    )
                })}
              </nav>
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
