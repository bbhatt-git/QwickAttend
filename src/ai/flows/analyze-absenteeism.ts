'use server';

/**
 * @fileOverview Analyzes student attendance records to identify potential reasons for absenteeism.
 *
 * - analyzeAbsenteeism - A function that takes attendance records and returns potential reasons for absenteeism.
 * - AnalyzeAbsenteeismInput - The input type for the analyzeAbsenteeism function.
 * - AnalyzeAbsenteeismOutput - The return type for the analyzeAbsenteeism function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAbsenteeismInputSchema = z.object({
  attendanceRecords: z.array(
    z.object({
      student_id: z.string(),
      date: z.string(), // Format: 'yyyy-MM-dd'
      timestamp: z.number(),
    })
  ).describe('An array of attendance records for a specific time period.'),
  teacher_id: z.string().describe('The ID of the teacher requesting the analysis.'),
});
export type AnalyzeAbsenteeismInput = z.infer<typeof AnalyzeAbsenteeismInputSchema>;

const AnalyzeAbsenteeismOutputSchema = z.object({
  analysis: z.string().describe('A detailed analysis of potential reasons for student absenteeism based on the provided attendance records.'),
});
export type AnalyzeAbsenteeismOutput = z.infer<typeof AnalyzeAbsenteeismOutputSchema>;

export async function analyzeAbsenteeism(input: AnalyzeAbsenteeismInput): Promise<AnalyzeAbsenteeismOutput> {
  return analyzeAbsenteeismFlow(input);
}

const analyzeAbsenteeismPrompt = ai.definePrompt({
  name: 'analyzeAbsenteeismPrompt',
  input: {schema: AnalyzeAbsenteeismInputSchema},
  output: {schema: AnalyzeAbsenteeismOutputSchema},
  prompt: `You are an AI assistant that analyzes student attendance records and provides potential reasons for absenteeism.

  Analyze the following attendance records and identify potential reasons for student absenteeism. Consider factors such as patterns in absence dates, the number of absences, and any other relevant information.

  Attendance Records: {{{attendanceRecords}}}
  Teacher ID: {{{teacher_id}}}

  Provide a detailed analysis of potential reasons for student absenteeism.`,
});

const analyzeAbsenteeismFlow = ai.defineFlow(
  {
    name: 'analyzeAbsenteeismFlow',
    inputSchema: AnalyzeAbsenteeismInputSchema,
    outputSchema: AnalyzeAbsenteeismOutputSchema,
  },
  async input => {
    const {output} = await analyzeAbsenteeismPrompt(input);
    return output!;
  }
);
