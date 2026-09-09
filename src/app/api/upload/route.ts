import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No photo file uploaded' }, { status: 400 });
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload JPG, JPEG, PNG, or WEBP.' },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // On Vercel or read-only production serverless environments, convert to optimized Data URL
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      const mimeType = file.type || 'image/png';
      const base64Image = buffer.toString('base64');
      const photoUrl = `data:${mimeType};base64,${base64Image}`;
      return NextResponse.json({ success: true, photoUrl });
    }

    // Local filesystem storage for development
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      return NextResponse.json({ success: true, photoUrl: `/uploads/${filename}` });
    } catch (fsErr) {
      // Fallback to base64 Data URL if local disk write fails
      const mimeType = file.type || 'image/png';
      const base64Image = buffer.toString('base64');
      return NextResponse.json({ success: true, photoUrl: `data:${mimeType};base64,${base64Image}` });
    }
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Failed to process and upload image.' }, { status: 500 });
  }
}
