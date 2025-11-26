import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { QrCode } from 'lucide-react';

export default function LoginPage() {
  return (
    <Card className="glass-card w-full max-w-md animate-fade-in-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
      <CardHeader className="items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground animate-fade-in-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
          <QrCode className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground animate-fade-in-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
          Welcome to QwickAttend
        </h1>
        <p className="text-muted-foreground animate-fade-in-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
          Sign in to manage your student attendance.
        </p>
      </CardHeader>
      <CardContent className="animate-fade-in-slide-up" style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}>
        <Card className="border-none bg-transparent shadow-none">
          <CardContent className="p-0">
            <LoginForm />
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
