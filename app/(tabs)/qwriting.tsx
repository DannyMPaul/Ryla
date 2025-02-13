import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { getDatabase, ref as dbRef, update, get } from "firebase/database";
import { EXPO_PUBLIC_OPENAI_API_KEY } from "../../app/config/env";

type ProficiencyLevel = "beginner" | "intermediate" | "expert";

const getQuizProficiencyLevel = (accuracy: number): ProficiencyLevel => {
  if (accuracy <= 25) return "beginner";
  if (accuracy <= 50) return "intermediate";
  return "expert";
};

const WORD_LIMIT = 120;
const EVALUATION_PROMPT = `As a French language expert, evaluate the following text written in French. 
Analyze grammar, vocabulary, sentence structure, and overall coherence. 
Categorize the writer as:
- Beginner (A1-A2): Basic communication, simple sentences, common mistakes
- Intermediate (B1-B2): Good flow, some complex structures, occasional errors
- Expert (C1-C2): Sophisticated vocabulary, complex structures, natural flow
Respond with ONLY ONE of these words: "beginner", "intermediate", or "expert"`;

const getLowestProficiency = (
  level1: ProficiencyLevel,
  level2: ProficiencyLevel
): ProficiencyLevel => {
  const levels: { [key: string]: number } = {
    beginner: 0,
    intermediate: 1,
    expert: 2,
  };

  return levels[level1] <= levels[level2] ? level1 : level2;
};

const WritingAssessmentScreen = () => {
  const [text, setText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [proficiencyLevel, setProficiencyLevel] =
    useState<ProficiencyLevel>("beginner");
  const [actualProficiency, setActualProficiency] =
    useState<ProficiencyLevel>("beginner");
  const router = useRouter();
  const [quizAccuracy, setQuizAccuracy] = useState<number | null>(null);
  const [quizLevel, setQuizLevel] = useState<ProficiencyLevel | null>(null);

  const countWords = (text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    setWordCount(countWords(newText));
  };

  const evaluateWriting = async (text: string) => {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${EXPO_PUBLIC_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: EVALUATION_PROMPT,
              },
              {
                role: "user",
                content: text,
              },
            ],
            temperature: 0.3,
            max_tokens: 50,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || "Evaluation failed");

      return data.choices[0].message.content
        .toLowerCase()
        .trim() as ProficiencyLevel;
    } catch (error) {
      console.error("Evaluation error:", error);
      throw error;
    }
  };

  const determineActualProficiency = async (writingLevel: ProficiencyLevel) => {
    const user = getAuth().currentUser;
    if (!user) return writingLevel;

    const db = getDatabase();

    try {
      const quizLevelRef = dbRef(
        db,
        `users/${user.uid}/quiz_details/finalLevel`
      );
      const snapshot = await get(quizLevelRef);
      const quizLevel = snapshot.val();

      if (!quizLevel) {
        console.log("No quiz results found");
        return writingLevel;
      }

      const lowestLevel = getLowestProficiency(writingLevel, quizLevel);

      const modelDataRef = dbRef(db, `users/${user.uid}/model_data`);
      await update(modelDataRef, {
        proficiency_level: lowestLevel,
        quiz_level: quizLevel,
        writing_level: writingLevel,
        last_updated: new Date().toISOString(),
      });

      setQuizLevel(quizLevel);

      return lowestLevel;
    } catch (error) {
      console.error("Error determining actual proficiency:", error);
      return writingLevel;
    }
  };

  const handleSubmit = async () => {
    if (wordCount < WORD_LIMIT) {
      Alert.alert(
        "Not enough words",
        `Please write at least ${WORD_LIMIT} words.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const writingLevel = await evaluateWriting(text);
      setProficiencyLevel(writingLevel);

      const finalProficiency = await determineActualProficiency(writingLevel);
      setActualProficiency(finalProficiency);

      const user = getAuth().currentUser;
      if (user) {
        const db = getDatabase();
        const userRef = dbRef(db, `users/${user.uid}`);

        await update(userRef, {
          writing_assessment: {
            text,
            wordCount,
            proficiencyLevel: writingLevel,
            timestamp: new Date().toISOString(),
          },
          writing_level: writingLevel,
          actual_proficiency: finalProficiency,
        });
      }

      setShowResults(true);
    } catch (error) {
      Alert.alert("Error", "Failed to evaluate writing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResults) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Assessment Complete!</Text>

          <Text style={styles.levelText}>
            Writing Level:{" "}
            {proficiencyLevel.charAt(0).toUpperCase() +
              proficiencyLevel.slice(1)}
          </Text>

          {quizLevel && (
            <Text style={styles.levelText}>
              Quiz Level:{" "}
              {quizLevel.charAt(0).toUpperCase() + quizLevel.slice(1)}
              {quizAccuracy !== null && ` (${quizAccuracy.toFixed(1)}%)`}
            </Text>
          )}

          <Text style={styles.levelText}>
            Overall Level:{" "}
            {actualProficiency.charAt(0).toUpperCase() +
              actualProficiency.slice(1)}
          </Text>

          <Text style={styles.scoreText}>Words written: {wordCount}</Text>

          <Text style={styles.feedbackText}>
            {actualProficiency === "beginner"
              ? "Keep practicing! You're building a good foundation."
              : actualProficiency === "intermediate"
              ? "Great progress! You're developing strong skills."
              : "Excellent work! You demonstrate advanced capabilities."}
          </Text>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.replace("./Welcome")}
          >
            <Text style={styles.continueButtonText}>Return to Welcome</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Writing Assessment</Text>

      <Text style={styles.instructions}>
        Write a paragraph in French about your daily routine, hobbies, or future
        plans. Minimum {WORD_LIMIT} words.
      </Text>

      <TextInput
        style={styles.textInput}
        multiline
        placeholder="Start writing here..."
        placeholderTextColor="#666"
        value={text}
        onChangeText={handleTextChange}
      />

      <Text style={styles.wordCount}>
        Words: {wordCount}/{WORD_LIMIT}
      </Text>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (wordCount < WORD_LIMIT || isSubmitting) &&
            styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={wordCount < WORD_LIMIT || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(10, 0, 1, 0.91)",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
  },
  instructions: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
  },
  textInput: {
    backgroundColor: "rgba(57, 54, 54, 0.84)",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    height: 200,
    textAlignVertical: "top",
    marginBottom: 10,
    fontSize: 16,
  },
  wordCount: {
    color: "#FFFFFF",
    textAlign: "right",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#F04A63",
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#3C3C3C",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  levelText: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 18,
    color: "#FFFFFF",
    marginVertical: 10,
  },
  feedbackText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: "#F04A63",
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    width: "100%",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default WritingAssessmentScreen;
