
import { LoginForm } from '@/components/auth/login-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  return (
    <>
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-balance text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>
      <LoginForm />
      <Alert className="mt-6 text-left border-none bg-muted/50">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Admin Notice</AlertTitle>
        <AlertDescription>
          To prevent unauthorized access, new user accounts must now be created by an administrator directly in the Firebase console.
        </AlertDescription>
      </Alert>
    </>
  );
}
