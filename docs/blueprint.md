# **App Name**: QwickAttend

## Core Features:

- Firebase Authentication: Implement user sign-up and login with email/password using Firebase Authentication.
- Student Management: Allow teachers to add, edit, and delete student records, including generating unique student IDs and QR codes.
- QR Code Generation and Storage: Generate QR codes for each student and store them in Firebase Storage. Link the storage URL to the student document.
- Attendance Scanning: Implement a QR code scanner to mark student attendance and prevent duplicate entries for the same student on the same day.
- Data Storage and Retrieval: Store and retrieve student and attendance data from Firestore, ensuring teachers can only access their own data via security rules.
- Attendance Records and Export: Display present and absent students for a selected date and allow exporting the attendance list as a CSV file.
- Attendance Analysis and Summarization: Use generative AI to suggest potential root causes of absenteeism, using a tool that helps the system decide when and how to best include information related to unusual patterns of attendance.

## Style Guidelines:

- Primary color: Deep Indigo (#4F46E5) to reflect reliability and organization, aligning with the app's attendance tracking function.
- Background color: Very light gray (#F9FAFB), nearly white, provides a clean and professional feel.
- Accent color: Violet (#8B5CF6), analogous to Indigo, used for highlighting interactive elements such as buttons and active navigation links.
- Body and headline font: 'Inter', a sans-serif font known for its readability and modern appearance.
- Use clean and simple icons from the ShadCN UI library for navigation and actions.
- Maintain a consistent layout across all dashboard pages with a persistent sidebar for navigation.
- Subtle animations for transitions and loading states to enhance the user experience.