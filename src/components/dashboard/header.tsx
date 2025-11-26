"use client";

import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  PanelLeft,
  LayoutDashboard,
  Users,
  QrCode,
  CalendarClock,
  School,
  AppWindow,
} from 'lucide-react';
import { UserNav } from './user-nav';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/students', icon: Users, label: 'Students' },
  { href: '/dashboard/scan', icon: QrCode, label: 'Scan QR' },
  { href: '/dashboard/records', icon: CalendarClock, label: 'Records' },
  { href: '/dashboard/generate-qr', icon: AppWindow, label: 'Generate QR' },
];

export default function Header() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/60 px-4 backdrop-blur-xl sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="glass-sheet sm:max-w-xs">
          <SheetHeader>
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">Main navigation links for the dashboard.</SheetDescription>
          </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium mt-4">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
               onClick={() => setIsSheetOpen(false)}
            >
              <School className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">QwickAttend</span>
            </Link>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-2.5 ${
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsSheetOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="relative ml-auto flex items-center gap-2 md:grow-0">
         <ThemeToggle />
         <UserNav />
      </div>
    </header>
  );
}
