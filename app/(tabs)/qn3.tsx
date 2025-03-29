import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database";
import { useRouter } from "expo-router";

// Define the possible target use options
type TargetUseOption =
  | "grammar_correction"
  | "text_coherent"
  | "easier_understanding"
  | "paraphrasing"
  | "formal_tone"
  | "neutral_tone";

// Define the descriptions for each option
const targetUseDescriptions: Record<TargetUseOption, string> = {
  grammar_correction: "I want to improve my grammar",
  text_coherent: "I want to learn to express myself clearly",
  easier_understanding: "I want to understand French more easily",
  paraphrasing: "I want to learn different ways to express myself",
  formal_tone: "I want to learn formal French",
  neutral_tone: "I want a neutral communication style",
};

const ModelSettingsScreen = () => {
  const [selectedTargetUse, setSelectedTargetUse] =
    useState<TargetUseOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserModelData();
  }, []);

  const loadUserModelData = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      // Use the correct path structure
      const dbRef = ref(
        getDatabase(),
        `users/${user.uid}/model_data/target_uses`
      );
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        setSelectedTargetUse(snapshot.val());
      } else {
        // Set a default selection if none exists
        const defaultTargetUse: TargetUseOption = "easier_understanding";
        await saveModelData(defaultTargetUse);
        setSelectedTargetUse(defaultTargetUse);
      }
    } catch (error) {
      console.error("Error loading model data:", error);
      Alert.alert("Error", "Failed to load preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const saveModelData = async (targetUse: TargetUseOption) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      // Reference directly to the target_uses field
      const dbRef = ref(
        getDatabase(),
        `users/${user.uid}/model_data/target_uses`
      );

      // Set the target use as a simple string
      await set(dbRef, targetUse);

      Alert.alert("Success", "Learning goal saved successfully");
    } catch (error) {
      console.error("Error saving model data:", error);
      Alert.alert("Error", "Failed to save preferences");
    }
  };

  const selectGoal = (targetUse: TargetUseOption) => {
    setSelectedTargetUse(targetUse);
    saveModelData(targetUse);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <Text style={styles.title}>What is your primary learning goal?</Text>
        <Text style={styles.subtitle}>
          Select one option that best describes your goal
        </Text>

        <View style={styles.optionsContainer}>
          {Object.entries(targetUseDescriptions).map(
            ([useCase, description]) => (
              <TouchableOpacity
                key={useCase}
                style={[
                  styles.optionCard,
                  selectedTargetUse === useCase && styles.optionCardSelected,
                ]}
                onPress={() => selectGoal(useCase as TargetUseOption)}
              >
                <View style={styles.optionContent}>
                  <View style={styles.iconContainer}>
                    <Feather
                      name={
                        useCase === "grammar_correction"
                          ? "edit-2"
                          : useCase === "text_coherent"
                          ? "align-left"
                          : useCase === "easier_understanding"
                          ? "book-open"
                          : useCase === "paraphrasing"
                          ? "repeat"
                          : useCase === "formal_tone"
                          ? "briefcase"
                          : "message-square"
                      }
                      size={20}
                      color="#000000"
                    />
                  </View>
                  <Text style={styles.optionText}>{description}</Text>
                </View>
                <View style={styles.radioContainer}>
                  <View style={styles.radioOuter}>
                    {selectedTargetUse === useCase && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => {
          router.replace("/(tabs)/quiz");
        }}
      >
        <Text style={styles.nextButtonText}>Continue to Quiz</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "flex-start",
    paddingTop: 30,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 30,
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#BBBBBB",
    marginBottom: 30,
    textAlign: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: "rgb(255, 255, 255)",
    borderRadius: 25,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionCardSelected: {
    backgroundColor: "rgb(255, 225, 225)",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    flex: 1,
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#000000",
  },
  nextButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 15,
    alignItems: "center",
    backgroundColor: "rgb(240, 74, 99)",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ModelSettingsScreen;
