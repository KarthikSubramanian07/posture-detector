# posture-detector

## Desk Potato

### Overview
Desk Potato helps you maintain healthy posture and reduce eye strain while working at your computer. Using your webcam, it tracks the position and angle of your face, neck, and chest in real time and alerts you when your posture starts to slip. It’s designed to make long screen hours healthier and more productive.

### What It Does
- Monitors posture using a standard webcam (no extra sensors required)  
- Detects neck tilt, face angle, and distance from the screen  
- Calculates eye strain and neck strain levels  
- Provides audio alerts when posture is incorrect  
- Tracks posture metrics locally over time  

### How It Works
Desk Potato uses computer vision and AI models to analyze posture:  
- **Depth Anything v2** – a large vision transformer trained on 62 million depth images for real-time depth segmentation  
- **Facial segmentation models** – identify and map facial and body planes to calculate roll and pitch  
- **Letta AI** and **ElevenLabs** – generate and voice personalized posture alerts  
- **LiveKit** – enables low-latency webcam streaming and real-time analysis  
