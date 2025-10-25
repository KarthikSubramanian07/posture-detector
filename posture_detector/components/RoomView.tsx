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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapturedFrame, setLastCapturedFrame] = useState<string | null>(null);
  const [sessionId] = useState(`session-${Date.now()}`);

  const FPS = 5; // Fixed at 5 FPS

  // Get video tracks
  const tracks = useTracks([Track.Source.Camera]);

  useEffect(() => {
    if (room.state === 'connected') {
      setIsConnected(true);
      setRecordingStartTime(Date.now());
    }
  }, [room.state]);

  // Duration timer
  useEffect(() => {
    if (!recordingStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [recordingStartTime]);

  // Attach video track to video element
  useEffect(() => {
    if (tracks.length > 0 && videoRef.current) {
      const videoTrack = tracks[0];
      if (videoTrack.publication?.track) {
        videoTrack.publication.track.attach(videoRef.current);
      }
    }
  }, [tracks]);

  // Frame capture function
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameData = canvas.toDataURL('image/jpeg', 0.8);
    return frameData;
  };

  // Upload frame to backend
  const uploadFrame = async (frameData: string, frameNumber: number) => {
    try {
      const response = await fetch('/api/upload-frame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frameData,
          sessionId,
          frameNumber,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log(`✅ Frame ${frameNumber} uploaded:`, result.filename);
      setUploadedCount(prev => prev + 1);
      
    } catch (error) {
      console.error(`❌ Failed to upload frame ${frameNumber}:`, error);
      setFailedCount(prev => prev + 1);
    }
  };

  // Start/Stop frame capture with upload
  useEffect(() => {
    if (isCapturing && isConnected) {
      const interval = 1000 / FPS;

      frameIntervalRef.current = setInterval(() => {
        const frame = captureFrame();
        if (frame) {
          const currentFrameNumber = frameCount + 1;
          setLastCapturedFrame(frame);
          setFrameCount(currentFrameNumber);
          
          // Upload frame to backend
          uploadFrame(frame, currentFrameNumber);
        }
      }, interval);

      return () => {
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current);
        }
      };
    }
  }, [isCapturing, isConnected, frameCount]);

  // Auto-start capturing when connected
  useEffect(() => {
    if (isConnected && !isCapturing) {
      setIsCapturing(true);
    }
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Status Bar */}
        <div className="bg-gray-800 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="font-semibold">
                  {isConnected ? '🔴 Recording' : '⚫ Connecting...'}
                </span>
              </div>
              
              <div className="text-sm text-gray-300">
                Session: {sessionId}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-sm">
                <span className="text-gray-400">Duration:</span>
                <span className="ml-2 font-mono">{formatDuration(duration)}</span>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-400">Captured:</span>
                <span className="ml-2 font-mono">{frameCount}</span>
              </div>

              <div className="text-sm">
                <span className="text-gray-400">Uploaded:</span>
                <span className="ml-2 font-mono text-green-400">{uploadedCount}</span>
              </div>

              {failedCount > 0 && (
                <div className="text-sm">
                  <span className="text-gray-400">Failed:</span>
                  <span className="ml-2 font-mono text-red-400">{failedCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video Preview */}
        <div className="bg-black relative" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
          
          <canvas ref={canvasRef} className="hidden" />
          
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Initializing camera...</p>
              </div>
            </div>
          )}

          {isConnected && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>REC</span>
            </div>
          )}

          {isCapturing && (
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>CAPTURING @ {FPS} FPS</span>
            </div>
          )}
        </div>

        {/* Frame Preview */}
        {lastCapturedFrame && (
          <div className="bg-gray-100 p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Last Captured Frame:</h3>
              <span className="text-xs text-gray-500">Frame #{frameCount}</span>
            </div>
            <div className="flex justify-center">
              <img 
                src={lastCapturedFrame} 
                alt="Last captured frame" 
                className="max-w-xs rounded shadow-md border-2 border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p className="mb-1">
                <strong>Participant:</strong> {localParticipant.identity}
              </p>
              <p className="mb-1">
                <strong>Status:</strong>{' '}
                {isConnected ? (
                  <span className="text-green-600">Connected & Recording</span>
                ) : (
                  <span className="text-yellow-600">Connecting...</span>
                )}
              </p>
              <p>
                <strong>Upload Rate:</strong>{' '}
                <span className="text-blue-600">
                  {frameCount > 0 ? Math.round((uploadedCount / frameCount) * 100) : 0}%
                </span>
              </p>
            </div>

            <button
              onClick={onStopRecording}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              ⏹️ Stop Recording
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-green-50 border-t border-green-200 px-6 py-3">
          <p className="text-sm text-green-800">
            ✅ <strong>Frames are being saved!</strong> Check{' '}
            <code className="bg-green-100 px-2 py-1 rounded">storage/sessions/{sessionId}/frames/</code>{' '}
            folder in your project directory.
          </p>
        </div>
      </div>
    </div>
  );
}
