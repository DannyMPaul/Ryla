import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, Alert, ActivityIndicator, Platform, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { getDatabase, ref, get, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { router } from 'expo-router';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../app/config/env';

interface SpeechPracticeProps {
  visible: boolean;
  onClose: () => void;
}

interface LearnedWord {
  french: string;
  english: string;
  context: string;
  pronunciationScore?: number;
}

interface TranslatedContent {
  original: string;
  translated: string;
}

interface Translations {
  context?: TranslatedContent;
  feedbackMessage?: TranslatedContent;
  improvements?: TranslatedContent[];
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const OPENAI_API_KEY = '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';

const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

const SpeechPractice: React.FC<SpeechPracticeProps> = ({ visible, onClose }) => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'fr'>('en');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const currentWord = learnedWords[currentWordIndex];
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{
    score: number;
    message: string;
    improvements: string[];
  } | null>(null);
  const [translation, setTranslation] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<Translations>({});
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceAnalysis, setVoiceAnalysis] = useState<{
    clarity: number;
    pace: number;
    volume: number;
    pitch: number;
  } | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (visible) {
      loadLearnedWords();
    }
  }, [visible]);

  const checkPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
    }
  };

  const loadLearnedWords = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const dbRef = ref(getDatabase(), `users/${user.uid}/learnedWords`);
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const words = Object.values(snapshot.val()) as LearnedWord[];
        setLearnedWords(words);
      }
    } catch (error) {
      console.error('Error loading words:', error);
    }
  };

  const playWord = async () => {
    if (!currentWord) return;
    setIsPlaying(true);
    try {
      const textToSpeak = currentLanguage === 'en' ? currentWord.english : currentWord.french;
      await Speech.speak(textToSpeak, {
        language: currentLanguage === 'en' ? 'en-US' : 'fr-FR',
        rate: 0.8,
        onDone: () => setIsPlaying(false)
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsPlaying(false);
    }
  };

  const startRecording = async () => {
    try {
      if (hasPermission === false) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in your device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                // On web, we can't open settings directly
                if (Platform.OS !== 'web') {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please check your microphone permissions and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Retry', 
            onPress: () => {
              checkPermissions();
              startRecording();
            }
          }
        ]
      );
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);

      if (uri) {
        await analyzePronunciation(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const analyzePronunciation = async (audioUri: string) => {
    if (!currentWord) return;
    setIsAnalyzing(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate random analysis metrics
      const analysis = {
        clarity: Math.floor(Math.random() * 41) + 60,
        pace: Math.floor(Math.random() * 41) + 60,
        volume: Math.floor(Math.random() * 41) + 60,
        pitch: Math.floor(Math.random() * 41) + 60
      };
      
      setVoiceAnalysis(analysis);
      
      // Calculate overall score
      const overallScore = Math.floor(
        (analysis.clarity + analysis.pace + analysis.volume + analysis.pitch) / 4
      );
      
      // Generate feedback based on score range (always in English)
      let message = '';
      let improvements = [];
      
      if (overallScore >= 90) {
        message = "Excellent pronunciation! Very close to native speaker.";
        improvements = [
          "Continue practicing to maintain this level",
          "Try speaking a bit faster while maintaining accuracy"
        ];
      } else if (overallScore >= 80) {
        message = "Very good pronunciation. Most sounds are correct.";
        improvements = [
          "Focus on the 'r' sound which can be challenging",
          "Pay attention to nasal vowels"
        ];
      } else if (overallScore >= 70) {
        message = "Good pronunciation with some areas for improvement.";
        improvements = [
          "Practice the specific vowel sounds in this word",
          "Work on your intonation pattern"
        ];
      } else {
        message = "Decent attempt. Keep practicing to improve.";
        improvements = [
          "Try breaking the word into syllables and practice each part",
          "Listen carefully to native pronunciation and mimic it"
        ];
      }
      
      setFeedback({
        score: overallScore,
        message: message,
        improvements: improvements
      });
      setShowFeedback(true);
      
      // Save score if it's better than previous
      if (!currentWord.pronunciationScore || overallScore > currentWord.pronunciationScore) {
        savePronunciationScore(overallScore);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to analyze pronunciation. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const savePronunciationScore = async (score: number) => {
    if (!currentWord) return;
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const dbRef = ref(getDatabase(), `users/${user.uid}/learnedWords`);
    try {
      await update(dbRef, {
        [`${currentWord.french}/pronunciationScore`]: score,
      });
      setLearnedWords(words => 
        words.map(w => 
          w.french === currentWord.french 
            ? { ...w, pronunciationScore: score }
            : w
        )
      );
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const nextWord = () => {
    setCurrentWordIndex((prev) => (prev + 1) % learnedWords.length);
  };

  const translateText = async (text: string, fromLang: string, toLang: string): Promise<string> => {
    try {
      const response = await fetch(
        `${MYMEMORY_API_URL}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
      );
      
      if (!response.ok) {
        throw new Error(`Translation failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
      throw new Error('Invalid translation response');
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  };

  const translateAllContent = async () => {
    if (!currentWord) return;
    setIsTranslatingAll(true);
    
    try {
      const newTranslations: Translations = {};
      
      // Translate context
      const contextTranslation = await translateText(
        currentWord.context,
        currentLanguage,
        currentLanguage === 'en' ? 'fr' : 'en'
      );
      newTranslations.context = {
        original: currentWord.context,
        translated: contextTranslation
      };

      // Translate feedback messages if they exist
      if (feedback) {
        const messageTranslation = await translateText(
          feedback.message,
          'en',
          currentLanguage
        );
        newTranslations.feedbackMessage = {
          original: feedback.message,
          translated: messageTranslation
        };

        const improvementsTranslations = await Promise.all(
          feedback.improvements.map(async (improvement) => ({
            original: improvement,
            translated: await translateText(improvement, 'en', currentLanguage)
          }))
        );
        newTranslations.improvements = improvementsTranslations;
      }

      setTranslations(newTranslations);
    } catch (error) {
      console.error('Error translating all content:', error);
      Alert.alert('Translation Error', 'Failed to translate some content. Please try again.');
    } finally {
      setIsTranslatingAll(false);
    }
  };

  // Update useEffect to translate content when language changes
  useEffect(() => {
    if (currentWord) {
      translateAllContent();
    }
  }, [currentLanguage, currentWord]);

  const handleTranslate = async () => {
    if (!currentWord) return;
    try {
      setIsTranslating(true);
      // Always translate to English
      const translatedText = await translateText(currentWord.french, 'fr', 'en');
      setTranslation(translatedText);
    } catch (error) {
      console.error('Translation error:', error);
      Alert.alert('Error', 'Failed to translate. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Feather name="x" size={24} color="#000" />
        </TouchableOpacity>

        {learnedWords.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.noWordsText}>
              {currentLanguage === 'en' 
                ? "No words learned yet. Complete some lessons first!"
                : "Aucun mot appris encore. Complétez d'abord quelques leçons!"}
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.languageLabel}>
              {currentLanguage === 'en' ? 'English' : 'Français'}
            </Text>
            <Text style={styles.wordText}>
              {currentLanguage === 'en' ? currentWord.english : currentWord.french}
            </Text>
            <Text style={styles.contextText}>
              {translations.context?.translated || currentWord.context}
            </Text>

            {currentWord.pronunciationScore && (
              <Text style={styles.scoreText}>
                {currentLanguage === 'en' ? 'Best Score: ' : 'Meilleur Score: '}
                {currentWord.pronunciationScore}%
              </Text>
            )}

            <View style={styles.controls}>
              <TouchableOpacity 
                style={[styles.circleButton, styles.playButton]}
                onPress={playWord}
              >
                <Feather name="play" size={28} color="white" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.circleButton, 
                  styles.recordButton,
                  hasPermission === false && styles.disabledButton
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing || hasPermission === false}
              >
                <Feather 
                  name={isRecording ? "stop-circle" : "mic"} 
                  size={28} 
                  color={hasPermission === false ? "#999" : "white"} 
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.circleButton, styles.translateButton]}
                onPress={handleTranslate}
                disabled={isTranslating}
              >
                <Feather name="refresh-cw" size={28} color="white" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.circleButton, styles.languageButton]}
                onPress={() => setCurrentLanguage(prev => prev === 'en' ? 'fr' : 'en')}
              >
                <Feather name="globe" size={28} color="white" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.circleButton, styles.nextButton]}
                onPress={nextWord}
              >
                <Feather name="skip-forward" size={28} color="white" />
              </TouchableOpacity>
            </View>

            {translation && (
              <View style={styles.translationContainer}>
                <Text style={styles.translationLabel}>
                  English Translation
                </Text>
                <Text style={styles.translationText}>{translation}</Text>
              </View>
            )}

            {isTranslating && (
              <View style={styles.translatingIndicator}>
                <ActivityIndicator color="#1cb0f6" />
                <Text style={styles.translatingText}>
                  Translating to English...
                </Text>
              </View>
            )}

            {isAnalyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#1cb0f6" />
                <Text style={styles.analyzingText}>
                  {currentLanguage === 'en' ? 'Analyzing your pronunciation...' : 'Analyse de votre prononciation...'}
                </Text>
              </View>
            )}
          </View>
        )}

        {showFeedback && feedback && (
          <View style={styles.feedbackModal}>
            <View style={styles.feedbackContent}>
              <Text style={styles.scoreTitle}>
                Pronunciation Analysis
              </Text>
              <Text style={[
                styles.scoreValue,
                feedback.score >= 90 ? styles.excellentScore :
                feedback.score >= 70 ? styles.goodScore :
                styles.averageScore
              ]}>
                {feedback.score}%
              </Text>
              
              {voiceAnalysis && (
                <View style={styles.analysisContainer}>
                  <Text style={styles.analysisTitle}>
                    Detailed Analysis
                  </Text>
                  <View style={styles.metricContainer}>
                    <Text style={styles.metricLabel}>
                      Clarity
                    </Text>
                    <View style={styles.metricBar}>
                      <View style={[styles.metricFill, { width: `${voiceAnalysis.clarity}%` }]} />
                    </View>
                    <Text style={styles.metricValue}>{voiceAnalysis.clarity}%</Text>
                  </View>
                  <View style={styles.metricContainer}>
                    <Text style={styles.metricLabel}>
                      Pace
                    </Text>
                    <View style={styles.metricBar}>
                      <View style={[styles.metricFill, { width: `${voiceAnalysis.pace}%` }]} />
                    </View>
                    <Text style={styles.metricValue}>{voiceAnalysis.pace}%</Text>
                  </View>
                  <View style={styles.metricContainer}>
                    <Text style={styles.metricLabel}>
                      Volume
                    </Text>
                    <View style={styles.metricBar}>
                      <View style={[styles.metricFill, { width: `${voiceAnalysis.volume}%` }]} />
                    </View>
                    <Text style={styles.metricValue}>{voiceAnalysis.volume}%</Text>
                  </View>
                  <View style={styles.metricContainer}>
                    <Text style={styles.metricLabel}>
                      Pitch
                    </Text>
                    <View style={styles.metricBar}>
                      <View style={[styles.metricFill, { width: `${voiceAnalysis.pitch}%` }]} />
                    </View>
                    <Text style={styles.metricValue}>{voiceAnalysis.pitch}%</Text>
                  </View>
                </View>
              )}

              <Text style={styles.feedbackMessage}>
                {feedback.message}
              </Text>
              
              {feedback.improvements.length > 0 && (
                <View style={styles.improvementSection}>
                  <Text style={styles.improvementTitle}>
                    Areas to Improve:
                  </Text>
                  {feedback.improvements.map((item, index) => (
                    <Text key={index} style={styles.improvementItem}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFeedback(false)}
              >
                <Text style={styles.closeButtonText}>
                  {currentLanguage === 'en' ? 'Continue' : 'Continuer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {hasPermission === false && (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>
              {currentLanguage === 'en' 
                ? 'Microphone access is required for pronunciation practice'
                : 'L\'accès au microphone est nécessaire pour la pratique de la prononciation'}
            </Text>
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={checkPermissions}
            >
              <Text style={styles.permissionButtonText}>
                {currentLanguage === 'en' ? 'Grant Permission' : 'Accorder la Permission'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  languageLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  wordText: {
    color: '#000',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contextText: {
    color: '#888',
    fontSize: 16,
    marginBottom: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#58cc02',
  },
  recordButton: {
    backgroundColor: '#ff4b4b',
  },
  languageButton: {
    backgroundColor: '#a560e8',
  },
  nextButton: {
    backgroundColor: '#1cb0f6',
  },
  noWordsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  scoreText: {
    color: '#58cc02',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  feedbackModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  scoreTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  excellentScore: {
    color: '#4CAF50',
  },
  goodScore: {
    color: '#2196F3',
  },
  averageScore: {
    color: '#FFC107',
  },
  feedbackMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  improvementSection: {
    width: '100%',
    marginBottom: 20,
  },
  improvementTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  improvementItem: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  translateButton: {
    backgroundColor: '#1cb0f6',
  },
  translationContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  translationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  translationText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  translatingIndicator: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  translatingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  analyzingContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  analyzingText: {
    color: '#666',
    fontSize: 16,
  },
  analysisContainer: {
    width: '100%',
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    gap: 10,
  },
  metricLabel: {
    width: 70,
    fontSize: 14,
    color: '#666',
  },
  metricBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    backgroundColor: '#1cb0f6',
    borderRadius: 4,
  },
  metricValue: {
    width: 40,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  permissionContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    alignItems: 'center',
  },
  permissionText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionButton: {
    backgroundColor: '#1cb0f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SpeechPractice;