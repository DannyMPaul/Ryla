import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { getDatabase, ref, get, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';

interface LearnedWord {
  french: string;
  english: string;
  context: string;
  pronunciationScore?: number;
}

const SpeechPractice = () => {
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);
  const [currentWord, setCurrentWord] = useState<LearnedWord | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'fr'>('en');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ score: 0, message: '' });

  useEffect(() => {
    setupAudio();
    loadLearnedWords();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get microphone permission');
    }
  };

  const loadLearnedWords = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const dbRef = ref(getDatabase(), `users/${user.uid}/learnedWords`);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const words = Object.values(snapshot.val()) as LearnedWord[];
      setLearnedWords(words);
      setCurrentWord(words[0]);
    }
  };

  const playWord = async () => {
    if (!currentWord) return;
    setIsPlaying(true);
    try {
      const textToSpeak = currentLanguage === 'en' ? currentWord.english : currentWord.french;
      await Speech.speak(textToSpeak, {
        language: currentLanguage,
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
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
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
        // Here you would normally send the audio file to a speech-to-text service
        // For demo purposes, we'll simulate a score
        analyzePronunciation(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const analyzePronunciation = async (audioUri: string) => {
    // Simulate pronunciation analysis
    // In a real app, you would:
    // 1. Send the audio file to a speech-to-text service
    // 2. Compare the transcription with the expected word
    // 3. Get detailed pronunciation feedback
    
    const randomScore = Math.floor(Math.random() * 40) + 60; // Score between 60-100
    const feedback = getPronunciationFeedback(randomScore);
    
    setFeedback({
      score: randomScore,
      message: feedback
    });
    setShowFeedback(true);

    // Save the score if it's better than the previous one
    if (currentWord && (!currentWord.pronunciationScore || randomScore > currentWord.pronunciationScore)) {
      savePronunciationScore(randomScore);
    }
  };

  const getPronunciationFeedback = (score: number): string => {
    if (score >= 90) return "Excellent pronunciation! Keep it up! 🌟";
    if (score >= 80) return "Very good! Just a few minor adjustments needed. 👍";
    if (score >= 70) return "Good effort! Try to speak more clearly. 💪";
    return "Keep practicing! Focus on speaking slowly and clearly. 🎯";
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
      
      // Update local state
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
    const currentIndex = learnedWords.findIndex(w => w === currentWord);
    const nextIndex = (currentIndex + 1) % learnedWords.length;
    setCurrentWord(learnedWords[nextIndex]);
  };

  return (
    <View style={styles.container}>
      {currentWord && (
        <>
          <Text style={styles.languageLabel}>
            {currentLanguage === 'en' ? 'English' : 'French'}
          </Text>
          <Text style={styles.wordText}>
            {currentLanguage === 'en' ? currentWord.english : currentWord.french}
          </Text>
          <Text style={styles.contextText}>{currentWord.context}</Text>
          
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={playWord}
              disabled={isPlaying}
            >
              <Feather 
                name={isPlaying ? "pause" : "play"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordingActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Feather 
                name={isRecording ? "stop-circle" : "mic"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.languageButton}
              onPress={() => setCurrentLanguage(prev => prev === 'en' ? 'fr' : 'en')}
            >
              <Feather name="globe" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={nextWord}
            >
              <Feather name="skip-forward" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {currentWord.pronunciationScore && (
            <Text style={styles.bestScore}>
              Best Score: {currentWord.pronunciationScore}%
            </Text>
          )}
        </>
      )}

      <Modal
        visible={showFeedback}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.scoreTitle}>Pronunciation Score</Text>
            <Text style={[
              styles.scoreText,
              feedback.score >= 90 ? styles.excellentScore :
              feedback.score >= 80 ? styles.goodScore :
              styles.averageScore
            ]}>
              {feedback.score}%
            </Text>
            <Text style={styles.feedbackMessage}>{feedback.message}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowFeedback(false)}
            >
              <Text style={styles.closeButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
  },
  languageLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 5,
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  contextText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: 15,
  },
  playButton: {
    backgroundColor: '#58cc02',
    padding: 15,
    borderRadius: 25,
  },
  recordButton: {
    backgroundColor: '#ff4b4b',
    padding: 15,
    borderRadius: 25,
  },
  languageButton: {
    backgroundColor: '#a560e8',
    padding: 15,
    borderRadius: 25,
  },
  nextButton: {
    backgroundColor: '#1cb0f6',
    padding: 15,
    borderRadius: 25,
  },
  bestScore: {
    marginTop: 15,
    color: '#ffd700',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#58cc02',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#58cc02',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingActive: {
    backgroundColor: '#ff0000',
    transform: [{ scale: 1.1 }],
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
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
  },
});

export default SpeechPractice; 