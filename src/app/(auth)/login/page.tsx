import { LoginForm } from '@/components/auth/login-form';
import { School } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <School className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome to QwickAttend
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to manage your student attendance.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
