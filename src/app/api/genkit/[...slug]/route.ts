import { createNextApiHandler } from '@genkit-ai/next';
import '@/ai/flows/analyze-absenteeism';

const handler = createNextApiHandler();

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
