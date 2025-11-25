import { StudentsTable } from '@/components/students/students-table';

export default function StudentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground">
          Manage your student roster and their QR codes.
        </p>
      </div>
      <StudentsTable />
    </div>
  );
}
