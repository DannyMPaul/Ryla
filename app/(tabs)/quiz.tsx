import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref as dbRef, update, onValue } from 'firebase/database';

// Add interface at the top
interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  context?: string;
}

const questions: Record<string, QuizQuestion[]> = {
  beginner: [
    { 
      question: "Hier, nous ................ un film intéressant.", 
      options: ["regardons", "avons regardé", "regardions", "Don't Know"], 
      answer: "avons regardé",
      context: "Past tense usage" 
    },
    { 
      question: "Translate into English: Bonjour.", 
      options: ["Goodbye", "Hello", "Please", "Don't Know"], 
      answer: "Hello" 
    },
    { 
      question: "What does 'merci' mean?", 
      options: ["Thank you", "Yes", "Goodbye", "Don't Know"], 
      answer: "Thank you" 
    },
    { 
      question: "Choose the correct article for 'pomme':", 
      options: ["Le", "La", "Les", "Don't Know"], 
      answer: "La" 
    },
    { 
      question: "Which is a French color?", 
      options: ["Rouge", "Livre", "Porte", "Don't Know"], 
      answer: "Rouge" 
    },
    { 
      question: "J'aime ................... chocolat.", 
      options: ["le", "la", "les", "Don't Know"], 
      answer: "le" 
    },
  ],
  intermediate: [
    { 
      question: "J'aime beaucoup ................ étudiant. Il est très sympathique.", 
      options: ["cette", "ce", "cet", "Don't Know"], 
      answer: "cet" 
    },
    { 
      question: "Nous ................ au cinéma demain.", 
      options: ["allons", "allez", "va", "Don't Know"], 
      answer: "allons" 
    },
    { 
      question: "Translate: Je voudrais un café, s'il vous plaît.", 
      options: ["I want a coffee, please.", "I would like a coffee, please.", "I am drinking a coffee, please.", "Don't Know"], 
      answer: "I would like a coffee, please." 
    },
    { 
      question: "Elle parle ................ son professeur.", 
      options: ["à", "avec", "de", "Don't Know"], 
      answer: "à" 
    },
    { 
      question: "Which sentence is correct?", 
      options: ["Elle a un chat noir.", "Elle as un chat noir.", "Elle a une chat noir.", "Don't Know"], 
      answer: "Elle a un chat noir." 
    },
  ],
  hard: [
    { 
      question: "She is smarter than her brother.", 
      options: ["Elle est plus intelligente que son frère.", 
               "Elle est moins intelligente que son frère.", 
               "Elle est aussi intelligente que son frère.",
               "Don't Know"], 
      answer: "Elle est plus intelligente que son frère." 
    },
    { 
      question: "What does 'faire la cuisine' mean?", 
      options: ["To eat in the kitchen", "To cook", "To clean the kitchen", "Don't Know"], 
      answer: "To cook" 
    },
    { 
      question: "Choose the correct conjugation: Si j'avais de l'argent, je ................ une nouvelle voiture.", 
      options: ["achète", "achèterai", "achèterais", "Don't Know"], 
      answer: "achèterais" 
    },
    { 
      question: "Identify the past participle: Écrire -> ................", 
      options: ["Écrivé", "Écrit", "Écrivant", "Don't Know"], 
      answer: "Écrit" 
    },
  ],
};

const getRandomQuestions = (section: "beginner" | "intermediate" | "hard", count: number) => {
  const sectionQuestions = questions[section];
  return sectionQuestions.sort(() => 0.5 - Math.random()).slice(0, count);
};

