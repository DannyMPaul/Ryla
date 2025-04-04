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
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [proficiencyLevel, setProficiencyLevel] =
    useState<ProficiencyLevel>("beginner");
  const [actualProficiency, setActualProficiency] =
    useState<ProficiencyLevel>("beginner");
  const router = useRouter();
  const [quizAccuracy, setQuizAccuracy] = useState<number | null>(null);
  const [quizLevel, setQuizLevel] = useState<ProficiencyLevel | null>(null);
  const [apiErrorOccurred, setApiErrorOccurred] = useState(false);

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

  const evaluateWriting = async (text: string): Promise<ProficiencyLevel> => {
    // Set timeout to prevent waiting indefinitely for API response
    const timeoutPromise = new Promise<ProficiencyLevel>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Request timed out after 10 seconds"));
      }, 10000); // 10 second timeout
    });

    try {
      // Race condition between API call and timeout
      return await Promise.race([evaluateWithAPI(text), timeoutPromise]);
    } catch (error) {
      console.error("Evaluation error:", error);
      setApiErrorOccurred(true);

      // Default to intermediate on error
      return "intermediate";
    }
  };

  const evaluateWithAPI = async (text: string): Promise<ProficiencyLevel> => {
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
            model: "gpt-3.5-turbo",
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

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Details:", errorData);
        throw new Error(
          errorData.error?.message || `API request failed: ${response.status}`
        );
      }

      const data = await response.json();
      const result = data.choices[0]?.message?.content?.toLowerCase()?.trim();

      // Validate the response format
      if (!result || !["beginner", "intermediate", "expert"].includes(result)) {
        console.error("Invalid API response format:", result);
        throw new Error("Invalid response format from API");
      }

      return result as ProficiencyLevel;
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  };

  const evaluateWritingWithFallback = async (
    text: string
  ): Promise<ProficiencyLevel> => {
    if (isDevelopmentMode) {
      // Simulate API response based on text length and complexity
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
      const wordCount = text.split(/\s+/).length;
      const hasComplexStructures = /[;:(),]/.test(text);

      if (wordCount < 50) return "beginner";
      if (wordCount < 100 || !hasComplexStructures) return "intermediate";
      return "expert";
    }

    try {
      return await evaluateWriting(text);
    } catch (error) {
      console.error("Evaluation with fallback error:", error);
      setApiErrorOccurred(true);

      // Default to intermediate on any error
      return "intermediate";
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setApiErrorOccurred(false);

    try {
      const writingLevel = await evaluateWritingWithFallback(text);
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
            isDevelopmentMode,
            apiErrorOccurred, // Track if assessment was completed with error fallback
          },
          writing_level: writingLevel,
          actual_proficiency: finalProficiency,
        });
      }

      setShowResults(true);
    } catch (error) {
      console.error("Submission error:", error);
      // Even with errors, we proceed with intermediate level
      const defaultLevel: ProficiencyLevel = "intermediate";
      setProficiencyLevel(defaultLevel);

      const finalProficiency = await determineActualProficiency(
        defaultLevel
      ).catch((e) => {
        console.error("Error determining proficiency:", e);
        return defaultLevel;
      });

      setActualProficiency(finalProficiency);
      setApiErrorOccurred(true);

      // Save fallback assessment to database
      const user = getAuth().currentUser;
      if (user) {
        const db = getDatabase();
        const userRef = dbRef(db, `users/${user.uid}`);

        try {
          await update(userRef, {
            writing_assessment: {
              text,
              wordCount,
              proficiencyLevel: defaultLevel,
              timestamp: new Date().toISOString(),
              isDevelopmentMode,
              apiErrorOccurred: true,
              errorDetails:
                error instanceof Error ? error.message : "Unknown error",
            },
            writing_level: defaultLevel,
            actual_proficiency: finalProficiency,
          });
        } catch (dbError) {
          console.error("Database update error:", dbError);
        }
      }

      setShowResults(true);
    } finally {
      setIsSubmitting(false);
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

  if (showResults) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => router.replace("./Frn/welcome")}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Assessment Complete!</Text>

          {apiErrorOccurred && (
            <Text style={styles.errorText}>
              Note: We experienced a technical issue during evaluation, but
              we've provided an estimated level.
            </Text>
          )}

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
            <Text style={styles.continueButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => router.replace("./Welcome")}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Writing Assessment</Text>

      <Text style={styles.instructions}>
        Write a paragraph in French about your daily routine, hobbies, or future
        plans.
      </Text>

      <TextInput
        style={styles.textInput}
        multiline
        placeholder="Start writing here..."
        placeholderTextColor="#666"
        value={text}
        onChangeText={handleTextChange}
      />

      <Text style={styles.wordCount}>Words: {wordCount}</Text>

      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  skipButton: {
    backgroundColor: '#3C3C3C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  errorText: {
    fontSize: 14,
    color: "#F9A8A8",
    marginBottom: 20,
    textAlign: "center",
    padding: 10,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 8,
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
