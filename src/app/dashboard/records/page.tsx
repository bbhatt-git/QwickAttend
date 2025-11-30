
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceView from "@/components/records/attendance-view";
import StudentHistoryView from "@/components/records/student-history-view";
import { CalendarDays, UserSearch } from "lucide-react";

export default function RecordsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
        <p className="text-muted-foreground">
          Review daily attendance or search a specific student's history.
        </p>
      </div>
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">
            <CalendarDays className="mr-2 h-4 w-4" />
            Daily Attendance
          </TabsTrigger>
          <TabsTrigger value="history">
            <UserSearch className="mr-2 h-4 w-4" />
            Student History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <AttendanceView />
        </TabsContent>
        <TabsContent value="history">
          <StudentHistoryView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
