/**
 * Shared code between client and server
 * Types and small utilities shared across the app
 */

// Basic IDs
export type ID = string;

// User and Auth
export interface UserProfile {
  id: ID;
  name: string;
  email: string;
  phone?: string;
  createdAt: string; // ISO
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string; // mock token
}

// Books and Library
export type ReadingStatus = "not_started" | "reading" | "completed" | "paused";

export interface Book {
  id: ID;
  title: string;
  author: string;
  genre: string;
  coverUrl?: string;
  status: ReadingStatus;
  currentPage?: number;
  totalPages?: number;
  lastUpdatedAt: string; // ISO
}

export interface Review {
  id: ID;
  bookId: ID;
  userId: ID;
  rating?: number; // 1..5 optional
  content: string;
  isPublic: boolean;
  createdAt: string; // ISO
}

export interface Recommendation {
  id: ID;
  title: string;
  author: string;
  genre: string;
  coverUrl?: string;
}

export interface LibrarySummary {
  totalBooks: number;
  reading: number;
  completed: number;
  wishlistCount: number;
  overallProgressPct: number; // 0..100
}

// Dashboard payload
export interface DashboardData {
  summary: LibrarySummary;
  suggestions: Recommendation[];
  recentBooks: Book[];
}

/** Example response type for /api/demo */
export interface DemoResponse {
  message: string;
}
