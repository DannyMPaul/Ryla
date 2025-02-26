import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import SpeechPractice from "../../../components/SpeechPractice";

const { width } = Dimensions.get("window");

type ValidRoute =
  | "/Eng/Home"
  | "/Eng/q1"
  | "/Eng/q2"
  | "/Eng/q3"
  | "/Eng/welcome";

interface Lesson {
  id: string;
  title: string;
  type: "speaking" | "ai" | "regular" | "checkpoint" | "vocabulary";
  image: any;
  isCompleted: boolean;
  isLocked: boolean;
  route?: ValidRoute;
  speechPractice?: boolean;
}

interface Chapter {
  id: string;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lessons: Lesson[];
}

const EnglishHomeScreen = () => {
  const router = useRouter();
  const [progress] = useState(new Animated.Value(0));
  const [overallProgress, setOverallProgress] = useState(1);
  const [unlockedLessons, setUnlockedLessons] = useState(["1", "2"]); // Initially first two lessons unlocked
  const [showSpeechPractice, setShowSpeechPractice] = useState(false);

  // Add useEffect to check quiz completion status
  useEffect(() => {
    const checkQuizStatus = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getDatabase();
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (userData?.quizResponses?.engq1?.completed) {
          // If q1 is completed, unlock the next lesson
          setUnlockedLessons((prev) => [...prev, "3"]);
          setOverallProgress((prev) => prev + 1);
        }
      }
    };

    checkQuizStatus();
  }, []);

  // Update the chapter data to use unlockedLessons
  const chapter: Chapter = {
    id: "1",
    title: "English Basics",
    progress: 1 / 6,
    totalLessons: 6,
    completedLessons: 1,
    lessons: [
      {
        id: "1",
        title: "Introduction to English",
        type: "regular",
        image: require("../../../assets/images/english_intro.jpg"),
        isCompleted: true,
        isLocked: false,
        route: "/Eng/Home" as const,
      },
      {
        id: "2",
        title: "Basic Greetings",
        type: "speaking",
        image: require("../../../assets/images/greetings.jpg"),
        isCompleted: false,
        isLocked: !unlockedLessons.includes("2"),
        route: "/Eng/q1" as const,
        speechPractice: true,
      },
      {
        id: "3",
        title: "Common Phrases",
        type: "vocabulary",
        image: require("../../../assets/images/phrases.png"),
        isCompleted: false,
        isLocked: !unlockedLessons.includes("3"),
        route: "/Eng/q2" as const,
      },
      {
        id: "4",
        title: "Conversation Practice",
        type: "ai",
        image: require("../../../assets/images/conversation.png"),
        isCompleted: false,
        isLocked: !unlockedLessons.includes("4"),
        route: "/Eng/q3" as const,
      },
    ],
  };

  useEffect(() => {
    animateProgress();
  }, [overallProgress]);

  const animateProgress = () => {
    Animated.timing(progress, {
      toValue: overallProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const handleLessonComplete = () => {
    setOverallProgress((prev) => Math.min(prev + 1, 100));
  };

  const handleLessonPress = (lesson: Lesson) => {
    if (lesson.isLocked || !lesson.route) return;

    if (lesson.speechPractice) {
      setShowSpeechPractice(true);
    } else {
      router.push(lesson.route as any);
    }
  };

  const renderLesson = (lesson: Lesson, index: number) => {
    return (
      <View key={lesson.id} style={styles.lessonContainer}>
        <View style={styles.lessonLine} />
        <TouchableOpacity
          style={[
            styles.lessonButton,
            lesson.isCompleted && styles.lessonCompleted,
            lesson.isLocked && styles.lessonLocked,
          ]}
          onPress={() => handleLessonPress(lesson)}
          disabled={lesson.isLocked}
        >
          <Image source={lesson.image} style={styles.lessonImage} />
          {lesson.isCompleted && (
            <View style={styles.checkmark}>
              <Feather name="check" size={16} color="#fff" />
            </View>
          )}
          {lesson.isLocked && (
            <View style={styles.lock}>
              <Feather name="lock" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.lessonDetails}>
          {lesson.type === "speaking" && (
            <View style={styles.lessonTypeBadge}>
              <Feather name="mic" size={12} color="#fff" />
              <Text style={styles.lessonTypeBadgeText}>SPEAKING PRACTICE</Text>
            </View>
          )}
          {lesson.type === "ai" && (
            <View style={[styles.lessonTypeBadge, styles.aiBadge]}>
              <Feather name="message-circle" size={12} color="#fff" />
              <Text style={styles.lessonTypeBadgeText}>AI CONVERSATIONS</Text>
            </View>
          )}
          {lesson.type === "vocabulary" && (
            <View style={[styles.lessonTypeBadge, styles.vocabBadge]}>
              <Feather name="book" size={12} color="#fff" />
              <Text style={styles.lessonTypeBadgeText}>VOCABULARY</Text>
            </View>
          )}
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>English for Beginners</Text>

      <Animated.View
        style={[
          styles.progressBar,
          {
            width: progress.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />

      <TouchableOpacity style={styles.premiumBanner}>
        <View style={styles.percentBadge}>
          <Text style={styles.percentSymbol}>%</Text>
        </View>
        <View style={styles.premiumContent}>
          <Text style={styles.premiumTitle}>
            Unlock all English lessons with 70% off Premium
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.chapterHeader}>
        <Text style={styles.chapterTitle}>{chapter.title}</Text>
        <Text style={styles.chapterProgress}>
          {chapter.completedLessons}/{chapter.totalLessons} lessons completed
        </Text>
      </View>

      <View style={styles.lessonsContainer}>
        {chapter.lessons.map((lesson, index) => renderLesson(lesson, index))}

        <View style={styles.checkpointContainer}>
          <View style={styles.checkpointIcon}>
            <Feather name="award" size={24} color="#FFD700" />
          </View>
          <View style={styles.checkpointContent}>
            <Text style={styles.checkpointTitle}>
              English Basics Checkpoint
            </Text>
            <Text style={styles.checkpointSubtitle}>
              Test your English skills to unlock Intermediate lessons
            </Text>
          </View>
        </View>
      </View>

      <SpeechPractice
        visible={showSpeechPractice}
        onClose={() => setShowSpeechPractice(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    padding: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#58cc02",
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  premiumBanner: {
    backgroundColor: "#1a74e4",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  percentBadge: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  percentSymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a74e4",
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  chapterHeader: {
    padding: 16,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  chapterProgress: {
    fontSize: 16,
    color: "#666",
  },
  lessonsContainer: {
    padding: 16,
  },
  lessonContainer: {
    flexDirection: "row",
    marginBottom: 24,
    alignItems: "center",
  },
  lessonLine: {
    width: 2,
    height: "100%",
    backgroundColor: "#E5E7EB",
    position: "absolute",
    left: 29,
    top: 30,
  },
  lessonButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  lessonCompleted: {
    borderColor: "#58cc02",
  },
  lessonLocked: {
    borderColor: "#ccc",
    opacity: 0.7,
  },
  lessonImage: {
    width: "100%",
    height: "100%",
  },
  checkmark: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#58cc02",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  lock: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#666",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonDetails: {
    marginLeft: 12,
    flex: 1,
  },
  lessonTypeBadge: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  aiBadge: {
    backgroundColor: "#3b82f6",
  },
  vocabBadge: {
    backgroundColor: "#10b981",
  },
  lessonTypeBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  checkpointContainer: {
    backgroundColor: "#F0F7FF",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  checkpointIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkpointContent: {
    flex: 1,
  },
  checkpointTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  checkpointSubtitle: {
    fontSize: 14,
    color: "#666",
  },
});

export default EnglishHomeScreen;
