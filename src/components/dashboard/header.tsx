"use client";

import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  PanelLeft,
  LayoutDashboard,
  Users,
  FileUp,
  QrCode,
  CalendarClock,
  School,
  AppWindow,
} from 'lucide-react';
import { UserNav } from './user-nav';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/students', icon: Users, label: 'Students' },
  { href: '/dashboard/import', icon: FileUp, label: 'Import' },
  { href: '/dashboard/scan', icon: QrCode, label: 'Scan QR' },
  { href: '/dashboard/records', icon: CalendarClock, label: 'Records' },
  { href: '/dashboard/generate-qr', icon: AppWindow, label: 'Generate QR' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SheetHeader>
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">Main navigation links for the dashboard.</SheetDescription>
          </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium mt-4">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
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
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Breadcrumbs or search can go here */}
      </div>
      <UserNav />
    </header>
  );
}
