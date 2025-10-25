# 📦 INSTALL.md — PosturePal Setup Guide

Welcome to **PosturePal**, a real-time posture monitoring web application built with **Next.js**, **React**, and **LiveKit**. This guide will help you set up and run the project locally.

---

## 🚀 Project Overview
PosturePal uses your webcam to capture frame-by-frame images and stream video using LiveKit. It includes:
- **Next.js frontend** with React and Tailwind CSS
- **LiveKit integration** for real-time video streaming
- **Frame capture and upload** to backend
- **Local storage** of captured frames
- **API routes** for token generation, room creation, and frame upload

---

## ✅ Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later recommendedttps://www.npmjs.com/) or [yarnpkg.com/
- A [LiveKit Cloud](httpsoud account

---

## 📥 Clone Repository
```bash
git clone https://github.com/KarthikSubramanian07/posture-detector.git
cd poster-detector

## 📦 Install Dependencies
npm install
# or
yarn install

## 🔐 Configure Environment Variables
Update the file .env.local in the project root:

LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here

Important:

LIVEKIT_API_KEY and LIVEKIT_API_SECRET stay on the server (do NOT expose them).
Only NEXT_PUBLIC_LIVEKIT_URL is exposed to the client.

## ▶️ Run Development Server
npm run dev

## 🔗 API Routes Summary
GET /api/token → Generate LiveKit token
POST /api/create-room → Create a LiveKit room
GET /api/rooms → List active rooms
POST /api/upload-frame → Upload captured frame

## 🛠 Troubleshooting
Camera not detected? Ensure browser permissions are granted.
LiveKit connection issues? Verify your LIVEKIT_URL, API key, and secret.
Frames not saving? Check /storage folder permissions or configure cloud storage.

