
import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
         <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserPlus className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
          Create an Account
        </CardTitle>
        <CardDescription>
          Get started with QwickAttend to streamline your attendance process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
       <CardFooter className='flex justify-center text-sm'>
        <p className='text-muted-foreground'>Already have an account? <Link href="/login" className='text-primary hover:underline'>Sign in</Link></p>
      </CardFooter>
    </Card>
  );
}
