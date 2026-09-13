import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && key) {
    return createClient(url, key);
  }
  return null;
}

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
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // 1. Try Supabase Storage first if credentials exist
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const bucketName = 'participant-photos';

        let { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filename, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (error && error.message.includes('Bucket not found')) {
          await supabase.storage.createBucket(bucketName, { public: true });
          const retry = await supabase.storage
            .from(bucketName)
            .upload(filename, buffer, {
              contentType: file.type || 'image/jpeg',
              upsert: true,
            });
          data = retry.data;
          error = retry.error;
        }

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filename);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({ success: true, photoUrl: publicUrlData.publicUrl });
          }
        } else {
          console.warn('Supabase storage upload fell back:', error?.message);
        }
      } catch (storageErr) {
        console.warn('Supabase storage upload error:', storageErr);
      }
    }

    // 2. Local filesystem storage for development
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      return NextResponse.json({ success: true, photoUrl: `/uploads/${filename}` });
    } catch (fsErr) {
      // 3. Fallback to optimized base64 Data URL if local disk write fails
      const mimeType = file.type || 'image/jpeg';
      const base64Image = buffer.toString('base64');
      return NextResponse.json({ success: true, photoUrl: `data:${mimeType};base64,${base64Image}` });
    }
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Failed to process and upload image.' }, { status: 500 });
  }
}
