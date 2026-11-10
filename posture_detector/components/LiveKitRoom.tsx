'use client';

import { useEffect, useState } from 'react';
import { LiveKitRoom as LKRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import RoomView from './RoomView';

interface LiveKitRoomProps {
  roomName: string;
  participantName: string;
  onDisconnect: () => void;
}

export default function LiveKitRoom({ 
  roomName, 
  participantName, 
  onDisconnect 
}: LiveKitRoomProps) {
  const [token, setToken] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch token from backend
    const fetchToken = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/token?roomName=${encodeURIComponent(roomName)}&participantName=${encodeURIComponent(participantName)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch token');
        }

        const data = await response.json();
        setToken(data.token);
        setWsUrl(data.wsUrl);
        
      } catch (err) {
        console.error('Error fetching token:', err);
        setError('Failed to connect to LiveKit. Please check your configuration.');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [roomName, participantName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-live="polite" aria-busy="true">
        <div className="text-center">
          <div className="motion-safe:animate-spin rounded-full h-12 w-12 border-b-2 border-purple-800 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-800">Connecting to LiveKit Cloud...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border-2 border-red-700 rounded-lg p-6" role="alert">
          <h2 className="text-red-900 font-semibold mb-2">Connection Error</h2>
          <p className="text-red-900 mb-4">{error}</p>
          <button
            type="button"
            onClick={onDisconnect}
            className="min-h-[44px] px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!token || !wsUrl) {
    return (
      <div className="max-w-2xl mx-auto" role="status" aria-live="polite">
        <div className="bg-amber-50 border-2 border-amber-700 rounded-lg p-6">
          <p className="text-amber-950">Waiting for connection details...</p>
        </div>
      </div>
    );
  }

  return (
    <LKRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      audio={false}
      video={true}
      onDisconnected={onDisconnect}
    >
      <RoomView onStopRecording={onDisconnect} />
    </LKRoom>
  );
}