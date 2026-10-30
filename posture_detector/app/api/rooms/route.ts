import { RoomServiceClient } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

// Room listings change constantly, so never cache this route.
export const dynamic = 'force-dynamic';

export async function GET() {
  const wsUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!wsUrl || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'LiveKit credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const roomService = new RoomServiceClient(
      wsUrl.replace('wss://', 'https://'),
      apiKey,
      apiSecret
    );

    const rooms = await roomService.listRooms();

    return NextResponse.json({
      rooms: rooms.map((room) => ({
        sid: room.sid,
        name: room.name,
        emptyTimeout: room.emptyTimeout,
        maxParticipants: room.maxParticipants,
        // creationTime is an int64 (bigint), which JSON cannot encode.
        creationTime: Number(room.creationTime),
        numParticipants: room.numParticipants,
      })),
    });
  } catch (error) {
    console.error('Error listing rooms:', error);
    return NextResponse.json(
      { error: 'Failed to list rooms' },
      { status: 500 }
    );
  }
}
