import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Vibration, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useRouter } from 'expo-router';
import { getDatabase, ref, update, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { database } from '../firebase/firebase';
import MatchPair1 from '../../components/MatchPair1';
import ResultCard from '../../components/ResultCardq1'; 

interface QuizOption {
  id: string;
  label: string;
  image: any;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options?: QuizOption[];
  type?: 'match';
}

const QuizTwoScreen = () => {
  const router = useRouter();
  const [hearts, setHearts] = useState(5);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showNextButton, setShowNextButton] = useState(false); // Control visibility of Next button
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0); // Track correct answers
  const [showResultCard, setShowResultCard] = useState(false); // Control visibility of ResultCard
  const [backgroundColor, setBackgroundColor] = useState('rgb(15, 0, 25)'); // State for background color
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null); // Track if the answer is correct
  const [isCheckDisabled, setIsCheckDisabled] = useState(false); // Disable Check button after use
  const questions: QuizQuestion[] = [
    {
      id: '1',
      question: 'Which one means "le garçon" in English?',
      options: [
        { id: '1', label: 'woman', image: require('../../assets/images/roadMapImgs/women.jpg'), isCorrect: false },
        { id: '2', label: 'boy', image: require('../../assets/images/roadMapImgs/boy.jpg'), isCorrect: true },
        { id: '3', label: 'man', image: require('../../assets/images/roadMapImgs/man.jpg'), isCorrect: false },
      ],
    },
    {
      id: '2',
      question: 'Which one means "la fille" in English?',
      options: [
        { id: '1', label: 'woman', image: require('../../assets/images/roadMapImgs/women.jpg'), isCorrect: false },
        { id: '2', label: 'girl', image: require('../../assets/images/roadMapImgs/girl.jpg'), isCorrect: true },
        { id: '3', label: 'man', image: require('../../assets/images/roadMapImgs/man.jpg'), isCorrect: false },
      ],
    },
    {
      id: '3',
      question: 'Which one means "le chat" in English?',
      options: [
        { id: '1', label: 'dog', image: require('../../assets/images/roadMapImgs/dog.jpg'), isCorrect: false },
        { id: '2', label: 'cat', image: require('../../assets/images/roadMapImgs/Cat.jpg'), isCorrect: true },
        { id: '3', label: 'bird', image: require('../../assets/images/roadMapImgs/bird.png'), isCorrect: false },
      ],
    },
    {
      id: '4',
      question: 'Which one means "la pomme" in English?',
      options: [
        { id: '1', label: 'banana', image: require('../../assets/images/roadMapImgs/banana.jpg'), isCorrect: false },
        { id: '2', label: 'apple', image: require('../../assets/images/roadMapImgs/apple.jpg'), isCorrect: true },
        { id: '3', label: 'grape', image: require('../../assets/images/roadMapImgs/grape.jpg'), isCorrect: false },
      ],
    },
    {
      id: '5',
      question: 'Which one means "le chien" in English?',
      options: [
        { id: '1', label: 'rabbit', image: require('../../assets/images/roadMapImgs/rabbit.jpg'), isCorrect: false },
        { id: '2', label: 'dog', image: require('../../assets/images/roadMapImgs/dog.jpg'), isCorrect: true },
        { id: '3', label: 'fish', image: require('../../assets/images/roadMapImgs/fish.jpg'), isCorrect: false },
      ],
    },
    {
      id: '6',
      type: 'match',
      question: 'Match the Following',
    },
  ];

  const currentQuestion = questions[currentQuestionIndex];

  const handleCheck = async () => {
    if (!selectedOption) return;

    const selectedAnswer = currentQuestion.options?.find(opt => opt.id === selectedOption);
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Error', 'You must be logged in to continue');
      return;
    }

    setIsCheckDisabled(true); // Disable the Check button

    try {
      const userRef = ref(database, `users/${user.uid}`);
      
      if (selectedAnswer && selectedAnswer.isCorrect) {
        setIsAnswerCorrect(true); // Set answer as correct
        setCorrectAnswers(prev => prev + 1);
        setBackgroundColor('green'); // Change background color to green

        await update(userRef, {
          [`learnedWords/${new Date().getTime()}`]: {
            french: currentQuestion.question.split('"')[1],
            english: selectedAnswer.label,
            learnedAt: new Date().toISOString(),
            section: "Quiz 1",
            context: "Basic nouns - Articles"
          },
          [`quizResponses/q${currentQuestion.id}/completed`]: true,
          [`quizResponses/q${currentQuestion.id}/completedAt`]: new Date().toISOString()
        });

        Vibration.vibrate(200);
        setShowSuccessModal(true);
        setShowNextButton(true); // Show the Next button
      } else {
        setIsAnswerCorrect(false); // Set answer as incorrect
        setHearts(prev => Math.max(0, prev - 1));
        setBackgroundColor('red'); // Change background color to red

        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        
        await update(userRef, {
          [`quizResponses/q${currentQuestion.id}/attempts`]: (userData?.quizResponses?.[`q${currentQuestion.id}`]?.attempts || 0) + 1,
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
            [`quizResponses/q${currentQuestion.id}/failed`]: true
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

      // Revert background color after 1 second
      setTimeout(() => {
        setBackgroundColor('rgb(15, 0, 25)');
        setIsCheckDisabled(false); // Re-enable the Check button
      }, 1000);

    } catch (error) {
      console.error('Error updating database:', error);
      Alert.alert('Error', 'Failed to save progress');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setShowNextButton(false); // Hide the Next button for the next question
      setIsAnswerCorrect(null); // Reset correctness state
    } else {
      setShowResultCard(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setHearts(5);
    setSelectedOption(null);
    setShowResultCard(false);
    setIsAnswerCorrect(null); // Reset correctness state
    setShowNextButton(false); // Hide the Next button on restart
  };

  const handleSkip = () => {
    router.push('/(tabs)/Home' as const);
  };

  const handleClose = () => {
    router.back();
  };

  const renderQuestion = () => {
    if (currentQuestion.type === 'match') {
      return <MatchPair1 onComplete={handleNextQuestion} />;
    }

    return (
      <>
        <View style={styles.newWordBadge}>
          <Icon name="plus-circle" size={20} color="#A56EFF" />
          <Text style={styles.newWordText}>NEW WORD</Text>
        </View>

        <Text style={styles.question}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options?.map((option) => (
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
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {showResultCard ? (
        <ResultCard
          correctAnswers={correctAnswers}
          totalQuestions={questions.length}
          onRestart={handleRestart}
        />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Icon name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} />
            </View>
            <View style={styles.heartsContainer}>
              <Icon name="heart" size={24} color="#FF4B4B" />
              <Text style={styles.heartsText}>{hearts}</Text>
            </View>
          </View>

          <View style={styles.content}>
            {renderQuestion()}
          </View>

          {currentQuestion.type !== 'match' && (
            <View style={styles.footer}>
              {/* Show Check button only if Next button is not visible */}
              {!showNextButton && (
                <TouchableOpacity
                  style={[
                    styles.checkButton, 
                    (!selectedOption || isCheckDisabled) && styles.checkButtonDisabled
                  ]}
                  onPress={handleCheck}
                  disabled={!selectedOption || isCheckDisabled}
                >
                  <Text style={styles.checkButtonText}>CHECK</Text>
                </TouchableOpacity>
              )}

              {/* Show Next button only if the correct answer is selected */}
              {showNextButton && (
                <TouchableOpacity 
                  style={styles.nextButton}
                  onPress={handleNextQuestion}
                >
                  <Text style={styles.nextButtonText}>NEXT</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

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
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(15, 0, 25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 35,
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
    padding: 12,
    alignItems: 'center',
  },
  newWordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  newWordText: {
    color: 'rgba(127, 17, 224, 1)',
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
    gap: 18,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 13, 78, 0.5)',
    borderRadius: 32,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: 'rgb(240, 74, 99)',
    backgroundColor: 'rgb(12, 1, 22)',
  },
  optionImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginRight: 16,
  },
  optionLabel: {
    color: '#FFFFFF',
    fontSize: 22,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 5, 
  },
  skipButton: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkButton: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: '#58cc02',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  checkButtonDisabled: {
    backgroundColor: '#2a3a4a',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 20, 
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(120, 16, 210, 0.83)',
    borderRadius: 25,
    marginHorizontal: 8,
    borderWidth: 5,
    borderColor: 'rgba(127, 17, 224, 0.64)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  

  nextButtonDisabled: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 15,
    marginHorizontal: 8,
    borderWidth: 5,
    borderColor: 'rgba(127, 17, 224, 0.64)',
    alignItems: 'center',
    justifyContent: 'center',
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

export default QuizTwoScreen;