import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Vibration,
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
      Alert.alert('Error', 'You must be logged in to continue');
      return;
    }

    try {
      const userRef = ref(database, `users/${user.uid}`);

      if (selectedAnswer?.isCorrect) {
        await update(userRef, {
          [`learnedWords/${new Date().getTime()}`]: {
            french: 'le garçon',
            english: 'the boy',
            learnedAt: new Date().toISOString(),
            section: 'Quiz 1',
            context: 'Basic nouns - Articles',
          },
          [`quizResponses/q1/completed`]: true,
          [`quizResponses/q1/completedAt`]: new Date().toISOString(),
        });

        Vibration.vibrate(200);
        setShowSuccessModal(true);
      } else {
        setHearts(prev => Math.max(0, prev - 1));

        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        await update(userRef, {
          [`quizResponses/q1/attempts`]: (userData?.quizResponses?.q1?.attempts || 0) + 1,
          hearts: Math.max(0, hearts - 1),
        });

        Alert.alert(
          '❌ Incorrect',
          "Sorry, that's not right. Try again!"
        );

        if (hearts <= 1) {
          await update(userRef, { hearts: 5, [`quizResponses/q1/failed`]: true });
          Alert.alert('💔 Game Over', 'You ran out of hearts!', [{ text: 'Restart', onPress: () => setHearts(5) }]);
        }
      }
    } catch (error) {
      console.error('Error updating database:', error);
      Alert.alert('Error', 'Failed to save progress');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>Which one means "le garçon" in English?</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, selectedOption === option.id && styles.selectedCard]}
            onPress={() => setSelectedOption(option.id)}
          >
            <Image source={option.image} style={styles.optionImage} />
            <Text style={styles.optionLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.checkButton} onPress={handleCheck} disabled={!selectedOption}>
        <Text style={styles.checkButtonText}>CHECK</Text>
      </TouchableOpacity>
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 Excellent!</Text>
            <Text style={styles.modalText}>That's correct! You're making great progress.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.push('./q2');
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
  container: { flex: 1, padding: 20, backgroundColor: '#111b21' },
  question: { color: '#FFFFFF', fontSize: 24, textAlign: 'center', marginBottom: 32 },
  optionsContainer: { width: '100%', gap: 16 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1f2937', borderRadius: 12 },
  selectedCard: { borderColor: '#58cc02', borderWidth: 2 },
  optionImage: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  optionLabel: { color: '#FFFFFF', fontSize: 18, flex: 1 },
  checkButton: { padding: 16, backgroundColor: '#58cc02', borderRadius: 10, marginTop: 20, alignItems: 'center' },
  checkButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { backgroundColor: 'white', padding: 30, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  modalText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  modalButton: { backgroundColor: '#58cc02', padding: 12, borderRadius: 30 },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default QuizScreen;
