// Import same dependencies as q1.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, 
  Alert, Platform, Vibration, Animated, Modal,
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
  const [error, setError] = useState<string | null>(null);
  
  // Updated options with French labels
  const options: QuizOption[] = [
    {
      id: '1',
      label: 'le chat',
      image: require('../../assets/images/Cat.jpg'),
      isCorrect: false,
    },
    {
      id: '2',
      label: 'le chien',
      image: require('../../assets/images/dog.jpg'),
      isCorrect: true,
    },
    {
      id: '3',
      label: 'l\'oiseau',
      image: require('../../assets/images/bird.png'),
      isCorrect: false,
    },
  ];

  // Same handleCheck function but updated for q2
  const handleCheck = async () => {
    if (!selectedOption) {
      setError('Please select an option');
      return;
    }

    const selectedAnswer = options.find(opt => opt.id === selectedOption);
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Error', 'You must be logged in to continue');
      router.replace('/(tabs)/qn1' as const);
      return;
    }

    try {
      const userRef = ref(database, `users/${user.uid}`);
      
      if (selectedAnswer && selectedAnswer.isCorrect) {
        // Store the learned word when correct
        await update(userRef, {
          [`learnedWords/${new Date().getTime()}`]: {
            french: "la fille",
            english: "the girl",
            learnedAt: new Date().toISOString(),
            section: "Quiz 2",
            context: "Basic nouns - Articles"
          },
          [`quizResponses/q2/completed`]: true,
          [`quizResponses/q2/completedAt`]: new Date().toISOString(),
          unlockedStars: 2,
          lastCompletedStar: 1
        });

        // Show success modal
        Vibration.vibrate(200);
        setShowSuccessModal(true);
        
        setTimeout(() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)/Home');
        }, 1500);
      } else {
        // Wrong answer handling - same as q1
        setHearts(prev => Math.max(0, prev - 1));
        
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        
        await update(userRef, {
          [`quizResponses/q2/attempts`]: (userData?.quizResponses?.q2?.attempts || 0) + 1,
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
            [`quizResponses/q2/failed`]: true
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
      Alert.alert('Error', 'Failed to save progress. Please try again.');
      setError('An error occurred while saving your progress');
    }
  };

  // Same navigation handlers
  const handleSkip = () => {
    router.push('/(tabs)/Home' as const);
  };

  const handleClose = () => {
    router.back();
  };

  // Same UI structure but updated question
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.heartsContainer}>
          {[...Array(hearts)].map((_, i) => (
            <Icon key={i} name="heart" size={24} color="#ff4b4b" />
          ))}
        </View>
        <TouchableOpacity onPress={handleClose}>
          <Icon name="x" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.newWordBadge}>
          <Icon name="plus-circle" size={20} color="#A56EFF" />
          <Text style={styles.newWordText}>NEW WORD</Text>
        </View>

        <Text style={styles.question}>Which one means "dog" in French?</Text>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedOption === option.id && styles.selectedCard,
              ]}
              onPress={() => {
                setSelectedOption(option.id);
                setError(null); // Clear any error when making a new selection
              }}
              disabled={showNextButton} // Disable options after correct answer
            >
              <Image 
                source={option.image} 
                style={styles.optionImage}
                resizeMode="cover"
              />
              <Text style={styles.optionLabel}>{option.label}</Text>
              <View style={styles.optionNumber}>
                <Text style={styles.optionNumberText}>{option.id}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          disabled={showNextButton}
        >
          <Text style={styles.skipButtonText}>SKIP</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.nextButton,
            !selectedOption && styles.nextButtonDisabled
          ]}
          onPress={() => router.replace('/(tabs)/Home')}
          disabled={!selectedOption}
        >
          <Text style={styles.nextButtonText}>NEXT</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.checkButton, 
            (!selectedOption || showNextButton) && styles.checkButtonDisabled
          ]}
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
        onRequestClose={() => {
          setShowSuccessModal(false);
          setError(null);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowSuccessModal(false);
            setShowNextButton(true);
            setError(null);
            setSelectedOption(null);
          }}
        >
          <View style={styles.modalContent}>
            <Icon name="check-circle" size={50} color="#58cc02" />
            <Text style={styles.modalTitle}>🎉 Excellent!</Text>
            <Text style={styles.modalText}>That's correct! You're making great progress.</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                setShowNextButton(true);
                setError(null);
                setSelectedOption(null);
              }}
            >
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Same styles as q1.tsx
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
    gap: 5,
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
  nextButtonDisabled: {
    backgroundColor: '#2a3a4a',
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
  errorText: {
    color: '#ff4b4b',
    textAlign: 'center',
    marginVertical: 10,
  }
});

export default QuizScreen;