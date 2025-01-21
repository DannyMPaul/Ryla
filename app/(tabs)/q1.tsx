import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Vibration,
  Animated,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useRouter } from 'expo-router';
import { getDatabase, ref, update, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { database } from '../firebase/firebase';

interface QuizOption {
  id: string;
  label: string;
  image: any;
  isCorrect: boolean;
}

const QuizScreen = () => {
  const router = useRouter();
  const [hearts, setHearts] = useState(5);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const options: QuizOption[] = [
    {
      id: '1',
      label: 'woman',
      image: require('../../assets/images/download.jpg'),
      isCorrect: false,
    },
    {
      id: '2',
      label: 'boy',
      image: require('../../assets/images/gettyimages-1352096257-612x612.jpg'),
      isCorrect: true,
    },
    {
      id: '3',
      label: 'man',
      image: require('../../assets/images/gettyimages-1352096257-612x612.jpg'),
      isCorrect: false,
    },
  ];

  const handleCheck = async () => {
    if (!selectedOption) return;

    const selectedAnswer = options.find(opt => opt.id === selectedOption);
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      router.replace('/(tabs)/qn1' as const);
      return;
    }

    try {
      if (selectedAnswer && selectedAnswer.isCorrect) {
        const userRef = ref(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        
        await update(userRef, {
          [`quizResponses/q1/completed`]: true,
          [`quizResponses/q1/completedAt`]: new Date().toISOString(),
          currentLesson: 2,
          currentQuestion: 2,
          totalCorrect: userData?.totalCorrect + 1 || 1,
          unlockedLessons: userData?.unlockedLessons ? 
            [...userData.unlockedLessons, '2'] : 
            ['1', '2'],
          learnedWords: {
            ...(userData?.learnedWords || {}),
            'le garçon': {
              french: 'le garçon',
              english: 'boy',
              learnedAt: new Date().toISOString()
            }
          }
        });

        Vibration.vibrate(200);
        setShowSuccessModal(true);
      } else {
        // Wrong answer
        setHearts(prev => Math.max(0, prev - 1));
        
        // Store the incorrect attempt
        const userRef = ref(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        
        await update(userRef, {
          [`quizResponses/q1/attempts`]: (userData?.quizResponses?.q1?.attempts || 0) + 1,
          hearts: Math.max(0, hearts - 1)
        });

        Alert.alert(
          '❌ Incorrect',
          'Sorry, that\'s not right. Try again!',
          [{ text: 'OK', onPress: () => setSelectedOption(null) }]
        );
        
        if (hearts <= 1) {
          await update(userRef, {
            hearts: 5,
            [`quizResponses/q1/failed`]: true
          });

          Alert.alert(
            '💔 Game Over',
            'You ran out of hearts!',
            [{ 
              text: 'Restart', 
              onPress: () => {
                setHearts(5);
                setSelectedOption(null);
              }
            }]
          );
        }
      }
    } catch (error) {
      console.error('Error updating database:', error);
      Alert.alert('Error', 'Failed to save progress');
    }
  };

  const handleSkip = () => {
    router.push('/(tabs)/Home' as const);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Icon name="x" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <View style={styles.heartsContainer}>
          <Icon name="heart" size={24} color="#FF4B4B" />
          <Text style={styles.heartsText}>{hearts}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.newWordBadge}>
          <Icon name="plus-circle" size={20} color="#A56EFF" />
          <Text style={styles.newWordText}>NEW WORD</Text>
        </View>

        <Text style={styles.question}>Which one means "le garçon" in English?</Text>

        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedOption === option.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedOption(option.id)}
            >
              <Image source={option.image} style={styles.optionImage} />
              <Text style={styles.optionLabel}>{option.label}</Text>
              <View style={styles.optionNumber}>
                <Text style={styles.optionNumberText}>{option.id}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>SKIP</Text>
        </TouchableOpacity>
        
        {showNextButton && (
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={() => router.replace('./q2' as const)}
          >
            <Text style={styles.nextButtonText}>NEXT</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.checkButton, !selectedOption && styles.checkButtonDisabled]}
          onPress={handleCheck}
          disabled={!selectedOption || showNextButton}
        >
          <Text style={styles.checkButtonText}>CHECK</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon name="check-circle" size={50} color="#58cc02" />
            <Text style={styles.modalTitle}>🎉 Excellent!</Text>
            <Text style={styles.modalText}>That's correct! You're making great progress.</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                setShowNextButton(true);
              }}
            >
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111b21',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  closeButton: {
    padding: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#1f2937',
    borderRadius: 4,
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#58cc02',
    borderRadius: 4,
  },
  heartsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heartsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  newWordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  newWordText: {
    color: '#A56EFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  question: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#58cc02',
    backgroundColor: '#2a3a4a',
  },
  optionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  optionLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    flex: 1,
  },
  optionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2a3a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  skipButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#58cc02',
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#2a3a4a',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#58cc02',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#58cc02',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuizScreen;