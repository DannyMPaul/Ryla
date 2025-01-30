import React, { useState } from 'react';
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
import { getDatabase, ref as dbRef, update } from 'firebase/database';

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
      options: ["regardons", "avons regardé", "regardions"], 
      answer: "avons regardé",
      context: "Past tense usage" 
    },
    { question: "Translate into English: Bonjour.", options: ["Goodbye", "Hello", "Please"], answer: "Hello" },
    { question: "What does 'merci' mean?", options: ["Thank you", "Yes", "Goodbye"], answer: "Thank you" },
    { question: "Choose the correct article for 'pomme':", options: ["Le", "La", "Les"], answer: "La" },
    { question: "Which is a French color?", options: ["Rouge", "Livre", "Porte"], answer: "Rouge" },
    { question: "J'aime ................... chocolat.", options: ["le", "la", "les"], answer: "le" },
  ],
  intermediate: [
    { question: "J'aime beaucoup ................ étudiant. Il est très sympathique.", options: ["cette", "ce", "cet"], answer: "cet" },
    { question: "Nous ................ au cinéma demain.", options: ["allons", "allez", "va"], answer: "allons" },
    { question: "Translate: Je voudrais un café, s'il vous plaît.", options: ["I want a coffee, please.", "I would like a coffee, please.", "I am drinking a coffee, please."], answer: "I would like a coffee, please." },
    { question: "Elle parle ................ son professeur.", options: ["à", "avec", "de"], answer: "à" },
    { question: "Which sentence is correct?", options: ["Elle a un chat noir.", "Elle as un chat noir.", "Elle a une chat noir."], answer: "Elle a un chat noir." },
  ],
  hard: [
    { question: "She is smarter than her brother.", options: ["Elle est plus intelligente que son frère.", "Elle est moins intelligente que son frère.", "Elle est aussi intelligente que son frère."], answer: "Elle est plus intelligente que son frère." },
    { question: "What does 'faire la cuisine' mean?", options: ["To eat in the kitchen", "To cook", "To clean the kitchen"], answer: "To cook" },
    { question: "Choose the correct conjugation: Si j'avais de l'argent, je ................ une nouvelle voiture.", options: ["achète", "achèterai", "achèterais"], answer: "achèterais" },
    { question: "Identify the past participle: Écrire -> ................", options: ["Écrivé", "Écrit", "Écrivant"], answer: "Écrit" },
  ],
};

const getRandomQuestions = (section: "beginner" | "intermediate" | "hard", count: number) => {
  const sectionQuestions = questions[section];
  return sectionQuestions.sort(() => 0.5 - Math.random()).slice(0, count).map(q => ({
    ...q,
    options: [...q.options, "Don't Know"]
  }));
};

const Quiz = () => {
  const [score, setScore] = useState({ beginner: 0, intermediate: 0, hard: 0 });
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [section, setSection] = useState<"beginner" | "intermediate" | "hard">("beginner");
  const [quizQuestions, setQuizQuestions] = useState(() => getRandomQuestions(section, 5));
  const [quizCompleted, setQuizCompleted] = useState(false);
  const router = useRouter();
  const auth = getAuth();

  const saveFinalResult = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const userRef = dbRef(db, `users/${user.uid}`);
    const finalLevel = calculateResult();
    const totalScore = score.beginner + score.intermediate + score.hard;
    
    try {
      await update(userRef, {
        'model_data': {
          proficiency_level: finalLevel.toLowerCase(),
          lang_to_learn: 'fr'
        },
        'quiz_details': {
          finalLevel,
          totalScore,
          scores: {
            beginner: score.beginner,
            intermediate: score.intermediate,
            hard: score.hard
          },
          details: {
            totalQuestions: 15,
            correctAnswers: totalScore,
            accuracy: `${((totalScore / 15) * 100).toFixed(1)}%`
          },
          completedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error saving final results:', error);
      Alert.alert('Error', 'Failed to save your results');
    }
  };

  const handleAnswer = async (answer: string) => {
    const user = auth.currentUser;
    
    if (user) {
      const db = getDatabase();
      const userRef = dbRef(db, `users/${user.uid}`);
      
      try {
        if (answer === "Don't Know") {
          await update(userRef, {
            [`responses/quiz/${section}/${currentQuestion}`]: {
              question: quizQuestions[currentQuestion].question,
              unmarked: true,
              skippedAt: new Date().toISOString()
            }
          });
        } else {
          const isCorrect = answer === quizQuestions[currentQuestion].answer;
          await update(userRef, {
            [`responses/quiz/${section}/${currentQuestion}`]: {
              question: quizQuestions[currentQuestion].question,
              userAnswer: answer,
              correctAnswer: quizQuestions[currentQuestion].answer,
              isCorrect,
              timestamp: new Date().toISOString()
            }
          });

          if (isCorrect) {
            setScore((prev) => ({ ...prev, [section]: prev[section] + 1 }));
            
            // Store the learned word
            await update(userRef, {
              [`learnedWords/${new Date().getTime()}`]: {
                french: quizQuestions[currentQuestion].question,
                english: answer,
                learnedAt: new Date().toISOString(),
                section: section,
                context: quizQuestions[currentQuestion].context || ''
              }
            });
          }
        }

        if (currentQuestion === quizQuestions.length - 1) {
          if (section === "hard") {
            await saveFinalResult();
            setQuizCompleted(true);
          } else {
            if (section === "beginner") {
              setSection("intermediate");
              setQuizQuestions(getRandomQuestions("intermediate", 5));
            } else if (section === "intermediate") {
              setSection("hard");
              setQuizQuestions(getRandomQuestions("hard", 5));
            }
            setCurrentQuestion(0);
          }
        } else {
          setCurrentQuestion((prev) => prev + 1);
        }
        setSelectedAnswer(null);
      } catch (error) {
        console.error('Error saving quiz response:', error);
        Alert.alert('Error', 'Failed to save progress');
      }
    }
  };

  const calculateResult = () => {
    const totalScore = score.beginner + score.intermediate + score.hard;
    if (totalScore <= 5) return "beginner";
    if (totalScore > 5 && totalScore <= 7) return "intermediate";
    return "advanced";
  };

  return (
    <SafeAreaView style={styles.container}>
      {!quizCompleted ? (
        <>
          <Text style={styles.title}>{`Section: ${section.toUpperCase()}`}</Text>
          <Text style={styles.question}>{quizQuestions[currentQuestion].question}</Text>
          <ScrollView style={styles.scrollView}>
            {quizQuestions[currentQuestion].options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === option && styles.selectedOption,
                  option === "Don't Know" && styles.dontKnowOption,
                ]}
                onPress={() => setSelectedAnswer(option)}
              >
                <Text style={[
                  styles.optionText,
                  option === "Don't Know" && styles.dontKnowText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedAnswer && styles.continueButtonDisabled,
            ]}
            disabled={!selectedAnswer}
            onPress={() => handleAnswer(selectedAnswer!)}
          >
            <Text style={styles.continueButtonText}>NEXT</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            Your French level is: {calculateResult()}
          </Text>
          <Text style={styles.scoreText}>
            Total Score: {score.beginner + score.intermediate + score.hard}/15
          </Text>
          <Text style={styles.accuracyText}>
            Accuracy: {((score.beginner + score.intermediate + score.hard) / 15 * 100).toFixed(1)}%
          </Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              router.replace('/(tabs)/Home1');
            }}
          >
            <Text style={styles.continueButtonText}>Start Learning!</Text>
          </TouchableOpacity>
        </View>
      )}
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
});


export default Quiz;
