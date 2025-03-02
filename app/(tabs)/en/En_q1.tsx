import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Vibration,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useRouter } from "expo-router";
import { getDatabase, ref, update, get } from "firebase/database";
import { getAuth } from "firebase/auth";
import { database } from "../../firebase/firebase";
import MatchPair1 from "../../../components/MatchPair1";
import ResultCard from "../../../components/ResultCardq1";

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
  type?: "match";
}

const QuizScreen = () => {
  const router = useRouter();
  const [hearts, setHearts] = useState(5);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResultCard, setShowResultCard] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("rgb(15, 0, 25)");
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [isCheckDisabled, setIsCheckDisabled] = useState(false);

  const questions: QuizQuestion[] = [
    {
      id: "1",
      question: 'Which one means "coffee" in Spanish?',
      options: [
        {
          id: "1",
          label: "café",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: true,
        },
        {
          id: "2",
          label: "agua",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: false,
        },
        {
          id: "3",
          label: "pan",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: false,
        },
      ],
    },
    {
      id: "2",
      question: 'Which one means "dog" in Spanish?',
      options: [
        {
          id: "1",
          label: "gato",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: false,
        },
        {
          id: "2",
          label: "perro",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: true,
        },
        {
          id: "3",
          label: "pájaro",
          image: require("../../../assets/images/roadMapImgs/bird.png"),
          isCorrect: false,
        },
      ],
    },
    {
      id: "3",
      question: 'Which one means "apple" in Spanish?',
      options: [
        {
          id: "1",
          label: "plátano",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: false,
        },
        {
          id: "2",
          label: "manzana",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: true,
        },
        {
          id: "3",
          label: "uva",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: false,
        },
      ],
    },
    {
      id: "4",
      question: 'Which one means "house" in Spanish?',
      options: [
        {
          id: "1",
          label: "casa",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: true,
        },
        {
          id: "2",
          label: "carro",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: false,
        },
        {
          id: "3",
          label: "libro",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: false,
        },
      ],
    },
    {
      id: "5",
      question: 'Which one means "water" in Spanish?',
      options: [
        {
          id: "1",
          label: "agua",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: true,
        },
        {
          id: "2",
          label: "leche",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: false,
        },
        {
          id: "3",
          label: "jugo",
          image: require("../../../assets/images/roadMapImgs/boy.jpg"),
          isCorrect: false,
        },
      ],
    },
    {
      id: "6",
      type: "match",
      question: "Match the Following",
    },
  ];
  const currentQuestion = questions[currentQuestionIndex];

  const handleCheck = async () => {
    if (!selectedOption) return;

    const selectedAnswer = currentQuestion.options?.find(
      (opt) => opt.id === selectedOption
    );
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "You must be logged in to continue");
      return;
    }

    setIsCheckDisabled(true);

    try {
      const userRef = ref(database, `users/${user.uid}`);

      if (selectedAnswer && selectedAnswer.isCorrect) {
        setIsAnswerCorrect(true);
        setCorrectAnswers((prev) => prev + 1);
        setBackgroundColor("green");

        await update(userRef, {
          [`learnedWords/${new Date().getTime()}`]: {
            spanish: selectedAnswer.label,
            english: currentQuestion.question.split('"')[1],
            learnedAt: new Date().toISOString(),
            section: "Quiz 1",
            context: "Basic vocabulary",
          },
          [`quizResponses/q${currentQuestion.id}/completed`]: true,
          [`quizResponses/q${currentQuestion.id}/completedAt`]:
            new Date().toISOString(),
        });

        Vibration.vibrate(200);
        setShowSuccessModal(true);
        setShowNextButton(true);
      } else {
        setIsAnswerCorrect(false);
        setHearts((prev) => Math.max(0, prev - 1));
        setBackgroundColor("red");

        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        await update(userRef, {
          [`quizResponses/q${currentQuestion.id}/attempts`]:
            (userData?.quizResponses?.[`q${currentQuestion.id}`]?.attempts ||
              0) + 1,
          hearts: Math.max(0, hearts - 1),
        });

        Alert.alert("❌ Incorrect", "Sorry, that's not right. Try again!", [
          { text: "OK", onPress: () => setSelectedOption(null) },
        ]);

        if (hearts <= 1) {
          await update(userRef, {
            hearts: 5,
            [`quizResponses/q${currentQuestion.id}/failed`]: true,
          });

          Alert.alert("💔 Game Over", "You ran out of hearts!", [
            {
              text: "Restart",
              onPress: () => {
                setHearts(5);
                setSelectedOption(null);
              },
            },
          ]);
        }
      }

      setTimeout(() => {
        setBackgroundColor("rgb(15, 0, 25)");
        setIsCheckDisabled(false);
      }, 1000);
    } catch (error) {
      console.error("Error updating database:", error);
      Alert.alert("Error", "Failed to save progress");
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setShowNextButton(false);
      setIsAnswerCorrect(null);
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
    setIsAnswerCorrect(null);
    setShowNextButton(false);
  };

  const handleSkip = () => {
    router.push("../En_Home" as const);
  };

  const handleClose = () => {
    router.back();
  };

  const renderQuestion = () => {
    if (currentQuestion.type === "match") {
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
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      ((currentQuestionIndex + 1) / questions.length) * 100
                    }%`,
                  },
                ]}
              />
            </View>
            <View style={styles.heartsContainer}>
              <Icon name="heart" size={24} color="#FF4B4B" />
              <Text style={styles.heartsText}>{hearts}</Text>
            </View>
          </View>

          <View style={styles.content}>{renderQuestion()}</View>

          {currentQuestion.type !== "match" && (
            <View style={styles.footer}>
              {!showNextButton && (
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    (!selectedOption || isCheckDisabled) &&
                      styles.checkButtonDisabled,
                  ]}
                  onPress={handleCheck}
                  disabled={!selectedOption || isCheckDisabled}
                >
                  <Text style={styles.checkButtonText}>CHECK</Text>
                </TouchableOpacity>
              )}

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
                <Text style={styles.modalText}>
                  That's correct! You're making great progress.
                </Text>
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
    backgroundColor: "rgb(15, 0, 25)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: "#1f2937",
    borderRadius: 4,
  },
  progressFill: {
    width: "60%",
    height: "100%",
    backgroundColor: "#58cc02",
    borderRadius: 4,
  },
  heartsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heartsText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  newWordBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  newWordText: {
    color: "rgba(127, 17, 224, 1)",
    fontSize: 16,
    fontWeight: "bold",
  },
  question: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 32,
  },
  optionsContainer: {
    width: "100%",
    gap: 18,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(47, 13, 78, 0.5)",
    borderRadius: 32,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: "rgb(240, 74, 99)",
    backgroundColor: "rgb(12, 1, 22)",
  },
  optionImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginRight: 16,
  },
  optionLabel: {
    color: "#FFFFFF",
    fontSize: 22,
    flex: 1,
  },
  optionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2a3a4a",
    alignItems: "center",
    justifyContent: "center",
  },
  optionNumberText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    borderColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  skipButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  checkButton: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: "#58cc02",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  checkButtonDisabled: {
    backgroundColor: "#2a3a4a",
  },
  checkButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  nextButton: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: "rgba(120, 16, 210, 0.83)",
    borderRadius: 25,
    marginHorizontal: 8,
    borderWidth: 5,
    borderColor: "rgba(127, 17, 224, 0.64)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  nextButtonDisabled: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 15,
    marginHorizontal: 8,
    borderWidth: 5,
    borderColor: "rgba(127, 17, 224, 0.64)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 15,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#58cc02",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default QuizScreen;
