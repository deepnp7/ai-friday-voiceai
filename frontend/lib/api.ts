/**
 * API client for the FastAPI backend.
 * Handles auth headers, base URL, and typed responses.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  preferred_lang: string;
  speaking_speed: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  name: string;
  role: string;
}

export interface StartSessionResponse {
  session_id: string;
  greeting: string;
  voice_tag: string;
}

export interface ChatResponse {
  response: string;
  voice_tag: string;
  skill: string | null;
  step: number;
  total_steps: number;
  awaiting_confirmation: boolean;
  simplified_mode: boolean;
  confusion_score: number;
  execution_result: Record<string, unknown> | null;
  session_id: string;
}

export interface DashboardMetrics {
  total_sessions: number;
  total_messages: number;
  completed_sessions: number;
  confusion_events: number;
  skills_used: Record<string, number>;
  avg_steps_per_session: number;
  languages_used: Record<string, number>;
}

export interface SkillInfo {
  name: string;
  display_name: string;
  description: string;
  icon: string;
  step_count: number;
}

export interface SessionHistory {
  session_id: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  started_at: string;
  skill: string | null;
  completed: boolean;
}

// ── Auth storage ───────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setToken(token: string): void {
  localStorage.setItem('access_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

// ── Core fetch helper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth API ───────────────────────────────────────────────────────────────

export async function register(name: string, email: string, password: string, role = 'teacher'): Promise<TokenResponse> {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  }, false);
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const formData = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function getMe(): Promise<User> {
  return apiFetch('/auth/me');
}

// ── Conversation API ───────────────────────────────────────────────────────

export async function startSession(language = 'en', speaking_speed = 'normal'): Promise<StartSessionResponse> {
  return apiFetch('/conversation/start', {
    method: 'POST',
    body: JSON.stringify({ language, speaking_speed }),
  });
}

export async function sendChat(session_id: string, text: string): Promise<ChatResponse> {
  return apiFetch('/conversation/chat', {
    method: 'POST',
    body: JSON.stringify({ session_id, text }),
  });
}

export async function endSession(session_id: string): Promise<void> {
  return apiFetch(`/conversation/end/${session_id}`, { method: 'POST' });
}

export async function getHistory(): Promise<SessionHistory[]> {
  return apiFetch('/conversation/history');
}

// ── Analytics API ──────────────────────────────────────────────────────────

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return apiFetch('/analytics/dashboard');
}

export async function getAttendanceSummary(): Promise<unknown[]> {
  return apiFetch('/analytics/attendance');
}

// ── Skills API ─────────────────────────────────────────────────────────────

export async function getSkills(): Promise<SkillInfo[]> {
  return apiFetch('/skills', {}, false);
}

// ── Health ─────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string; version: string }> {
  return apiFetch('/health', {}, false);
}