const QuizScreen = () => {
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState({ total: 0, correct: 0 });
  const router = useRouter();

  useEffect(() => {
    // Use the global questions object
    const predefinedQuestions = [
      ...questions.beginner,
      ...questions.intermediate,
      ...questions.hard
    ];

    const quizzesRef = dbRef(getDatabase(), 'quizzes');
    onValue(quizzesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const adminQuestions = Object.values(data).flatMap((quiz: any) => 
          Object.values(quiz.questions || {}).map((q: any) => ({
            question: q.text,
            options: [...q.options, "Don't Know"],
            answer: q.correctAnswer,
            context: 'Admin Created'
          }))
        );
        setQuizQuestions([...predefinedQuestions, ...adminQuestions]);
      }
    });
  }, []);

  const handleAnswer = async (selectedOption: string) => {
    const currentQ = quizQuestions[currentQuestion];
    const isCorrect = selectedOption === currentQ.answer;

    // Update final score as we go
    setFinalScore(prev => ({
      total: prev.total + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct
    }));

    const user = getAuth().currentUser;
    if (user) {
      const db = getDatabase();
      const userRef = dbRef(db, `users/${user.uid}`);
      
      try {
        if (selectedOption === "Don't Know") {
          await update(userRef, {
            [`responses/quiz/${currentQ.context || ''}/${currentQuestion}`]: {
              question: currentQ.question,
              unmarked: true,
              skippedAt: new Date().toISOString()
            }
          });
        } else {
          await update(userRef, {
            [`responses/quiz/${currentQ.context || ''}/${currentQuestion}`]: {
              question: currentQ.question,
              userAnswer: selectedOption,
              correctAnswer: currentQ.answer,
              isCorrect,
              timestamp: new Date().toISOString()
            }
          });
        }

        if (currentQuestion === quizQuestions.length - 1) {
          await saveFinalResult();
          setShowResults(true);
        } else {
          setCurrentQuestion(prev => prev + 1);
        }
        setSelectedAnswer(null);
      } catch (error) {
        console.error('Error saving quiz response:', error);
        Alert.alert('Error', 'Failed to save progress');
      }
    }
  };

  const saveFinalResult = async () => {
    const user = getAuth().currentUser;
    if (!user) return;

    const db = getDatabase();
    const userRef = dbRef(db, `users/${user.uid}`);
    
    // Calculate scores per section
    const beginnerScore = quizQuestions
      .filter(q => q.context === 'beginner')
      .reduce((acc, q) => acc + (selectedAnswer === q.answer ? 1 : 0), 0);
    
    const intermediateScore = quizQuestions
      .filter(q => q.context === 'intermediate')
      .reduce((acc, q) => acc + (selectedAnswer === q.answer ? 1 : 0), 0);
    
    const hardScore = quizQuestions
      .filter(q => q.context === 'hard')
      .reduce((acc, q) => acc + (selectedAnswer === q.answer ? 1 : 0), 0);
    
    const adminScore = quizQuestions
      .filter(q => q.context === 'Admin Created')
      .reduce((acc, q) => acc + (selectedAnswer === q.answer ? 1 : 0), 0);

    const totalCorrect = finalScore.correct;
    const accuracy = (totalCorrect / finalScore.total) * 100;
    
    // New categorization logic based on accuracy
    let userLevel = "beginner";
    if (accuracy > 50) {
      userLevel = "advanced";
    } else if (accuracy > 25) {
      userLevel = "intermediate";
    }

    try {
      await update(userRef, {
        'quiz_results': {
          scores: {
            beginner: beginnerScore,
            intermediate: intermediateScore,
            hard: hardScore,
            admin: adminScore
          },
          details: {
            totalQuestions: finalScore.total,
            correctAnswers: totalCorrect,
            accuracy: `${accuracy.toFixed(1)}%`,
            userLevel,
            sectionScores: {
              beginnerAccuracy: `${((beginnerScore / quizQuestions.filter(q => q.context === 'beginner').length) * 100).toFixed(1)}%`,
              intermediateAccuracy: `${((intermediateScore / quizQuestions.filter(q => q.context === 'intermediate').length) * 100).toFixed(1)}%`,
              hardAccuracy: `${((hardScore / quizQuestions.filter(q => q.context === 'hard').length) * 100).toFixed(1)}%`,
              adminAccuracy: `${((adminScore / quizQuestions.filter(q => q.context === 'Admin Created').length) * 100).toFixed(1)}%`
            }
          },
          completedAt: new Date().toISOString()
        },
        'user_level': userLevel,
        'accuracy_percentage': accuracy.toFixed(1)
      });
    } catch (error) {
      console.error('Error saving final results:', error);
      Alert.alert('Error', 'Failed to save your results');
    }
  };

  if (showResults) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Quiz Complete!</Text>
          
          <Text style={styles.levelText}>
            Level: {
              finalScore.correct / finalScore.total * 100 <= 25 ? "Beginner" :
              finalScore.correct / finalScore.total * 100 <= 50 ? "Intermediate" : 
              "Advanced"
            }
          </Text>

          <Text style={styles.scoreText}>
            Score: {finalScore.correct} / {finalScore.total}
          </Text>
          
          <Text style={styles.accuracyText}>
            Accuracy: {((finalScore.correct / finalScore.total) * 100).toFixed(1)}%
          </Text>

          <Text style={styles.feedbackText}>
            {finalScore.correct / finalScore.total * 100 <= 25 
              ? "Keep practicing! You're at the beginning of your journey."
              : finalScore.correct / finalScore.total * 100 <= 50 
              ? "Good progress! You're at an intermediate level."
              : "Excellent work! You've reached an advanced level!"
            }
          </Text>

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => router.replace('./Welcome')}
          >
            <Text style={styles.continueButtonText}>Return to Welcome</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.questionText}>
        Question {currentQuestion + 1} of {quizQuestions.length}
      </Text>
      <Text style={styles.question}>{quizQuestions[currentQuestion]?.question}</Text>

      {quizQuestions[currentQuestion]?.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            selectedAnswer === option && styles.selectedOption
          ]}
          onPress={() => handleAnswer(option)}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:  'rgba(10, 0, 1, 0.91)',  // Dark background for a sleek, modern feel
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    margin: 30,
    marginBottom:50,
    textAlign: 'center',
  },
  question: {
    fontSize: 24,
    textAlign:'center',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 20,
    paddingLeft: 10,
    margin: 20,
  },

  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor:  'rgba(57, 54, 54, 0.84)',  // Dark option button background for uniformity
    borderRadius: 12,
    padding: 16,
    margin: 12,
    alignItems: 'center',  // Centering option text
    justifyContent: 'center', 

  },
  
  selectedOption: {
    backgroundColor: '#333333',  // Darker background for selected options
    borderColor: '#F04A63',  // Accent color for selected options

    borderWidth: 2,
    // backgroundColor:'rgb(12, 239, 76)',

  },
    optionText: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',  // Center text within the button
  },
  continueButton: {
    backgroundColor: '#F04A63',  // Accent color for the continue button
    padding: 16,
    borderRadius: 15,
    fontSize: 18,
    margin:3,

    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#3C3C3C',  // Darker gray for the disabled button
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 20,
    color: '#FFFFFF',
    marginVertical: 10,
  },
  accuracyText: {
    fontSize: 18,
    color: '#58cc02',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dontKnowButton: {
    flex: 1,
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dontKnowOption: {
    backgroundColor: '#334155',
  },
  dontKnowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  levelText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
  },
});

export default QuizScreen;
