import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, emptyTimeout, maxParticipants } = body;

    // Validate
    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Initialize LiveKit Room Service Client
    const livekitHost = process.env.LIVEKIT_URL?.replace('wss://', 'https://');
    const roomService = new RoomServiceClient(
      livekitHost!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    // Create room in LiveKit Cloud
    const room = await roomService.createRoom({
      name: roomName,
      // Room closes after 10 minutes of being empty (default)
      emptyTimeout: emptyTimeout || 10 * 60,
      // Maximum participants (0 = unlimited)
      maxParticipants: maxParticipants || 0,
    });

    return NextResponse.json({
      room: {
        sid: room.sid,
        name: room.name,
        emptyTimeout: room.emptyTimeout,
        maxParticipants: room.maxParticipants,
        creationTime: room.creationTime,
        numParticipants: room.numParticipants,
      },
    });

  } catch (error: any) {
    console.error('Error creating room:', error);
    
    // Handle room already exists
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'Room already exists', code: 'ROOM_EXISTS' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}