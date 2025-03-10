from typing import Optional, Dict, Any
import logging
import aiohttp
import os
from datetime import datetime
import traceback

class TranslationService:
    """
    Service for handling text translations with multiple fallback strategies
    """
    
    def __init__(self):
        self.libre_translate_url = os.getenv("LIBRE_TRANSLATE_URL", "https://libretranslate.com/translate")
        self.libre_translate_api_key = os.getenv("LIBRE_TRANSLATE_API_KEY", "")
        
        # If using other translation services, configure them here
        self.use_fallback_methods = True
        
        logging.info(f"Translation service initialized with URL: {self.libre_translate_url}")
    
    async def translate_text(
        self, 
        text: str, 
        source_lang: str, 
        target_lang: str, 
        retry_count: int = 0
    ) -> Optional[str]:
        """
        Translate text with cascading fallback options:
        1. Try LibreTranslate API
        2. If that fails, try fallback methods
        3. If all translation attempts fail, return original text with a log
        
        Args:
            text: Text to translate
            source_lang: Source language code (e.g., 'en')
            target_lang: Target language code (e.g., 'fr')
            retry_count: Internal counter for retry attempts
            
        Returns:
            Translated text or None if all translation methods fail
        """
        # Don't translate if languages are the same or text is empty
        if source_lang == target_lang or not text.strip():
            return text
            
        # Limit retries to prevent infinite loops
        if retry_count >= 3:
            logging.warning(f"Max retries reached for translation request")
            return text
        
        try:
            # Try primary translation service (LibreTranslate)
            translated = await self._try_libre_translate(text, source_lang, target_lang)
            if translated:
                return translated
                
            # If primary fails and fallbacks are enabled, try alternatives
            if self.use_fallback_methods:
                # Attempt dictionary-based translation for common phrases if appropriate
                fallback_translated = self._simple_fallback_translation(text, source_lang, target_lang)
                if fallback_translated:
                    logging.info(f"Used fallback translation method")
                    return fallback_translated
            
            # If all methods fail, return original text
            logging.warning(f"All translation methods failed, returning original text")
            return text
            
        except Exception as e:
            error_id = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            logging.error(f"Translation error ID: {error_id}\n{str(e)}\n{traceback.format_exc()}")
            
            # On exception, try fallback or return original
            if self.use_fallback_methods and retry_count < 2:
                logging.info(f"Retrying with fallback method after error")
                return await self.translate_text(text, source_lang, target_lang, retry_count + 1)
            
            return text
    
    async def _try_libre_translate(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        """Attempt translation using LibreTranslate API"""
        try:
            # Prepare request data
            payload = {
                "q": text,
                "source": source_lang,
                "target": target_lang,
                "format": "text"
            }
            
            # Add API key if available
            if self.libre_translate_api_key:
                payload["api_key"] = self.libre_translate_api_key
                
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.libre_translate_url, 
                    json=payload,
                    timeout=10
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        if "translatedText" in data:
                            return data["translatedText"]
                    else:
                        error_response = await response.text()
                        logging.error(f"LibreTranslate API error: {response.status} - {error_response}")
                        
            return None
            
        except aiohttp.ClientError as e:
            logging.error(f"LibreTranslate request error: {str(e)}")
            return None
        except Exception as e:
            logging.error(f"LibreTranslate unexpected error: {str(e)}")
            return None
    
    def _simple_fallback_translation(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        """
        Very simple fallback for critical phrases when all else fails.
        In a production app, this would be more comprehensive or use an offline model.
        """
        # Only implement for critical language pairs
        if source_lang == "en" and target_lang == "fr":
            common_phrases = {
                "Hello": "Bonjour",
                "Welcome": "Bienvenue",
                "Sorry": "Désolé",
                "Please try again": "Veuillez réessayer",
                "Error": "Erreur",
                "Thank you": "Merci"
            }
            
            # Only use for exact matches of critical phrases
            if text in common_phrases:
                return common_phrases[text]
                
        # Add other language pairs as needed
        
        return None