import CsvUploader from '@/components/import/csv-uploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileQuestion } from 'lucide-react';

export default function ImportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Students</h1>
        <p className="text-muted-foreground">
          Bulk upload students using a CSV file.
        </p>
      </div>

      <Alert>
        <FileQuestion className="h-4 w-4" />
        <AlertTitle>CSV File Format</AlertTitle>
        <AlertDescription>
          <p>Please ensure your CSV file contains the following columns in any order: <strong>name</strong>, <strong>class</strong>, and <strong>section</strong>.</p>
          <p className="mt-2">The 'section' values must match one of the predefined options (e.g., SpaceX, FusionX, etc.).</p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>
            Select a CSV file to import. The system will process each row to create new student records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CsvUploader />
        </CardContent>
      </Card>
    </div>
  );
}
