import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode } from 'lucide-react';

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md border-none bg-transparent shadow-none">
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
    </Card>
  );
}
