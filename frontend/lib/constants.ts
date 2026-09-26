// Shared constants and configuration

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
] as const;

export const SPEAKING_SPEEDS = [
  { value: 'slow', label: 'Slow', rate: 0.7 },
  { value: 'normal', label: 'Normal', rate: 1.0 },
  { value: 'fast', label: 'Fast', rate: 1.3 },
] as const;

export const FONT_SIZES = [
  { value: 'normal', label: 'Normal', class: 'text-base' },
  { value: 'large', label: 'Large', class: 'text-lg' },
  { value: 'xlarge', label: 'Extra Large', class: 'text-xl' },
] as const;

export const SKILL_ICONS: Record<string, string> = {
  attendance: '✅',
  marks_entry: '📝',
  homework: '📚',
  schedule_reminder: '🔔',
  lesson_plan: '📖',
  quiz: '🧠',
  homework_help: '🙋',
  student_lookup: '🔍',
  voice_note: '🎤',
  class_summary: '📊',
};

export const CONFUSION_PHRASES = [
  "I didn't quite get that.",
  "Could you say that again?",
  "I'm here to help. Please repeat slowly.",
  "Take your time. Say it again when ready.",
];

export const ROLES = {
  teacher: { label: 'Teacher', icon: '👩‍🏫', color: 'from-violet-600 to-indigo-600' },
  student: { label: 'Student', icon: '🎓', color: 'from-emerald-600 to-teal-600' },
  admin: { label: 'Admin', icon: '🏛️', color: 'from-amber-600 to-orange-600' },
} as const;
