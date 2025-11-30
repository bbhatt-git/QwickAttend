
import { StudentsTable } from '@/components/students/students-table';

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Students</h1>
      </div>
      <StudentsTable />
    </div>
  );
}
