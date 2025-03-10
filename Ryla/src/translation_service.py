# src/translation_service.py
import aiohttp
import logging
from typing import Optional

class TranslationService:
    """A service for translating text using free translation APIs"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        # LibreTranslate API configuration - a free and open source machine translation API
        self.libre_translate_url = "https://libretranslate.com/translate"
        
        # Fallback to MyMemory API if LibreTranslate fails
        self.mymemory_url = "https://api.mymemory.translated.net/get"

    async def translate_text(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        """
        Translate text from source language to target language
        using free translation APIs with fallback mechanisms.
        
        Args:
            text: Text to translate
            source_lang: Source language code (e.g., 'en', 'fr')
            target_lang: Target language code (e.g., 'en', 'fr')
            
        Returns:
            Translated text or None if translation failed
        """
        if not text or source_lang == target_lang:
            return text
            
        # Standardize language codes
        source_lang = self._normalize_lang_code(source_lang)
        target_lang = self._normalize_lang_code(target_lang)
        
        # Try LibreTranslate first (no API key required for self-hosted instances)
        try:
            translated_text = await self._translate_with_libretranslate(text, source_lang, target_lang)
            if translated_text:
                return translated_text
        except Exception as e:
            self.logger.warning(f"LibreTranslate failed: {str(e)}. Trying fallback...")
            
        # Fallback to MyMemory API (free tier, no API key required)
        try:
            translated_text = await self._translate_with_mymemory(text, source_lang, target_lang)
            if translated_text:
                return translated_text
        except Exception as e:
            self.logger.error(f"Translation fallback failed: {str(e)}")
            
        # Second fallback - simple word-by-word replacement for common phrases
        # This is extremely limited but can serve as a last resort
        if source_lang == "en" and target_lang == "fr" or source_lang == "fr" and target_lang == "en":
            return self._basic_translation_fallback(text, source_lang, target_lang)
            
        return None

    async def _translate_with_libretranslate(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        """Use LibreTranslate API for translation"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "q": text,
                "source": source_lang,
                "target": target_lang,
                "format": "text"
            }
            
            async with session.post(self.libre_translate_url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("translatedText")
                else:
                    error_text = await response.text()
                    self.logger.error(f"LibreTranslate API error: {response.status} - {error_text}")
                    return None

    async def _translate_with_mymemory(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        """Use MyMemory API for translation (free tier)"""
        # MyMemory has a limit of 1000 words per day for free users
        if len(text.split()) > 500:  # Be conservative and limit to 500 words
            text = " ".join(text.split()[:500]) + "..."
            
        lang_pair = f"{source_lang}|{target_lang}"
        
        async with aiohttp.ClientSession() as session:
            params = {
                "q": text,
                "langpair": lang_pair,
                "de": "your-email@example.com"  # Add your email for higher rate limits
            }
            
            async with session.get(self.mymemory_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("responseStatus") == 200:
                        return data.get("responseData", {}).get("translatedText")
                    else:
                        self.logger.error(f"MyMemory API error: {data.get('responseStatus')} - {data.get('responseDetails')}")
                        return None
                else:
                    error_text = await response.text()
                    self.logger.error(f"MyMemory API error: {response.status} - {error_text}")
                    return None

    def _basic_translation_fallback(self, text: str, source_lang: str, target_lang: str) -> str:
        """
        Extremely basic word-for-word translation as a last resort.
        Only supports a few common phrases between English and French.
        """
        # Basic dictionaries for emergency fallback
        en_to_fr = {
            "hello": "bonjour",
            "goodbye": "au revoir",
            "thank you": "merci",
            "please": "s'il vous plaît",
            "yes": "oui",
            "no": "non",
            "how are you": "comment allez-vous",
            "what is your name": "comment vous appelez-vous",
            "I don't understand": "je ne comprends pas",
            "help": "aidez-moi"
        }
        
        fr_to_en = {v: k for k, v in en_to_fr.items()}
        
        # Select the appropriate dictionary
        dictionary = en_to_fr if source_lang == "en" and target_lang == "fr" else fr_to_en
        
        # Very simple word-by-word replacement
        result = text.lower()
        for source_phrase, target_phrase in dictionary.items():
            result = result.replace(source_phrase, target_phrase)
            
        # Return original if no changes were made
        return result if result != text.lower() else text

    def _normalize_lang_code(self, lang_code: str) -> str:
        """
        Normalize language codes to the format expected by the translation APIs.
        Most APIs use ISO 639-1 two-letter codes.
        """
        # Map of common language codes
        lang_map = {
            "english": "en",
            "french": "fr",
            "spanish": "es",
            "german": "de",
            "italian": "it",
            "portuguese": "pt",
            "russian": "ru",
            "chinese": "zh",
            "japanese": "ja",
            "korean": "ko"
        }
        
        # Return the normalized code
        if lang_code.lower() in lang_map:
            return lang_map[lang_code.lower()]
        
        # If already a 2-letter code, return as is
        if len(lang_code) == 2:
            return lang_code.lower()
            
        # Default to English if unrecognized
        return "en"