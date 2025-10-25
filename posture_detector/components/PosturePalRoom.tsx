'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  useRoomContext, 
  useLocalParticipant,
  useTracks 
} from '@livekit/components-react';
import { Track } from 'livekit-client';

interface PosturePalRoomProps {
  onStopRecording: () => void;
}

export default function PosturePalRoom({ onStopRecording }: PosturePalRoomProps) {
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
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [sessionId] = useState(`posturepal-${Date.now()}`);

  const FPS = 5;
  const tracks = useTracks([Track.Source.Camera]);

  useEffect(() => {
    if (room.state === 'connected') {
      setIsConnected(true);
      setRecordingStartTime(Date.now());
    }
  }, [room.state]);

  useEffect(() => {
    if (!recordingStartTime || isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTime - pausedTime) / 1000);
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [recordingStartTime, isPaused, pausedTime]);

  useEffect(() => {
    if (tracks.length > 0 && videoRef.current) {
      const videoTrack = tracks[0];
      if (videoTrack.publication?.track) {
        videoTrack.publication.track.attach(videoRef.current);
      }
    }
  }, [tracks]);

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

  useEffect(() => {
    if (isCapturing && isConnected && !isPaused) {
      const interval = 1000 / FPS;

      frameIntervalRef.current = setInterval(() => {
        const frame = captureFrame();
        if (frame) {
          const currentFrameNumber = frameCount + 1;
          setFrameCount(currentFrameNumber);
          uploadFrame(frame, currentFrameNumber);
        }
      }, interval);

      return () => {
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current);
        }
      };
    }
  }, [isCapturing, isConnected, isPaused, frameCount]);

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

  const handlePauseResume = () => {
    if (isPaused) {
      // Resume
      const pauseDuration = Date.now() - (recordingStartTime || 0) - duration * 1000;
      setPausedTime(pauseDuration);
      setIsPaused(false);
    } else {
      // Pause
      setIsPaused(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        {/* Status Bar */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="font-semibold text-lg">
                  {isConnected ? '🎯 PosturePal Active' : '⚫ Connecting...'}
                </span>
              </div>

              <div className="text-sm text-purple-100">
                Session: {sessionId.slice(-8)}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-sm">
                <span className="text-purple-100">Duration:</span>
                <span className="ml-2 font-mono font-bold">{formatDuration(duration)}</span>
              </div>

              <div className="text-sm">
                <span className="text-purple-100">Frames:</span>
                <span className="ml-2 font-mono font-bold">{frameCount}</span>
              </div>

              <div className="text-sm">
                <span className="text-purple-100">Saved:</span>
                <span className="ml-2 font-mono font-bold text-green-300">{uploadedCount}</span>
              </div>

              {failedCount > 0 && (
                <div className="text-sm">
                  <span className="text-purple-100">Failed:</span>
                  <span className="ml-2 font-mono font-bold text-red-300">{failedCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video Preview */}
        <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
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
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
                <p className="text-lg">Initializing camera...</p>
              </div>
            </div>
          )}

          {isConnected && (
            <>
              {/* LIVE Indicator */}
              <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </div>

              {/* CAPTURING/PAUSED Indicator */}
              {isCapturing && (
                <div className={`absolute top-4 left-4 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 shadow-lg ${
                  isPaused
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600'
                }`}>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>{isPaused ? 'PAUSED' : `CAPTURING @ ${FPS} FPS`}</span>
                </div>
              )}

              {/* PosturePal Overlay Placeholder */}
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm">
                <p className="font-semibold">Posture Analysis: Coming Soon</p>
                <p className="text-xs text-gray-300">Frame-by-frame capture active</p>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-50 px-6 py-6 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              <p className="mb-2">
                <strong className="text-gray-900">Status:</strong>{' '}
                {isPaused ? (
                  <span className="text-orange-600 font-semibold">⏸ Paused</span>
                ) : isConnected ? (
                  <span className="text-green-600 font-semibold">● Connected & Recording</span>
                ) : (
                  <span className="text-yellow-600 font-semibold">● Connecting...</span>
                )}
              </p>
              <p>
                <strong className="text-gray-900">Upload Rate:</strong>{' '}
                <span className="text-purple-600 font-semibold">
                  {frameCount > 0 ? Math.round((uploadedCount / frameCount) * 100) : 0}%
                </span>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handlePauseResume}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <span className="flex items-center space-x-2">
                  {isPaused ? (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Pause</span>
                    </>
                  )}
                </span>
              </button>

              <button
                onClick={onStopRecording}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <span className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                    />
                  </svg>
                  <span>Stop Monitoring</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-200 px-6 py-4">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                ✅ Frames are being captured and saved!
              </p>
              <p className="text-xs text-gray-700">
                Check <code className="bg-white px-2 py-1 rounded border border-purple-300">storage/sessions/{sessionId}/frames/</code> folder to see your captured frames.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}                