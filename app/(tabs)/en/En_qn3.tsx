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

interface TargetUse {
  selected: boolean;
  description: string;
}

interface LanguageSettings {
  [key: string]: {
    [key: string]: TargetUse;
  };
}

const defaultTargetUses: LanguageSettings = {
  en: {
    grammar_correction: {
      selected: false,
      description: "I want to improve my grammar",
    },
    text_coherent: {
      selected: false,
      description: "I want to learn to express myself clearly",
    },
    easier_understanding: {
      selected: false,
      description: "I want to understand English more easily",
    },
    paraphrasing: {
      selected: false,
      description: "I want to learn different ways to express myself",
    },
    formal_tone: {
      selected: false,
      description: "I want to learn formal English",
    },
    neutral_tone: {
      selected: false,
      description: "I want a neutral communication style",
    },
  },
};

const EnglishLearningGoalsScreen = () => {
  const [modelData, setModelData] =
    useState<LanguageSettings>(defaultTargetUses);
  const [selectedLanguage, setSelectedLanguage] = useState<"en">("en");
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

      const dbRef = ref(
        getDatabase(),
        `users/${user.uid}/englishModelData/target_uses`
      );
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        setModelData(snapshot.val());
      } else {
        await saveModelData(defaultTargetUses);
        setModelData(defaultTargetUses);
      }
    } catch (error) {
      console.error("Error loading model data:", error);
      Alert.alert("Error", "Failed to load preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const saveModelData = async (data: LanguageSettings) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const dbRef = ref(
        getDatabase(),
        `users/${user.uid}/englishModelData/target_uses`
      );
      await set(dbRef, data);
      Alert.alert("Success", "Learning goals saved successfully");
    } catch (error) {
      console.error("Error saving model data:", error);
      Alert.alert("Error", "Failed to save preferences");
    }
  };

  const toggleGoal = (useCase: string) => {
    const updatedData = { ...modelData };
    updatedData[selectedLanguage][useCase].selected =
      !updatedData[selectedLanguage][useCase].selected;
    setModelData(updatedData);
    saveModelData(updatedData);
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
        <Text style={styles.title}>What are your learning goals?</Text>

        <View style={styles.optionsContainer}>
          {Object.entries(modelData[selectedLanguage]).map(
            ([useCase, settings]) => (
              <TouchableOpacity
                key={useCase}
                style={[
                  styles.optionCard,
                  settings.selected && styles.optionCardSelected,
                ]}
                onPress={() => toggleGoal(useCase)}
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
                  <Text style={styles.optionText}>{settings.description}</Text>
                </View>
                <View style={styles.radioContainer}>
                  <View style={styles.radioOuter}>
                    {settings.selected && <View style={styles.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={async () => {
          await saveModelData(modelData);
          router.replace("../(tabs)/en/En_quiz");
        }}
      >
        <Text style={styles.nextButtonText}>
          Save Goals and proceed to the Quiz
        </Text>
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
    margin: 30,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
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

export default EnglishLearningGoalsScreen;
