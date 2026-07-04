// API Configuration
const isDev = import.meta.env.DEV;

export const API_BASE_URL = isDev 
  ? 'http://localhost:8000'
  : import.meta.env.VITE_API_URL || 'https://your-api.com';

export const WS_URL = isDev
  ? 'ws://localhost:8000'
  : import.meta.env.VITE_WS_URL || 'wss://your-api.com';

// API Endpoints
export const ENDPOINTS = {
  // Health
  health: `${API_BASE_URL}/health`,
  status: `${API_BASE_URL}/status`,
  
  // Matches
  matches: `${API_BASE_URL}/matches`,
  match: (id: number) => `${API_BASE_URL}/match/${id}`,
  matchStats: (id: number) => `${API_BASE_URL}/match/${id}/stats`,
  matchPossession: (id: number) => `${API_BASE_URL}/match/${id}/possession`,
  matchEvents: (id: number) => `${API_BASE_URL}/match/${id}/events`,
  
  // Analytics
  sentiments: (id: number) => `${API_BASE_URL}/match/${id}/sentiment`,
  predictions: (id: number) => `${API_BASE_URL}/match/${id}/predictions`,
  sentiment: {
    analyze: `${API_BASE_URL}/sentiment/analyze`,
  },
  
  // Leaderboards
  leaderboards: `${API_BASE_URL}/leaderboards`,
  standings: `${API_BASE_URL}/standings`,
  
  // Cache
  cache: {
    stats: `${API_BASE_URL}/cache/stats`,
    clearMatch: (id: number) => `${API_BASE_URL}/cache/match/${id}`,
  },
} as const;

// WebSocket Endpoints
export const WS_ENDPOINTS = {
  match: (id: number) => `${WS_URL}/ws/match/${id}`,
  sentiment: (id: number) => `${WS_URL}/ws/sentiment/${id}`,
} as const;

// Default timeout for requests
export const REQUEST_TIMEOUT = 10000; // 10 seconds

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504],
} as const;
