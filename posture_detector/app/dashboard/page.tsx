"use client";
import React from "react";
import Link from "next/link";

export default function DashboardPage() {
  const openFlaskDashboard = () => {
    window.open("http://127.0.0.1:3500", "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="w-full px-4 py-4">
        <nav aria-label="Primary" className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center min-h-[44px] text-purple-900 font-semibold underline-offset-2 hover:underline"
          >
            ← Back to Desk Potato home
          </Link>
        </nav>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col items-center justify-center px-4 pb-16"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-purple-950 mb-8 text-center">
          PosturePal Dashboard
        </h1>

        <p className="text-slate-800 mb-10 text-center max-w-md">
          View your posture logs, accuracy, and real-time analytics powered by Flask.
        </p>

        <button
          type="button"
          onClick={openFlaskDashboard}
          className="min-h-[48px] px-8 py-4 bg-gradient-to-r from-purple-700 via-pink-700 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-shadow"
        >
          Open Flask Dashboard
          <span className="sr-only"> (opens in a new tab on port 3500)</span>
        </button>
      </main>
    </div>
  );
}
