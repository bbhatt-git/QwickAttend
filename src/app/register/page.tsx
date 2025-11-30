
import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <>
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="text-balance text-muted-foreground">
          Enter your details below to get started.
        </p>
      </div>
      <RegisterForm />
       <div className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </div>
    </>
  );
}
