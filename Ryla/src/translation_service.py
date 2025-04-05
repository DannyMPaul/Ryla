from typing import Optional, Dict, Any
import logging
import aiohttp
import os
from datetime import datetime
import traceback
import urllib.parse

class TranslationService:
    """
    Service for handling text translations using only the MyMemory API
    """

    def __init__(self):
        self.mymemory_url = "https://api.mymemory.translated.net/get"
        self.mymemory_email = os.getenv("MYMEMORY_EMAIL", "")
        
        logging.info(f"Translation service initialized with MyMemory API")
    
    async def translate_text(
        self, 
        text: str, 
        source_lang: str, 
        target_lang: str, 
        retry_count: int = 0
    ) -> Optional[str]:
        """
        Translate text using the MyMemory API
        
        Args:
            text: Text to translate
            source_lang: Source language code (e.g., 'en')
            target_lang: Target language code (e.g., 'fr')
            retry_count: Internal counter for retry attempts
            
        Returns:
            Translated text or original text if translation fails
        """
        if source_lang == target_lang or not text.strip():
            return text
            
        if retry_count >= 2:
            logging.warning(f"Max retries reached for translation request")
            return text
        
        try:
            translated = await self._translate_with_mymemory(text, source_lang, target_lang)
            if translated:
                return translated
            
            logging.warning(f"MyMemory translation failed, returning original text")
            return text
            
        except Exception as e:
            error_id = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            logging.error(f"Translation error ID: {error_id}\n{str(e)}\n{traceback.format_exc()}")
            
            if retry_count < 1:
                logging.info(f"Retrying translation after error")
                return await self.translate_text(text, source_lang, target_lang, retry_count + 1)
            
            return text
    
    async def _translate_with_mymemory(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        try:
            lang_pair = f"{source_lang}|{target_lang}"
            
            params = {
                "q": text,
                "langpair": lang_pair
            }
            
            if self.mymemory_email:
                params["de"] = self.mymemory_email
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.mymemory_url,
                    params=params,
                    timeout=10
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data and "responseData" in data and "translatedText" in data["responseData"]:
                            translated_text = data["responseData"]["translatedText"]
                            
                            if "match" in data["responseData"]:
                                match_quality = data["responseData"]["match"]
                                logging.info(f"MyMemory translation match quality: {match_quality}")
                            
                            return translated_text
                        else:
                            logging.warning(f"MyMemory API returned unexpected data structure: {data}")
                    else:
                        error_response = await response.text()
                        logging.error(f"MyMemory API error: {response.status} - {error_response}")
                        
            return None
            
        except aiohttp.ClientError as e:
            logging.error(f"MyMemory request error: {str(e)}")
            return None
        except Exception as e:
            logging.error(f"MyMemory unexpected error: {str(e)}")
            return None