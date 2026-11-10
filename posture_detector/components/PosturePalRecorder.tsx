'use client';

import { useEffect, useState } from 'react';
import { LiveKitRoom as LKRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import PosturePalRoom from './PosturePalRoom';

interface PosturePalRecorderProps {
  onStop: () => void;
}

export default function PosturePalRecorder({ onStop }: PosturePalRecorderProps) {
  const [token, setToken] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [roomName] = useState(`posturepal-${Date.now()}`);
  const [participantName] = useState(`user-${Date.now()}`);

  // Check camera permission on mount
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        setCheckingPermission(true);
        
        // First check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Camera access is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
          setCheckingPermission(false);
          setLoading(false);
          return;
        }

        // Try to check permission status (not all browsers support this)
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
            setCameraPermission(permissionStatus.state as 'prompt' | 'granted' | 'denied');
            
            // Listen for permission changes
            permissionStatus.onchange = () => {
              setCameraPermission(permissionStatus.state as 'prompt' | 'granted' | 'denied');
            };
          } catch {
            setCameraPermission('prompt');
          }
        }

        // Now request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
        
        setCameraPermission('granted');
        
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());
        
        setCheckingPermission(false);
        
      } catch (err: unknown) {
        const errorName = err instanceof Error ? err.name : '';
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setError('Camera permission was denied. Please allow camera access to use PosturePal.');
          setCameraPermission('denied');
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          setError('No camera found. Please connect a camera to use PosturePal.');
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          setError('Camera is already in use by another application. Please close other apps using the camera.');
        } else {
          setError(`Camera error: ${errorMessage}`);
        }
        
        setCheckingPermission(false);
        setLoading(false);
      }
    };

    checkCameraPermission();
  }, []);

  // Fetch LiveKit token only after camera permission is granted
  useEffect(() => {
    if (cameraPermission !== 'granted' || checkingPermission) {
      return;
    }

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
        
      } catch {
        setError('Failed to connect to LiveKit. Please check your configuration.');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [cameraPermission, checkingPermission, roomName, participantName]);

  // Show camera permission checking
  if (checkingPermission) {
    return (
      <div className="max-w-4xl mx-auto" role="status" aria-live="polite" aria-busy="true">
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50 ring-1 ring-slate-900/5">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-orange-50/50" aria-hidden="true"></div>

          <div className="relative flex items-center justify-center h-96 px-8">
            <div className="text-center max-w-md">
              <div className="relative mb-8" aria-hidden="true">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full motion-safe:animate-ping"></div>
                </div>
                <div className="relative w-28 h-28 bg-gradient-to-br from-purple-700 via-pink-700 to-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/40 ring-4 ring-white/50">
                  <svg
                    className="w-14 h-14 text-white motion-safe:animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-purple-950 mb-4">
                Requesting Camera Access
              </h2>
              <p className="text-slate-700 text-base leading-relaxed mb-6">
                Please allow camera access when prompted by your browser
              </p>

              <div className="flex items-center justify-center space-x-2 mb-4" aria-hidden="true">
                <div className="w-2 h-2 bg-purple-700 rounded-full motion-safe:animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-pink-700 rounded-full motion-safe:animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-orange-600 rounded-full motion-safe:animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>

              <div className="mt-8 p-4 bg-purple-50 backdrop-blur-sm rounded-2xl border border-purple-300">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-purple-800 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-purple-950 text-left font-medium">
                    Look for a popup in your browser asking for camera permission. Click <strong>Allow</strong> to continue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show camera permission denied error
  if (cameraPermission === 'denied' || error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-red-700"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-red-50 p-8">
            <div className="flex items-start">
              <svg 
                className="w-8 h-8 text-red-700 mr-4 mt-1 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
                focusable="false"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              <div className="flex-1">
                <h2 className="text-red-900 font-bold mb-3 text-xl">Camera Access Required</h2>
                <p className="text-red-900 mb-4 text-base leading-relaxed">{error || 'Camera permission was denied.'}</p>
                
                {cameraPermission === 'denied' && (
                  <div className="bg-white rounded-lg p-4 mb-4 border border-red-300">
                    <p className="text-sm font-semibold text-gray-900 mb-2">How to enable camera access:</p>
                    <ol className="text-sm text-gray-800 space-y-1 list-decimal list-inside">
                      <li>Click the camera or lock icon in your browser&apos;s address bar</li>
                      <li>Select &quot;Allow&quot; for camera permissions</li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onStop}
                    className="min-h-[44px] min-w-[44px] px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-semibold"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="min-h-[44px] min-w-[44px] px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while fetching LiveKit token
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto" role="status" aria-live="polite" aria-busy="true">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-300">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div
                className="motion-safe:animate-spin rounded-full h-16 w-16 border-b-4 border-purple-700 mx-auto mb-4"
                aria-hidden="true"
              ></div>
              <p className="text-gray-800 text-lg font-medium">Connecting to LiveKit Cloud...</p>
              <p className="text-gray-700 text-sm mt-2">Setting up your posture monitoring session</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !wsUrl) {
    return (
      <div className="max-w-4xl mx-auto" role="status" aria-live="polite">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-amber-700">
          <div className="bg-amber-50 p-8">
            <p className="text-amber-950 font-medium">Waiting for connection details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only render LiveKitRoom after camera permission is granted and token is fetched
  return (
    <LKRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      audio={false}
      video={true}
      onDisconnected={onStop}
    >
      <PosturePalRoom onStopRecording={onStop} />
    </LKRoom>
  );
}
