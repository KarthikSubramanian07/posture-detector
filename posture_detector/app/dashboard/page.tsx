"use client";
import React from "react";

export default function DashboardPage() {
  const openFlaskDashboard = () => {
    window.open("http://127.0.0.1:5000", "_blank"); // 打开 Flask 仪表板
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-600 bg-clip-text text-transparent mb-8">
        PosturePal Dashboard
      </h1>

      <p className="text-slate-600 mb-10 text-center max-w-md">
        View your posture logs, accuracy, and real-time analytics powered by Flask.
      </p>

      <button
        onClick={openFlaskDashboard}
        className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-transform hover:-translate-y-0.5"
      >
        Open Flask Dashboard →
      </button>

      <p className="text-sm text-slate-400 mt-6">
        Make sure Flask is running on port 5000 before clicking the button.
      </p>
    </main>
  );
}
