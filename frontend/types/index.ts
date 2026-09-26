// TypeScript types shared across the frontend

export type Role = 'teacher' | 'student' | 'admin';
export type Language = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'kn' | 'ml' | 'mr';
export type SpeakingSpeed = 'slow' | 'normal' | 'fast';
export type FontSize = 'normal' | 'large' | 'xlarge';
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'confirming' | 'success' | 'error';

export interface AccessibilitySettings {
  fontSize: FontSize;
  highContrast: boolean;
  reducedMotion: boolean;
  speakingSpeed: SpeakingSpeed;
  language: Language;
  voiceOnly: boolean;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
  isConfirmation?: boolean;
  isExecution?: boolean;
}

export interface VoiceSessionState {
  sessionId: string | null;
  voiceState: VoiceState;
  currentSkill: string | null;
  currentStep: number;
  totalSteps: number;
  awaitingConfirmation: boolean;
  simplifiedMode: boolean;
  confusionScore: number;
  lastResponse: string;
  messages: ConversationMessage[];
}

export interface TeacherStats {
  totalClasses: number;
  attendanceRate: number;
  pendingHomework: number;
  upcomingReminders: number;
}

export interface StudentStats {
  quizzesCompleted: number;
  doubtsAsked: number;
  flashcardsReviewed: number;
  streak: number;
}
