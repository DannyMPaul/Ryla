import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
  TextInput
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

// Language options with their codes for LibreTranslate API
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

// LibreTranslate API URL - this should point to your local LibreTranslate instance
// For emulators, localhost or 10.0.2.2 (Android) should work
// For physical devices, use your computer's IP address (e.g., 192.168.1.X)
const LIBRE_TRANSLATE_API_URL = 'http://10.0.2.2:5000'; // For Android emulator
// const LIBRE_TRANSLATE_API_URL = 'http://localhost:5000'; // For iOS simulator
// const LIBRE_TRANSLATE_API_URL = 'http://YOUR_COMPUTER_IP:5000'; // For physical devices

export default function VoiceTranslatorScreen() {
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('fr');
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translations, setTranslations] = useState<{original: string, translated: string}[]>([]);
  const [inputText, setInputText] = useState('');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectingSource, setSelectingSource] = useState(true);
  const [libreTranslateAvailable, setLibreTranslateAvailable] = useState(true);

  useEffect(() => {
    setupAudio();
    checkLibreTranslateAvailability();
  }, []);

  const checkLibreTranslateAvailability = async () => {
    try {
      // Try to connect to LibreTranslate API
      const response = await axios.get(`${LIBRE_TRANSLATE_API_URL}/languages`);
      if (response.status === 200) {
        console.log('LibreTranslate is available');
        setLibreTranslateAvailable(true);
      } else {
        console.warn('LibreTranslate returned unexpected status:', response.status);
        setLibreTranslateAvailable(false);
      }
    } catch (error) {
      console.error('LibreTranslate is not available:', error);
      setLibreTranslateAvailable(false);
      Alert.alert(
        'Translation Service Unavailable',
        'The translation service is currently unavailable. Falling back to offline mode with limited translations.',
        [{ text: 'OK' }]
      );
    }
  };

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    
    if (uri) {
      processAudio(uri);
    }
  };

  const processAudio = async (audioUri: string) => {
    setIsTranslating(true);
    
    try {
      // In a real implementation, you would upload the audio to a Speech-to-Text service
      // For now, we'll use a simulated recognition for demo purposes
      const recognizedText = await recognizeSpeech(audioUri);
      setOriginalText(recognizedText);
      
      // Translate the recognized text
      const translated = await translateText(recognizedText, sourceLanguage, targetLanguage);
      setTranslatedText(translated);
      
      // Add to history
      setTranslations(prev => [
        { original: recognizedText, translated },
        ...prev.slice(0, 9) // Keep only last 10 translations
      ]);
      
      // Speak the translation
      Speech.speak(translated, {
        language: targetLanguage,
        rate: 0.8,
      });
    } catch (error) {
      console.error('Error processing audio:', error);
      Alert.alert('Translation Error', 'Failed to process your speech. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const recognizeSpeech = async (audioUri: string): Promise<string> => {
    // In a real app, you would upload the audio file to a Speech-to-Text service
    // For demo purposes, we'll simulate recognition with predefined phrases
    return new Promise((resolve) => {
      setTimeout(() => {
        const phrases = {
          'en': [
            "Hello, how are you today?",
            "I would like to order food please",
            "Where is the nearest train station?",
            "What time is it?",
            "Can you help me find my hotel?"
          ],
          'fr': [
            "Bonjour, comment allez-vous aujourd'hui?",
            "Je voudrais commander à manger s'il vous plaît",
            "Où est la gare la plus proche?",
            "Quelle heure est-il?",
            "Pouvez-vous m'aider à trouver mon hôtel?"
          ],
          'es': [
            "Hola, ¿cómo estás hoy?",
            "Me gustaría pedir comida por favor",
            "¿Dónde está la estación de tren más cercana?",
            "¿Qué hora es?",
            "¿Puedes ayudarme a encontrar mi hotel?"
          ]
        };
        
        const defaultPhrases = phrases['en'];
        const languagePhrases = phrases[sourceLanguage as keyof typeof phrases] || defaultPhrases;
        resolve(languagePhrases[Math.floor(Math.random() * languagePhrases.length)]);
      }, 1000);
    });
  };

  const translateText = async (text: string, from: string, to: string): Promise<string> => {
    if (!libreTranslateAvailable) {
      return fallbackTranslation(text, from, to);
    }

    try {
      // Use LibreTranslate API
      const response = await axios.post(`${LIBRE_TRANSLATE_API_URL}/translate`, {
        q: text,
        source: from,
        target: to,
        format: 'text'
      });
      
      if (response.data && response.data.translatedText) {
        return response.data.translatedText;
      } else {
        throw new Error('Invalid response from LibreTranslate API');
      }
    } catch (error) {
      console.error('LibreTranslate API error:', error);
      
      // Fallback to our dictionary for demo purposes
      return fallbackTranslation(text, from, to);
    }
  };

  const fallbackTranslation = (text: string, from: string, to: string): string => {
    // Simple translation dictionary for fallback
    const translations: Record<string, Record<string, string>> = {
      'en': {
        'fr': {
          "Hello, how are you today?": "Bonjour, comment allez-vous aujourd'hui?",
          "I would like to order food please": "Je voudrais commander à manger s'il vous plaît",
          "Where is the nearest train station?": "Où est la gare la plus proche?",
          "What time is it?": "Quelle heure est-il?",
          "Can you help me find my hotel?": "Pouvez-vous m'aider à trouver mon hôtel?"
        },
        'es': {
          "Hello, how are you today?": "Hola, ¿cómo estás hoy?",
          "I would like to order food please": "Me gustaría pedir comida por favor",
          "Where is the nearest train station?": "¿Dónde está la estación de tren más cercana?",
          "What time is it?": "¿Qué hora es?",
          "Can you help me find my hotel?": "¿Puedes ayudarme a encontrar mi hotel?"
        }
      },
      'fr': {
        'en': {
          "Bonjour, comment allez-vous aujourd'hui?": "Hello, how are you today?",
          "Je voudrais commander à manger s'il vous plaît": "I would like to order food please",
          "Où est la gare la plus proche?": "Where is the nearest train station?",
          "Quelle heure est-il?": "What time is it?",
          "Pouvez-vous m'aider à trouver mon hôtel?": "Can you help me find my hotel?"
        }
      },
      'es': {
        'en': {
          "Hola, ¿cómo estás hoy?": "Hello, how are you today?",
          "Me gustaría pedir comida por favor": "I would like to order food please",
          "¿Dónde está la estación de tren más cercana?": "Where is the nearest train station?",
          "¿Qué hora es?": "What time is it?",
          "¿Puedes ayudarme a encontrar mi hotel?": "Can you help me find my hotel?"
        }
      }
    };
    
    // Try to find a direct translation
    if (translations[from]?.[to]?.[text]) {
      return translations[from][to][text];
    }
    
    // If no direct translation, return a placeholder
    return `[Translated from ${LANGUAGES.find(l => l.code === from)?.name} to ${LANGUAGES.find(l => l.code === to)?.name}]: ${text}`;
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  };

  const handleTextInput = async () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    setOriginalText(inputText);
    
    try {
      // Translate the input text
      const translated = await translateText(inputText, sourceLanguage, targetLanguage);
      setTranslatedText(translated);
      
      // Add to history
      setTranslations(prev => [
        { original: inputText, translated },
        ...prev.slice(0, 9)
      ]);
      
      // Speak the translation
      Speech.speak(translated, {
        language: targetLanguage,
        rate: 0.8,
      });
      
      // Clear input
      setInputText('');
    } catch (error) {
      console.error('Translation error:', error);
      Alert.alert('Translation Error', 'Failed to translate your text. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const selectLanguage = (code: string) => {
    if (selectingSource) {
      setSourceLanguage(code);
    } else {
      setTargetLanguage(code);
    }
    setShowLanguageSelector(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Real-Time Translator</Text>
          <View style={styles.placeholder} />
        </View>

        {!libreTranslateAvailable && (
          <View style={styles.offlineNotice}>
            <Feather name="wifi-off" size={16} color="#fff" />
            <Text style={styles.offlineText}>Offline Mode - Limited Translations</Text>
          </View>
        )}

        <View style={styles.languageSelector}>
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={() => {
              setSelectingSource(true);
              setShowLanguageSelector(true);
            }}
          >
            <Text style={styles.languageButtonText}>
              {LANGUAGES.find(l => l.code === sourceLanguage)?.name || 'Source'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={swapLanguages} style={styles.swapButton}>
            <Feather name="repeat" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={() => {
              setSelectingSource(false);
              setShowLanguageSelector(true);
            }}
          >
            <Text style={styles.languageButtonText}>
              {LANGUAGES.find(l => l.code === targetLanguage)?.name || 'Target'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.translationContainer}>
          {isTranslating ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              {originalText ? (
                <View style={styles.textContainer}>
                  <Text style={styles.originalText}>{originalText}</Text>
                  <View style={styles.divider} />
                  <Text style={styles.translatedText}>{translatedText}</Text>
                </View>
              ) : (
                <Text style={styles.placeholderText}>
                  Tap the microphone button and speak to translate or type below
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Type in ${LANGUAGES.find(l => l.code === sourceLanguage)?.name}...`}
            placeholderTextColor="rgba(255,255,255,0.6)"
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleTextInput}
            disabled={!inputText.trim() || isTranslating}
          >
            <Feather name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.recordingActive]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          disabled={isTranslating}
        >
          <Feather name="mic" size={32} color="#fff" />
        </TouchableOpacity>

        {translations.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Translations</Text>
            <ScrollView style={styles.historyList}>
              {translations.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyOriginal}>{item.original}</Text>
                  <Text style={styles.historyTranslated}>{item.translated}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Language selector modal */}
        {showLanguageSelector && (
          <View style={styles.languageSelectorModal}>
            <View style={styles.languageSelectorContent}>
              <View style={styles.languageSelectorHeader}>
                <Text style={styles.languageSelectorTitle}>
                  Select {selectingSource ? 'Source' : 'Target'} Language
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowLanguageSelector(false)}
                >
                  <Feather name="x" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.languageList}>
                {LANGUAGES.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={styles.languageOption}
                    onPress={() => selectLanguage(language.code)}
                  >
                    <Text style={styles.languageOptionText}>{language.name}</Text>
                    {((selectingSource && sourceLanguage === language.code) || 
                      (!selectingSource && targetLanguage === language.code)) && (
                      <Feather name="check" size={20} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    paddingVertical: 6,
    marginHorizontal: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  offlineText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  languageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  languageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  swapButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  translationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  textContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  originalText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  translatedText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    marginRight: 10,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    backgroundColor: '#3b82f6',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recordingActive: {
    backgroundColor: '#ef4444',
    transform: [{ scale: 1.1 }],
  },
  historyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: 200,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  historyList: {
    maxHeight: 150,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  historyOriginal: {
    fontSize: 14,
    color: '#666',
  },
  historyTranslated: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  languageSelectorModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  languageSelectorContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '70%',
    padding: 20,
  },
  languageSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  languageSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#333',
  },
}); 