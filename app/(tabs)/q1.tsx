import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useRouter } from 'expo-router';

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
  
  const options: QuizOption[] = [
    {
      id: '1',
      label: 'la mujer',
      image: require('../../assets/images/download.jpg'),
      isCorrect: false,
    },
    {
      id: '2',
      label: 'el niño',
      image: require('../../assets/images/gettyimages-1352096257-612x612.jpg'),
      isCorrect: false,
    },
    {
      id: '3',
      label: 'el hombre',
      image: require('../../assets/images/pensive-man-blue-shirt-with-gentle-expression-vector-illustration-light-background-concept-decisionmaking-vector-illustration_345238-2966.avif'),
      isCorrect: true,
    },
  ];

  const handleCheck = () => {
    if (!selectedOption) return;

    const selectedAnswer = options.find(opt => opt.id === selectedOption);
    if (selectedAnswer && !selectedAnswer.isCorrect) {
      setHearts(prev => Math.max(0, prev - 1));
      Alert.alert(
        'Incorrect!',
        'Try again',
        [{ text: 'OK', onPress: () => setSelectedOption(null) }]
      );
      
      if (hearts <= 1) {
        Alert.alert(
          'Game Over',
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
    } else {
      Alert.alert(
        'Correct!',
        'Well done!',
        [{ 
          text: 'Next', 
          onPress: () => {
            // Navigate to next question
            router.push('/qn2');
          }
        }]
      );
    }
  };

  const handleSkip = () => {
    router.push('/qn2');
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

        <Text style={styles.question}>Which one of these is "the man"?</Text>

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
        <TouchableOpacity
          style={[
            styles.checkButton,
            !selectedOption && styles.checkButtonDisabled,
          ]}
          onPress={handleCheck}
          disabled={!selectedOption}
        >
          <Text style={styles.checkButtonText}>CHECK</Text>
        </TouchableOpacity>
      </View>
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
});

export default QuizScreen;