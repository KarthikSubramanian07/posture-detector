'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  useRoomContext, 
  useLocalParticipant,
  useTracks 
} from '@livekit/components-react';
import { Track } from 'livekit-client';

interface RoomViewProps {
  onStopRecording: () => void;
}

export default function RoomView({ onStopRecording }: RoomViewProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();