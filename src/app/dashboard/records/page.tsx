import AttendanceView from "@/components/records/attendance-view";

export default function RecordsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
        <p className="text-muted-foreground">
          Review past attendance records and export reports.
        </p>
      </div>
      <AttendanceView />
    </div>
  );
}
