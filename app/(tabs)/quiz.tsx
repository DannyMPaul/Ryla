import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

const questions = {
  beginner: [
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
    { question: "Hier, nous ................ un film intéressant.", options: ["regardons", "avons regardé", "regardions"], answer: "avons regardé" },
    { question: "She is smarter than her brother.", options: ["Elle est plus intelligente que son frère.", "Elle est moins intelligente que son frère.", "Elle est aussi intelligente que son frère."], answer: "Elle est plus intelligente que son frère." },
    { question: "What does 'faire la cuisine' mean?", options: ["To eat in the kitchen", "To cook", "To clean the kitchen"], answer: "To cook" },
    { question: "Choose the correct conjugation: Si j'avais de l'argent, je ................ une nouvelle voiture.", options: ["achète", "achèterai", "achèterais"], answer: "achèterais" },
    { question: "Identify the past participle: Écrire -> ................", options: ["Écrivé", "Écrit", "Écrivant"], answer: "Écrit" },
  ],
};

const getRandomQuestions = (section: "beginner" | "intermediate" | "hard", count: number) => {
  const sectionQuestions = questions[section];
  return sectionQuestions.sort(() => 0.5 - Math.random()).slice(0, count);
};

const Quiz = () => {
  const [score, setScore] = useState({ beginner: 0, intermediate: 0, hard: 0 });
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [section, setSection] = useState<"beginner" | "intermediate" | "hard">("beginner");
  const [quizQuestions, setQuizQuestions] = useState(() => getRandomQuestions(section, 5));
  const [quizCompleted, setQuizCompleted] = useState(false);
  const router = useRouter();

  const handleAnswer = (answer: string) => {
    const isCorrect = answer === quizQuestions[currentQuestion].answer;
    if (isCorrect) {
      setScore((prev) => ({ ...prev, [section]: prev[section] + 1 }));
    }

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      if (section === "beginner") {
        setSection("intermediate");
        setQuizQuestions(getRandomQuestions("intermediate", 5));
        setCurrentQuestion(0);
      } else if (section === "intermediate") {
        setSection("hard");
        setQuizQuestions(getRandomQuestions("hard", 5));
        setCurrentQuestion(0);
      } else {
        setQuizCompleted(true);
      }
    }
  };

  const calculateResult = () => {
    const totalScore = score.beginner + score.intermediate + score.hard;
    if (totalScore <= 5) return "Beginner";
    if (totalScore > 5 && totalScore <= 7) return "Intermediate";
    return "Advanced";
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
                ]}
                onPress={() => setSelectedAnswer(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
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
            {`Your French level is: ${calculateResult()}`}
          </Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              router.replace('/Welcome');
            }}
          >
            <Text style={styles.continueButtonText}>Lets Begin the Journey!</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:  'rgba(78, 13, 22, 0.23)',  // Dark background for a sleek, modern feel
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
    alignItems: 'center',
    margin: 20,
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
});

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#111b21',
//     padding: 20,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//     margin: 20,
//     textAlign: 'center',
//   },
//   question: {
//     fontSize: 18,
//     color: '#FFFFFF',
//     marginTop:10,
//     marginBottom: 20,
//     marginLeft:10,
//   },
//   scrollView: {
//     flex: 1,
//     marginBottom: 20,
//   },
//   optionButton: {
//     backgroundColor: '#1f2937',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//   },
//   selectedOption: {
//     backgroundColor: '#2a3a4a',
//     borderColor: '#4B94D8',
//     borderWidth: 2,
//   },
//   optionText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//   },
//   continueButton: {
//     backgroundColor: '#58cc02',
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   continueButtonDisabled: {
//     backgroundColor: '#2a3a4a',
//   },
//   continueButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   resultContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   resultText: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//     marginBottom: 20,
//   },
// });

export default Quiz;
