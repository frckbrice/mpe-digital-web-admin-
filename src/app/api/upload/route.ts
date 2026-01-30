import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload
 *
 * Single upload endpoint for Cloudinary. Use this for all file uploads
 * (message attachments, documents, etc.) so config and logic stay in one place.
 *
 * Body: FormData with "file" (required).
 * Response: { data: { url, name, size, type, uploadedAt } }
 */
export async function POST(req: NextRequest) {
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Upload not configured', message: 'Must supply api_key' },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid body', message: 'Expected multipart form data' },
      { status: 400 }
    );
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { success: false, error: 'Missing file', message: 'Form field "file" is required' },
      { status: 400 }
    );
  }

  const name = typeof file === 'object' && 'name' in file ? String((file as File).name) : 'file';
  const size = typeof file === 'object' && 'size' in file ? Number((file as File).size) : 0;
  const type = typeof file === 'object' && 'type' in file ? String((file as File).type) : 'application/octet-stream';

  let buffer: Buffer;
  try {
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Read failed', message: 'Could not read file' },
      { status: 400 }
    );
  }

  try {
    const result = await uploadToCloudinary(buffer, {
      folder: 'uploads',
      originalName: name,
      mimeType: type || undefined,
      size,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json(
      { success: false, error: 'Upload failed', message },
      { status: 500 }
    );
  }
}
