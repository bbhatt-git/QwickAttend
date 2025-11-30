
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md glass-card">
      <CardHeader className="items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <QrCode className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
          Welcome to QwickAttend
        </CardTitle>
        <CardDescription>
          Sign in to manage your student attendance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className='flex justify-center text-sm'>
        <p className='text-muted-foreground'>Don&apos;t have an account? <Link href="/register" className='text-primary hover:underline'>Sign up</Link></p>
      </CardFooter>
    </Card>
  );
}
