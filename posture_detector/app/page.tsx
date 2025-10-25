'use client';

import { useState } from 'react';
import PosturePalRecorder from '@/components/PosturePalRecorder';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50/40 to-orange-50/30 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-tr from-orange-400/20 to-rose-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-gradient-to-tl from-fuchsia-400/20 to-violet-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/70 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 ring-2 ring-white/50">
                <span className="text-white text-xl font-bold tracking-tight">PP</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-900 via-pink-900 to-orange-900 bg-clip-text text-transparent">
                  PosturePal
                </h1>
                <p className="text-xs text-slate-500 font-medium">Professional Posture Monitoring</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full border border-purple-200/50">
              <span className="text-sm font-semibold text-purple-900">Cal Hacks 2025</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-bold bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 bg-clip-text text-transparent mb-6 leading-tight">
            Real-Time Posture Coach
          </h2>
          <p className="text-2xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
            Sit smarter. Move better. <span className="font-semibold text-pink-700">Stay healthier.</span>
          </p>
        </div>

        {/* Main Content */}
        {!isRecording ? (
          /* Landing View */
          <div className="max-w-5xl mx-auto">
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50 ring-1 ring-slate-900/5">
              {/* Preview Image */}
              <div className="relative bg-gradient-to-br from-purple-950 via-pink-950 to-orange-950 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                  }}></div>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                  <div className="w-28 h-28 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/10 ring-1 ring-purple-400/20">
                    <svg
                      className="w-14 h-14 text-purple-100"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-white text-3xl font-bold mb-3 tracking-tight">
                    Ready to Improve Your Posture?
                  </h3>
                  <p className="text-purple-200 text-base font-medium">
                    Click below to start real-time posture monitoring
                  </p>
                </div>

                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Start Button */}
              <div className="p-10 bg-gradient-to-br from-purple-50 to-pink-50/50">
                <button
                  onClick={handleStartRecording}
                  className="w-full group relative px-8 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center space-x-3">
                    <svg
                      className="w-7 h-7 group-hover:scale-110 transition-transform duration-300"
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
                    <span className="tracking-wide">Start Posture Monitoring</span>
                  </span>
                </button>

                <div className="flex items-center justify-center mt-6 space-x-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm text-slate-500 font-medium">
                    We'll need access to your camera for real-time analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="group relative bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 hover:shadow-2xl hover:border-purple-200/50 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Real-Time Monitoring
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Track your posture continuously with live camera feed analysis powered by advanced AI
                  </p>
                </div>
              </div>

              <div className="group relative bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 hover:shadow-2xl hover:border-pink-200/50 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Smart Alerts
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Get notified instantly when your posture needs adjustment to prevent strain
                  </p>
                </div>
              </div>

              <div className="group relative bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 hover:shadow-2xl hover:border-orange-200/50 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Frame Capture
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Automatic frame-by-frame capture for detailed posture analysis and insights
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Recording View */
          <PosturePalRecorder onStop={handleStopRecording} />
        )}
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-white/80 to-purple-50/80 backdrop-blur-sm border-t border-white/50 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <p className="text-slate-900 font-bold text-lg mb-2 bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">
                Built at Cal Hacks 2025
              </p>
              <p className="text-sm text-slate-600 font-medium">
                Empowering better health through technology
              </p>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-sm text-slate-500">
                Team: <span className="text-slate-800 font-semibold">[Your Names]</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/50 text-center">
            <p className="text-xs text-slate-500">
              Designed with care for your wellbeing
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}