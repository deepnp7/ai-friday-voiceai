"""
Language detection utility.
Uses langdetect for transcript language identification,
falling back to English on low confidence.
"""
from __future__ import annotations

try:
    from langdetect import detect, DetectorFactory
    DetectorFactory.seed = 42  # deterministic
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False

# Supported languages
SUPPORTED_LANGUAGES: dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi",
}

# BCP-47 tags for browser SpeechSynthesis
LANG_VOICE_TAGS: dict[str, str] = {
    "en": "en-IN",
    "hi": "hi-IN",
    "bn": "bn-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "mr": "mr-IN",
}

# Confusion signals by language
CONFUSION_SIGNALS: dict[str, list[str]] = {
    "en": ["what", "huh", "confused", "don't understand", "i don't get", "repeat", "again", "sorry", "unclear"],
    "hi": ["kya", "samajh nahi", "phir se", "dobara", "nahi samjha"],
    "bn": ["ki", "bujhini", "abar bolo"],
    "ta": ["enna", "puriyala", "maru murai"],
    "te": ["enti", "artham kaala", "meeru cheppandi"],
    "kn": ["yenu", "artha aagilla", "matte heli"],
    "ml": ["enthu", "manasilaayi", "veedum paro"],
    "mr": ["kay", "samjale nahi", "parat sanga"],
}


def detect_language(text: str) -> str:
    """Detect language from text, return ISO 639-1 code. Defaults to 'en'."""
    if not text or len(text.strip()) < 3:
        return "en"
    if not LANGDETECT_AVAILABLE:
        return "en"
    try:
        detected = detect(text)
        return detected if detected in SUPPORTED_LANGUAGES else "en"
    except Exception:
        return "en"


def is_confusion_signal(text: str, lang: str = "en") -> bool:
    """Check if user text contains confusion signals."""
    text_lower = text.lower()
    signals = CONFUSION_SIGNALS.get(lang, CONFUSION_SIGNALS["en"])
    return any(s in text_lower for s in signals)


def get_voice_tag(lang: str) -> str:
    """Get BCP-47 tag for browser TTS."""
    return LANG_VOICE_TAGS.get(lang, "en-IN")
