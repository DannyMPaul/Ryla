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

const Star2QuizScreen = () => {
  const router = useRouter();
  const [hearts, setHearts] = useState(5);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const options: QuizOption[] = [
    {
      id: '1',
      label: 'la banane',
      image: require('../../assets/images/bird.png'),
      isCorrect: false,
    },
    {
      id: '2',
      label: 'la pomme',
      image: require('../../assets/images/bird.png'),
      isCorrect: true,
    },
    {
      id: '3',
      label: 'l\'orange',
      image: require('../../assets/images/bird.png'),
      isCorrect: false,
    },
  ];

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
      router.replace('/(tabs)/qn1');
      return;
    }

    try {
      if (selectedAnswer && selectedAnswer.isCorrect) {
        const userRef = ref(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        
        await update(userRef, {
          [`quizResponses/star2q2/completed`]: true,
          [`quizResponses/star2q2/completedAt`]: new Date().toISOString(),
          currentLesson: 2,
          currentQuestion: 3,
          totalCorrect: userData?.totalCorrect + 1 || 1,
        });

        Vibration.vibrate(200);
        setShowSuccessModal(true);
        
        setTimeout(() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)/Home');
        }, 1500);
      } else {
        setHearts(prev => Math.max(0, prev - 1));
        
        const userRef = ref(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        
        await update(userRef, {
          [`quizResponses/star2q2/attempts`]: (userData?.quizResponses?.star2q2?.attempts || 0) + 1,
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
            [`quizResponses/star2q2/failed`]: true
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
      setError('An error occurred while saving your progress');
    }
  };

  const handleSkip = () => {
    router.push('/(tabs)/Home');
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

        <Text style={styles.question}>Which fruit is "la pomme" in French?</Text>

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
                setError(null);
              }}
              disabled={showNextButton}
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
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          disabled={showNextButton}
        >
          <Text style={styles.skipButtonText}>SKIP</Text>
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
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon name="check-circle" size={50} color="#58cc02" />
            <Text style={styles.modalTitle}>🎉 Excellent!</Text>
            <Text style={styles.modalText}>
              That's correct! "La pomme" means apple in French.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/(tabs)/Home');
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
    backgroundColor: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  closeButton: {
    padding: 8,
  },
  progressBar: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 5,
    height: 10,
  },
  progressFill: {
    backgroundColor: '#58cc02',
    borderRadius: 5,
    height: '100%',
  },
  heartsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heartsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newWordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#334155',
    borderRadius: 10,
  },
  newWordText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  question: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 16,
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#334155',
    borderRadius: 10,
    flex: 1,
  },
  selectedCard: {
    backgroundColor: '#58cc02',
  },
  optionImage: {
    width: 40,
    height: 40,
    marginRight: 16,
  },
  optionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionNumber: {
    backgroundColor: '#58cc02',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  optionNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#334155',
    borderRadius: 10,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  checkButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#58cc02',
    borderRadius: 10,
  },
  checkButtonDisabled: {
    backgroundColor: '#334155',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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

export default Star2QuizScreen;
