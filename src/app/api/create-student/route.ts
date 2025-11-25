
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { Student } from '@/lib/student';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const storage = admin.storage();

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Authorization header missing' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const teacherId = decodedToken.uid;

    const { name, class: className, section } = await req.json();

    if (!name || !className || !section) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const studentId = uuidv4().slice(0, 8).toUpperCase();
    const studentDocRef = db.collection(`teachers/${teacherId}/students`).doc();
    
    const qrData = JSON.stringify({ student_id: studentId, teacher_id: teacherId });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    const bucket = storage.bucket();
    const filePath = `qrcodes/${teacherId}/${studentId}.png`;
    const file = bucket.file(filePath);
    
    const buffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
    
    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
      },
    });

    const [qrCodeUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491',
    });

    const newStudent: Student = {
      id: studentDocRef.id,
      name,
      class: className,
      section,
      studentId,
      qrCodeUrl,
      teacherId,
    };

    await studentDocRef.set(newStudent);

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
