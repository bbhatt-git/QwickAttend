
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UserCheck
} from 'lucide-react';
import { navItems } from '@/lib/nav-items';
import { cn } from '@/lib/utils';
import Footer from '../common/footer';

export default function MainSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
              <UserCheck className="h-6 w-6" />
              <span className='font-extrabold tracking-tight'>QwickAttend</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all",
                            !isActive && "hover:text-primary hover:bg-muted",
                            isActive && "bg-muted text-primary"
                        )}
                        >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                )
              })}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Footer />
          </div>
        </div>
      </div>
  );
}
