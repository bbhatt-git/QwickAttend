
'use client';

import {
  LayoutDashboard,
  Users,
  QrCode,
  CalendarClock,
  Nfc,
  CalendarOff,
  Info,
} from 'lucide-react';

export const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/students', icon: Users, label: 'Students' },
  { href: '/dashboard/scan', icon: QrCode, label: 'Scan QR' },
  { href: '/dashboard/nfc', icon: Nfc, label: 'Scan NFC' },
  { href: '/dashboard/records', icon: CalendarClock, label: 'Records' },
  { href: '/dashboard/holidays', icon: CalendarOff, label: 'Holidays' },
  { href: '/dashboard/about', icon: Info, label: 'About' },
];
