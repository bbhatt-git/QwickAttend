import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, UserX, ArrowUpRight, PlusCircle } from 'lucide-react';
import DashboardStats from '@/components/dashboard/dashboard-stats';

const quickActions = [
  { href: '/dashboard/students', title: 'Manage Students', description: 'Add, edit, or view student details.', icon: Users },
  { href: '/dashboard/scan', title: 'Scan QR Code', description: 'Start an attendance session.', icon: QrCode },
  { href: '/dashboard/records', title: 'View Records', description: 'Check historical attendance data.', icon: CalendarClock },
  { href: '/dashboard/import', title: 'Import Students', description: 'Bulk upload students from a CSV file.', icon: FileUp },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your class attendance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStats />
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
        <p className="text-muted-foreground mb-4">
          Jump right into your common tasks.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map(action => (
             <Card key={action.href} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{action.title}</CardTitle>
                <action.icon className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>{action.description}</CardDescription>
                <Button asChild variant="link" className="px-0 -mb-2 -ml-2">
                  <Link href={action.href} className="mt-2">
                    Go to {action.title} <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
