'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useRoomContext,
  useLocalParticipant,
  useTracks
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { AppConfig } from '@/config/app.config';

interface PosturePalRoomProps {
  onStopRecording: () => void;
}

export default function PosturePalRoom({ onStopRecording }: PosturePalRoomProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationTimeRef = useRef<number>(0);
  const lastVoiceAlertTimeRef = useRef<number>(0);
  const isPlayingAudioRef = useRef<boolean>(false);

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
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [lastMetrics, setLastMetrics] = useState<any>(null);
  const [alertAnnouncement, setAlertAnnouncement] = useState<string>('');
  const [postureStatusLabel, setPostureStatusLabel] = useState<'unknown' | 'good' | 'needs-adjustment'>('unknown');

  const CAPTURE_INTERVAL_MS = AppConfig.recording.captureIntervalSeconds * 1000;
  const NOTIFICATION_COOLDOWN_MS = AppConfig.alerts.desktopNotification.cooldownSeconds * 1000;
  const VOICE_ALERT_COOLDOWN_MS = AppConfig.alerts.voiceAlert.cooldownSeconds * 1000;
  const tracks = useTracks([Track.Source.Camera]);

  useEffect(() => {
    if (room.state === 'connected') {
      setIsConnected(true);
      setRecordingStartTime(Date.now());
    }
  }, [room.state]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

  const speakText = async (text: string) => {
    const now = Date.now();
    const timeSinceLastAlert = now - lastVoiceAlertTimeRef.current;

    // Check if audio is already playing or within cooldown period
    if (isPlayingAudioRef.current) {
      console.log('⏭️ Skipping voice alert - audio already playing');
      return;
    }

    if (timeSinceLastAlert < VOICE_ALERT_COOLDOWN_MS) {
      const remainingTime = Math.ceil((VOICE_ALERT_COOLDOWN_MS - timeSinceLastAlert) / 1000);
      console.log(`⏳ Skipping voice alert - cooldown active (${remainingTime}s remaining)`);
      return;
    }

    try {
      console.log('🎤 Requesting voice alert for:', text.substring(0, 50) + '...');
      isPlayingAudioRef.current = true;

      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`Speech API failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        isPlayingAudioRef.current = false;
        lastVoiceAlertTimeRef.current = Date.now();
        console.log('✅ Voice alert completed');
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
        isPlayingAudioRef.current = false;
      };

      await audio.play();
      console.log('🔊 Playing voice alert');
    } catch (error) {
      console.error('❌ Failed to speak text:', error);
      isPlayingAudioRef.current = false;
    }
  };

  const showDesktopNotification = (message: string) => {
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTimeRef.current;

    // Check if within cooldown period
    if (timeSinceLastNotification < NOTIFICATION_COOLDOWN_MS) {
      const remainingTime = Math.ceil((NOTIFICATION_COOLDOWN_MS - timeSinceLastNotification) / 1000);
      console.log(`⏳ Skipping desktop notification - cooldown active (${remainingTime}s remaining)`);
      return;
    }

    console.log('🔔 Attempting to show notification:', message);
    console.log('🔔 Notification support:', 'Notification' in window);
    console.log('🔔 Notification permission:', Notification?.permission);

    if (!('Notification' in window)) {
      console.error('❌ Browser does not support notifications');
      return;
    }

    if (Notification.permission === 'denied') {
      console.error('❌ Notification permission denied');
      return;
    }

    if (Notification.permission === 'default') {
      console.warn('⚠️ Notification permission not yet requested, requesting now...');
      Notification.requestPermission().then(permission => {
        console.log('🔔 Permission result:', permission);
        if (permission === 'granted') {
          showDesktopNotification(message);
        }
      });
      return;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Showing notification now');
      const notification = new Notification('Desk Potato - Posture Alert', {
        body: message,
        icon: '/deskpotato_logo.png',
        tag: 'posture-alert',
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
      lastNotificationTimeRef.current = now;
      console.log('✅ Notification created successfully');
    }
  };

  const getAIFeedback = async (metrics: any): Promise<string> => {
    try {
      console.log('🤖 Requesting AI feedback for metrics:', metrics);
      setFeedbackLoading(true);
      const response = await fetch('http://localhost:5001/api/ai_feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metrics),
      });

      console.log('📡 AI feedback response status:', response.status);

      if (!response.ok) {
        throw new Error(`AI feedback request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AI feedback received:', data);
      if (data.feedback) {
        setAiFeedback(data.feedback);
        console.log('💬 Set AI feedback to:', data.feedback);
        return data.feedback;
      }
      return 'Please adjust your posture';
    } catch (error) {
      console.error('❌ Failed to get AI feedback:', error);
      // Fallback to generic message
      const fallbackMessage = 'Please adjust your posture';
      setAiFeedback(fallbackMessage);
      console.log('⚠️ Using fallback feedback');
      return fallbackMessage;
    } finally {
      setFeedbackLoading(false);
    }
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
      const metrics = await fetch('http://localhost:5500/api/get_metrics?id=' + frameNumber);
      const metricsData = await metrics.json();
      console.log('📊 Metrics received:', metricsData);

      // Store metrics for display
      setLastMetrics(metricsData);
      console.log('💾 Stored metrics in state');

      // Log posture (don't let CORS errors crash the whole function)
      // Ryan - calling dummy function 4
      try {
        await fetch('http://localhost:3500/api/app.py?' + "neck-strain=" + metricsData.neck_strain + "&eye-strain=" + metricsData.eye_strain + "&posture=" + metricsData.posture);
      } catch (logError) {
        console.warn('⚠️ Posture logging failed (non-critical):', logError);
      }

      // Only get AI feedback for bad posture (posture === 0)
      // Don't show positive feedback - only alert when there's a problem
      if (metricsData.posture === 0) {
        console.log('⚠️ Bad posture detected! Requesting AI feedback...');
        const feedback = await getAIFeedback(metricsData);
        const message = feedback || 'Please adjust your posture';

        setPostureStatusLabel('needs-adjustment');
        // Non-visual alert: assertive live region + visible text (not colour/sound alone)
        setAlertAnnouncement(`Posture alert: ${message}`);

        // Show desktop notification with AI feedback
        showDesktopNotification(message);

        // Speak the AI feedback as voice alert
        speakText(message);

        // Dispatch custom event for notification system
        const event = new CustomEvent('posture-update', {
          detail: {
            posture: metricsData.posture,
            metrics: metricsData,
            feedback: message
          }
        });
        window.dispatchEvent(event);
      } else {
        // Good posture - clear feedback, no positive messages
        setAiFeedback('');
        setPostureStatusLabel('good');
        setAlertAnnouncement('Posture looks good.');

        // Notify notification system that posture is good (resets bad posture timer)
        const event = new CustomEvent('posture-update', {
          detail: {
            posture: metricsData.posture,
            metrics: metricsData,
            feedback: null
          }
        });
        window.dispatchEvent(event);
      }

      console.log(`✅ Frame ${frameNumber} uploaded:`, result.filename);
      setUploadedCount(prev => prev + 1);
      
    } catch (error) {
      console.error(`❌ Failed to upload frame ${frameNumber}:`, error);
      setFailedCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (isCapturing && isConnected && !isPaused) {
      frameIntervalRef.current = setInterval(() => {
        const frame = captureFrame();
        if (frame) {
          const currentFrameNumber = frameCount + 1;
          setFrameCount(currentFrameNumber);
          uploadFrame(frame, currentFrameNumber);
        }
      }, CAPTURE_INTERVAL_MS);

      return () => {
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current);
        }
      };
    }
  }, [isCapturing, isConnected, isPaused, frameCount, CAPTURE_INTERVAL_MS]);

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

  const connectionLabel = isPaused
    ? 'Paused'
    : isConnected
      ? 'Connected and recording'
      : 'Connecting';

  const postureText =
    postureStatusLabel === 'needs-adjustment'
      ? 'Needs adjustment'
      : postureStatusLabel === 'good'
        ? 'Good'
        : 'Waiting for first reading';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Assertive live region for posture alerts (WCAG 4.1.3 / 1.4.1). */}
      <div className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
        {alertAnnouncement}
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-300">
        {/* Status Bar */}
        <div className="bg-gradient-to-r from-purple-700 via-pink-700 to-orange-600 text-white px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-semibold text-lg flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${isConnected ? 'bg-green-300 motion-safe:animate-pulse' : 'bg-gray-300'}`}
                  aria-hidden="true"
                ></span>
                <span>{isConnected ? 'PosturePal Active' : 'Connecting...'}</span>
              </p>
              <p className="text-sm text-purple-50">
                Session: <span className="font-mono">{sessionId.slice(-8)}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm" aria-label="Session metrics">
              <p>
                <span className="text-purple-50">Duration:</span>
                <span className="ml-2 font-mono font-bold">{formatDuration(duration)}</span>
              </p>
              <p>
                <span className="text-purple-50">Frames:</span>
                <span className="ml-2 font-mono font-bold">{frameCount}</span>
              </p>
              <p>
                <span className="text-purple-50">Saved:</span>
                <span className="ml-2 font-mono font-bold">{uploadedCount}</span>
              </p>
              {failedCount > 0 && (
                <p>
                  <span className="text-purple-50">Failed:</span>
                  <span className="ml-2 font-mono font-bold">{failedCount}</span>
                </p>
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
            aria-label="Live camera preview for posture monitoring"
          />

          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75" role="status" aria-live="polite">
              <div className="text-center text-white">
                <div className="motion-safe:animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4" aria-hidden="true"></div>
                <p className="text-lg">Initializing camera...</p>
              </div>
            </div>
          )}

          {isConnected && (
            <>
              <div className="absolute top-4 right-4 bg-red-700 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full motion-safe:animate-pulse" aria-hidden="true"></span>
                <span>LIVE</span>
              </div>

              {isCapturing && (
                <div className={`absolute top-4 left-4 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 shadow-lg ${
                  isPaused
                    ? 'bg-orange-700'
                    : 'bg-purple-800'
                }`}>
                  <span className="w-2 h-2 bg-white rounded-full motion-safe:animate-pulse" aria-hidden="true"></span>
                  <span>{isPaused ? 'PAUSED' : `CAPTURING (1 frame / ${AppConfig.recording.captureIntervalSeconds}s)`}</span>
                </div>
              )}

              {/* Visible text alert panel — complements colour and voice */}
              {aiFeedback && (
                <div
                  className={`absolute bottom-4 left-4 right-4 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border-2 ${
                    lastMetrics?.posture != 1
                      ? 'bg-red-800/95 border-white'
                      : 'bg-emerald-800/95 border-white'
                  }`}
                  role="alert"
                >
                  <div className="flex items-start space-x-3">
                    {feedbackLoading ? (
                      <div className="motion-safe:animate-spin rounded-full h-6 w-6 border-b-2 border-white mt-1" aria-hidden="true"></div>
                    ) : (
                      <div className="flex-shrink-0 mt-1" aria-hidden="true">
                        {lastMetrics?.posture != 1 ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" focusable="false">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" focusable="false">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-base mb-1">
                        {lastMetrics?.posture != 1 ? 'Posture Alert — needs adjustment' : 'Posture Status — good'}
                      </p>
                      <p className="text-sm leading-relaxed">{aiFeedback}</p>
                      {lastMetrics && (
                        <div className="mt-3 pt-3 border-t border-white/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="opacity-90">Eye Strain</p>
                            <p className="font-mono font-bold">{lastMetrics.eye_strain?.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="opacity-90">Face Angle</p>
                            <p className="font-mono font-bold">{lastMetrics.face_pitch?.toFixed(1)}°</p>
                          </div>
                          <div>
                            <p className="opacity-90">Neck Strain</p>
                            <p className="font-mono font-bold">{lastMetrics.neck_strain?.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-50 px-4 sm:px-6 py-6 border-t">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-800" role="status" aria-live="polite">
              <p className="mb-2">
                <strong className="text-gray-900">Connection:</strong>{' '}
                <span className="font-semibold">{connectionLabel}</span>
              </p>
              <p className="mb-2">
                <strong className="text-gray-900">Posture:</strong>{' '}
                <span className="font-semibold">{postureText}</span>
              </p>
              <p>
                <strong className="text-gray-900">Upload Rate:</strong>{' '}
                <span className="text-purple-900 font-semibold">
                  {frameCount > 0 ? Math.round((uploadedCount / frameCount) * 100) : 0}%
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePauseResume}
                className="min-h-[48px] px-6 py-3 bg-purple-800 text-white rounded-xl font-bold shadow-lg hover:bg-purple-900 transition-colors"
              >
                <span className="flex items-center space-x-2">
                  {isPaused ? (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
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
                        aria-hidden="true"
                        focusable="false"
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
                type="button"
                onClick={onStopRecording}
                className="min-h-[48px] px-8 py-3 bg-red-700 text-white rounded-xl font-bold shadow-lg hover:bg-red-800 transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
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

      </div>
    </div>
  );
} 