/**
 * useAccessibility — manages persistent accessibility preferences.
 * Stored in localStorage. Applied via CSS classes on root element.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AccessibilitySettings, FontSize, Language, SpeakingSpeed } from '@/types';

const STORAGE_KEY = 'accessibility_settings';

const DEFAULTS: AccessibilitySettings = {
  fontSize: 'normal',
  highContrast: false,
  reducedMotion: false,
  speakingSpeed: 'normal',
  language: 'en',
  voiceOnly: false,
};

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings({ ...DEFAULTS, ...JSON.parse(saved) });
      } catch { /* ignore */ }
    }
    setMounted(true);
  }, []);

  const save = useCallback((updated: AccessibilitySettings) => {
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    applyToDOM(updated);
  }, []);

  const setFontSize = useCallback((fontSize: FontSize) => {
    save({ ...settings, fontSize });
  }, [settings, save]);

  const setHighContrast = useCallback((highContrast: boolean) => {
    save({ ...settings, highContrast });
  }, [settings, save]);

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    save({ ...settings, reducedMotion });
  }, [settings, save]);

  const setSpeakingSpeed = useCallback((speakingSpeed: SpeakingSpeed) => {
    save({ ...settings, speakingSpeed });
  }, [settings, save]);

  const setLanguage = useCallback((language: Language) => {
    save({ ...settings, language });
  }, [settings, save]);

  const setVoiceOnly = useCallback((voiceOnly: boolean) => {
    save({ ...settings, voiceOnly });
  }, [settings, save]);

  useEffect(() => {
    if (mounted) applyToDOM(settings);
  }, [mounted, settings]);

  return {
    settings,
    mounted,
    setFontSize,
    setHighContrast,
    setReducedMotion,
    setSpeakingSpeed,
    setLanguage,
    setVoiceOnly,
  };
}

function applyToDOM(settings: AccessibilitySettings) {
  const root = document.documentElement;
  root.classList.remove('font-large', 'font-xlarge', 'high-contrast', 'reduced-motion');

  if (settings.fontSize === 'large') root.classList.add('font-large');
  if (settings.fontSize === 'xlarge') root.classList.add('font-xlarge');
  if (settings.highContrast) root.classList.add('high-contrast');
  if (settings.reducedMotion) root.classList.add('reduced-motion');
}
