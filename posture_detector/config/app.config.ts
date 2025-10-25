/**
 * PosturePal Application Configuration
 *
 * This file contains all configurable parameters for the application.
 * Update these values to customize behavior without modifying component code.
 */

export const AppConfig = {
  // Recording Settings
  recording: {
    fps: 5, // Frames per second for capture
    maxSessionDuration: 7200, // Maximum session duration in seconds (2 hours)
    autoSaveInterval: 30, // Auto-save interval in seconds
  },

  // Upload Settings
  upload: {
    retryAttempts: 3, // Number of retry attempts for failed uploads
    retryDelay: 1000, // Delay between retries in milliseconds
    batchSize: 10, // Number of frames to batch upload
    quality: 0.8, // JPEG quality (0.0 - 1.0)
  },

  // UI Settings
  ui: {
    theme: {
      primary: 'purple', // Primary color theme
      secondary: 'pink',
      accent: 'orange',
    },
    animations: {
      enabled: true,
      duration: 300, // Animation duration in milliseconds
    },
    notifications: {
      enabled: true,
      milestones: [5, 10, 15, 20, 30, 45, 60], // Milestone minutes for notifications
    },
  },

  // Camera Settings
  camera: {
    preferredResolution: {
      width: 1280,
      height: 720,
    },
    facingMode: 'user', // 'user' for front camera, 'environment' for back
    permissions: {
      retryOnDenied: false,
      showHelpOnDenied: true,
    },
  },

  // Session Settings
  session: {
    idPrefix: 'posturepal',
    storageLocation: 'storage/sessions',
    cleanupOldSessions: true,
    maxSessionAge: 7, // Days to keep sessions
  },

  // Feature Flags
  features: {
    pauseResume: true,
    milestoneNotifications: true,
    framePreview: false,
    exportData: false,
    postureAnalysis: false, // Coming soon feature
    realTimeAlerts: false, // Coming soon feature
  },

  // API Endpoints (can be overridden by environment variables)
  api: {
    uploadFrameEndpoint: '/api/upload-frame',
    tokenEndpoint: '/api/token',
    liveKitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || '',
  },

  // Performance Settings
  performance: {
    enableDebugLogs: process.env.NODE_ENV === 'development',
    enablePerformanceMonitoring: false,
    maxFrameQueueSize: 50, // Maximum frames to queue before dropping
  },

  // Branding
  branding: {
    appName: 'PosturePal',
    tagline: 'Real-Time Posture Coach',
    eventName: 'Cal Hacks 2025'
  },
} as const;

// Type-safe config access
export type AppConfigType = typeof AppConfig;

// Helper function to get config values
export function getConfig<K extends keyof AppConfigType>(key: K): AppConfigType[K] {
  return AppConfig[key];
}

// Helper to check if a feature is enabled
export function isFeatureEnabled(feature: keyof typeof AppConfig.features): boolean {
  return AppConfig.features[feature];
}
