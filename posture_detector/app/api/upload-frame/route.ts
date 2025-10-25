import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  console.log('🔵 Upload frame endpoint called');
  
  try {
    const body = await request.json();
    console.log('📦 Received frame upload request:', {
      hasFrameData: !!body.frameData,
      sessionId: body.sessionId,
      frameNumber: body.frameNumber
    });
    
    const { frameData, sessionId, frameNumber, timestamp } = body;

    if (!frameData || !sessionId || frameNumber === undefined) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const cwd = process.cwd();
    console.log('📁 Working directory:', cwd);

    const storageDir = join(cwd, 'storage', 'sessions', sessionId, 'frames');
    console.log('📂 Target directory:', storageDir);
    
    if (!existsSync(storageDir)) {
      console.log('📁 Creating directory...');
      await mkdir(storageDir, { recursive: true });
      console.log('✅ Directory created');
    }

    const base64Data = frameData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const filename = `frame_${String(frameNumber).padStart(6, '0')}.jpg`;
    const filepath = join(storageDir, filename);
    
    console.log('💾 Saving file:', filename);
    await writeFile(filepath, buffer);

    console.log(`✅ Frame saved: ${filename} (${buffer.length} bytes)`);

    return NextResponse.json({
      success: true,
      filename,
      filepath: filepath.replace(cwd, ''),
      size: buffer.length,
      frameNumber,
    });

  } catch (error) {
    console.error('❌ Error saving frame:', error);
    return NextResponse.json(
      { error: 'Failed to save frame', details: String(error) },
      { status: 500 }
    );
  }
}