import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { QrCode } from 'lucide-react';

export default function LoginPage() {
  return (
    <Card className="glass-card w-full max-w-md">
      <CardHeader className="items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <QrCode className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome to QwickAttend
        </h1>
        <p className="text-muted-foreground">
          Sign in to manage your student attendance.
        </p>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
