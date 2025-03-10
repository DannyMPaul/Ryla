# Real-Time Voice Translator

This feature provides real-time voice and text translation across multiple languages using LibreTranslate, an open-source translation API.

## How to Use

1. **Access the Translator**: Click on the blue translator button at the bottom of any screen in the app.

2. **Select Languages**:
   - Tap on either language button to open the language selector
   - Choose your source language (the language you'll speak or type in)
   - Choose your target language (the language you want to translate to)
   - Use the swap button to quickly switch between languages

3. **Voice Translation**:
   - Press and hold the microphone button
   - Speak clearly in the source language
   - Release the button when finished
   - The app will process your speech, translate it, and speak the translation

4. **Text Translation**:
   - Type your text in the input field at the bottom
   - Tap the send button
   - The app will translate your text and speak the translation

5. **View Translations**:
   - Your original text appears at the top of the translation box
   - The translated text appears below
   - Recent translations are saved in the history section

## Supported Languages

- English
- French
- Spanish
- German
- Italian
- Japanese
- Chinese
- Russian
- Arabic
- Hindi

## Technical Implementation

The translator uses LibreTranslate for accurate, real-time translations. The implementation includes:

- Speech-to-text conversion for voice input
- Text-to-text translation via LibreTranslate API
- Text-to-speech output of translations
- Fallback translation dictionary for offline use
- Translation history storage
- Automatic detection of LibreTranslate availability

## LibreTranslate Integration

To use the real-time translation feature with LibreTranslate:

1. Make sure the LibreTranslate server is running
2. By default, the app connects to LibreTranslate at http://localhost:5000
3. If you're running LibreTranslate on a different URL, update the `LIBRE_TRANSLATE_API_URL` constant in the code
4. The app will automatically detect if LibreTranslate is available and fall back to offline mode if necessary

## Offline Mode

If LibreTranslate is unavailable, the app will automatically switch to offline mode with a limited set of predefined translations. A notification will appear at the top of the screen to indicate that you're in offline mode.

## Troubleshooting

If you encounter issues:
- Ensure your microphone permissions are enabled
- Check that the LibreTranslate server is running and accessible
- Verify the LibreTranslate URL is correctly configured
- For best results, speak clearly and at a moderate pace 