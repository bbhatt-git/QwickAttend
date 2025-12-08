import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import NepaliDate from 'nepali-date-converter';

// Extend NepaliDate prototype to include an isSame method for easy comparison
if (!(NepaliDate.prototype as any).isSame) {
  (NepaliDate.prototype as any).isSame = function(otherDate: NepaliDate, unit: 'day' | 'month' | 'year' = 'day'): boolean {
    if (!otherDate) return false;
    // This is a simplified check. A real implementation should handle month/year units.
    return this.getYear() === otherDate.getYear() &&
           this.getMonth() === otherDate.getMonth() &&
           this.getDate() === otherDate.getDate();
  };
}

export const metadata: Metadata = {
  title: 'QwickAttend',
  description: 'Track student attendance seamlessly with QR codes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
