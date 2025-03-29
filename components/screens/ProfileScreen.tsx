import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { getAuth, onAuthStateChanged, updateProfile, signOut } from "firebase/auth";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  update,
  get,
} from "firebase/database";

interface TargetUse {
  selected: boolean;
  description: string;
}

interface LanguageSettings {
  [key: string]: {
    [key: string]: TargetUse;
  };
}

interface UserData {
  name?: string;
  email?: string;
  lastLogin?: string;
  progress?: {
    currentQuestion: number;
    totalCorrect: number;
    hearts: number;
  };
  quizResults?: {
    finalLevel: string;
    totalScore: number;
    scores: {
      beginner: number;
      intermediate: number;
      hard: number;
    };
    details: {
      totalQuestions: number;
      correctAnswers: number;
      accuracy: string;
    };
    completedAt: string;
  };
  learnedWords?: {
    [key: string]: {
      french: string;
      english: string;
      learnedAt: string;
      section: string;
      context?: string;
    };
  };
  modelData?: {
    target_uses: LanguageSettings;
  };
  learningGoals?: {
    selectedMode?: string;
    requirements?: string[];
    lastUpdated?: string;
  };
}

const LearningGoalsSection = ({
  userData,
  onUpdate,
}: {
  userData: UserData | null;
  onUpdate: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMode, setSelectedMode] = useState(
    userData?.learningGoals?.selectedMode || ""
  );
  const [requirements, setRequirements] = useState<string[]>(
    userData?.learningGoals?.requirements || []
  );
  const [targetUses, setTargetUses] = useState<LanguageSettings | null>(
    userData?.modelData?.target_uses || null
  );
  const [isLoading, setIsLoading] = useState(false);

  const learningModes = [
    { id: "casual", label: "Casual Learning" },
    { id: "intensive", label: "Intensive Study" },
    { id: "professional", label: "Professional Development" },
  ];

  const requirementOptions = [
    "Grammar Focus",
    "Vocabulary Building",
    "Conversation Practice",
    "Business French",
    "Cultural Understanding",
    "Reading Comprehension",
    "Writing Skills",
  ];

  useEffect(() => {
    if (userData?.modelData?.target_uses) {
      setTargetUses(userData.modelData.target_uses);
    } else {
      loadTargetUses();
    }
  }, [userData]);

  const loadTargetUses = async () => {
    try {
      setIsLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getDatabase();
      // Update the path to match the DB structure
      const targetUsesRef = dbRef(
        db,
        `users/${user.uid}/model_data/target_uses`
      );
      const snapshot = await get(targetUsesRef);

      if (snapshot.exists()) {
        setTargetUses(snapshot.val());
      }
    } catch (error) {
      console.error("Error loading target uses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGoals = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const userRef = dbRef(db, `users/${user.uid}`);

    try {
      await update(userRef, {
        learningGoals: {
          selectedMode,
          requirements,
          lastUpdated: new Date().toISOString(),
        },
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error saving goals:", error);
    }
  };

  const handleSelectTargetUse = async (language: string, useCase: string) => {
    if (!targetUses) return;

    try {
      const updatedTargetUses = { ...targetUses };

      // Set all options to false first
      Object.keys(updatedTargetUses[language]).forEach((key) => {
        updatedTargetUses[language][key].selected = false;
      });

      // Set the selected option to true
      updatedTargetUses[language][useCase].selected = true;

      // Update state
      setTargetUses(updatedTargetUses);

      // Save to Firebase - use the correct path
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getDatabase();
      // Reference directly to the target_uses to avoid overwriting other data
      const targetUsesRef = dbRef(
        db,
        `users/${user.uid}/model_data/target_uses`
      );

      // Use set() with the specific path
      await update(targetUsesRef, updatedTargetUses);

      onUpdate();
    } catch (error) {
      console.error("Error updating target use:", error);
    }
  };

  // Helper function to get currently selected target use
  const getSelectedTargetUse = () => {
    if (!targetUses) return null;

    const targetUseEntry = Object.entries(targetUses.en).find(
      ([_, value]) => value.selected
    );
    return targetUseEntry
      ? {
          key: targetUseEntry[0],
          description: targetUseEntry[1].description,
        }
      : null;
  };

  // Get icon for target use
  const getIconForTargetUse = (useCase: string) => {
    switch (useCase) {
      case "grammar_correction":
        return "edit-2";
      case "text_coherent":
        return "align-left";
      case "easier_understanding":
        return "book-open";
      case "paraphrasing":
        return "repeat";
      case "formal_tone":
        return "briefcase";
      case "neutral_tone":
        return "message-square";
      default:
        return "target";
    }
  };

  const selectedTargetUse = getSelectedTargetUse();

  return (
    <View style={styles.statsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Learning Goals</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Feather
            name={isEditing ? "check" : "edit"}
            size={24}
            color="#58cc02"
          />
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <Text style={styles.label}>Primary Learning Goal:</Text>

          {targetUses && (
            <View style={styles.targetUsesContainer}>
              {Object.entries(targetUses.en).map(([useCase, settings]) => (
                <TouchableOpacity
                  key={useCase}
                  style={[
                    styles.targetUseOption,
                    settings.selected && styles.selectedTargetUse,
                  ]}
                  onPress={() => handleSelectTargetUse("en", useCase)}
                >
                  <View style={styles.targetUseContent}>
                    <Feather
                      name={getIconForTargetUse(useCase)}
                      size={18}
                      color={settings.selected ? "#FFFFFF" : "#BBBBBB"}
                      style={styles.targetUseIcon}
                    />
                    <Text
                      style={[
                        styles.targetUseText,
                        settings.selected && styles.selectedTargetUseText,
                      ]}
                    >
                      {settings.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.label, { marginTop: 16 }]}>Learning Mode:</Text>
          {learningModes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modeOption,
                selectedMode === mode.id && styles.selectedMode,
              ]}
              onPress={() => setSelectedMode(mode.id)}
            >
              <Text
                style={[
                  styles.modeText,
                  selectedMode === mode.id && styles.selectedModeText,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.label, { marginTop: 16 }]}>
            Additional Focus Areas:
          </Text>
          <View style={styles.requirementsContainer}>
            {requirementOptions.map((req) => (
              <TouchableOpacity
                key={req}
                style={[
                  styles.requirementOption,
                  requirements.includes(req) && styles.selectedRequirement,
                ]}
                onPress={() => {
                  setRequirements(
                    requirements.includes(req)
                      ? requirements.filter((r) => r !== req)
                      : [...requirements, req]
                  );
                }}
              >
                <Text
                  style={[
                    styles.requirementText,
                    requirements.includes(req) &&
                      styles.selectedRequirementText,
                  ]}
                >
                  {req}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveGoals}>
            <Text style={styles.saveButtonText}>Save Goals</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {selectedTargetUse && (
            <View style={styles.currentTargetUse}>
              <Text style={styles.goalLabel}>Primary Goal:</Text>
              <View style={styles.targetUseDisplay}>
                <Feather
                  name={getIconForTargetUse(selectedTargetUse.key)}
                  size={18}
                  color="#58cc02"
                  style={styles.targetUseDisplayIcon}
                />
                <Text style={styles.targetUseDescription}>
                  {selectedTargetUse.description}
                </Text>
              </View>
            </View>
          )}

          {userData?.learningGoals?.selectedMode && (
            <View style={styles.goalDisplay}>
              <Text style={styles.goalLabel}>Learning Mode:</Text>
              <Text style={styles.goalMode}>
                {
                  learningModes.find(
                    (m) => m.id === userData.learningGoals?.selectedMode
                  )?.label
                }
              </Text>

              {userData.learningGoals.requirements &&
                userData.learningGoals.requirements.length > 0 && (
                  <>
                    <Text style={[styles.goalLabel, { marginTop: 12 }]}>
                      Focus Areas:
                    </Text>
                    <View style={styles.requirementsList}>
                      {userData.learningGoals.requirements?.map((req) => (
                        <View key={req} style={styles.requirementTag}>
                          <Text style={styles.requirementTagText}>{req}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const ProfileScreen = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLearnedWordsOpen, setIsLearnedWordsOpen] = useState(false);
  const auth = getAuth();
  const storage = getStorage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || "");
        const nameFromEmail = user.email ? user.email.split("@")[0] : "";
        const displayName = user.displayName || nameFromEmail || "User";
        const formattedName = displayName
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        setUserName(formattedName);
        setProfileImage(user.photoURL);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      loadUserData();
    }
  }, [auth.currentUser]);

  const loadUserData = () => {
    if (auth.currentUser) {
      const db = getDatabase();
      const userRef = dbRef(db, `users/${auth.currentUser.uid}`);

      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        setUserData(data);
        console.log("User Data:", data);
      });
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const user = auth.currentUser;
      if (!user) return;

      const imageRef = storageRef(storage, `profileImages/${user.uid}`);
      await uploadBytes(imageRef, blob);

      const downloadURL = await getDownloadURL(imageRef);
      await updateProfile(user, { photoURL: downloadURL });

      setProfileImage(downloadURL);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileIcon}>
              <Feather name="user" size={40} color="#0066FF" />
              <View style={styles.addImageIcon}>
                <Feather name="plus-circle" size={24} color="#58cc02" />
              </View>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {userData?.learnedWords
              ? Object.keys(userData.learnedWords).length
              : 0}
          </Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>7</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      <LearningGoalsSection userData={userData} onUpdate={loadUserData} />

      <View style={styles.statsSection}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setIsLearnedWordsOpen(!isLearnedWordsOpen)}
        >
          <Text style={styles.sectionTitle}>Learned Words</Text>
          <Feather
            name={isLearnedWordsOpen ? "chevron-up" : "chevron-down"}
            size={24}
            color="#666666"
          />
        </TouchableOpacity>

        {isLearnedWordsOpen && (
          <View style={styles.wordsContainer}>
            {userData?.learnedWords ? (
              Object.entries(userData.learnedWords)
                .sort(
                  ([, a], [, b]) =>
                    new Date(b.learnedAt).getTime() -
                    new Date(a.learnedAt).getTime()
                )
                .map(([key, word], index) => (
                  <View key={key} style={styles.wordCard}>
                    <View style={styles.wordHeader}>
                      <Text style={styles.frenchWord}>{word.french}</Text>
                      <Text style={styles.sectionBadge}>{word.section}</Text>
                    </View>
                    <Text style={styles.englishWord}>{word.english}</Text>
                    {word.context && (
                      <Text style={styles.contextText}>{word.context}</Text>
                    )}
                    <Text style={styles.learnedDate}>
                      Learned: {new Date(word.learnedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))
            ) : (
              <Text style={styles.noWordsText}>
                Complete quizzes to start building your vocabulary!
              </Text>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.settingsButton}>
        <Feather name="settings" size={24} color="#666666" />
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Feather name="log-out" size={24} color="#FF3B30" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {userData?.quizResults && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>

          <View style={styles.quizStats}>
            <Text style={styles.quizStatLabel}>
              Level:{" "}
              <Text style={styles.quizStatValue}>
                {userData.quizResults.finalLevel}
              </Text>
            </Text>
            <Text style={styles.quizStatLabel}>
              Total Score:{" "}
              <Text style={styles.quizStatValue}>
                {userData.quizResults.totalScore}/15
              </Text>
            </Text>
            <Text style={styles.quizStatLabel}>
              Accuracy:{" "}
              <Text style={styles.statHighlight}>
                {userData.quizResults.details.accuracy}
              </Text>
            </Text>

            <View style={styles.sectionDivider} />

            <Text style={styles.quizStatLabel}>Section Scores:</Text>
            <Text style={styles.statDetail}>
              Beginner: {userData.quizResults.scores.beginner}/5
            </Text>
            <Text style={styles.statDetail}>
              Intermediate: {userData.quizResults.scores.intermediate}/5
            </Text>
            <Text style={styles.statDetail}>
              Advanced: {userData.quizResults.scores.hard}/5
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(78, 13, 22, 0.14)",
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 50,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  profileIcon: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  addImageIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#666666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 32,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0066FF",
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
  },
  statsSection: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  editContainer: {
    gap: 8,
  },
  label: {
    color: "#BBBBBB",
    fontSize: 16,
    marginBottom: 8,
  },
  targetUsesContainer: {
    gap: 8,
  },
  targetUseOption: {
    backgroundColor: "#2d3748",
    borderRadius: 8,
    padding: 12,
  },
  selectedTargetUse: {
    backgroundColor: "#58cc02",
  },
  targetUseContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  targetUseIcon: {
    marginRight: 12,
  },
  targetUseText: {
    color: "#BBBBBB",
    fontSize: 15,
  },
  selectedTargetUseText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  modeOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#2d3748",
    marginBottom: 8,
  },
  selectedMode: {
    backgroundColor: "#58cc02",
  },
  modeText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  selectedModeText: {
    fontWeight: "bold",
  },
  requirementsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  requirementOption: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: "#2d3748",
  },
  selectedRequirement: {
    backgroundColor: "#58cc02",
  },
  requirementText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  selectedRequirementText: {
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#58cc02",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  currentTargetUse: {
    marginBottom: 16,
  },
  targetUseDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2d3748",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  targetUseDisplayIcon: {
    marginRight: 12,
  },
  targetUseDescription: {
    color: "#FFFFFF",
    fontSize: 15,
  },
  goalDisplay: {
    gap: 8,
  },
  goalLabel: {
    color: "#BBBBBB",
    fontSize: 14,
  },
  goalMode: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  requirementsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  requirementTag: {
    backgroundColor: "#2d3748",
    padding: 8,
    borderRadius: 16,
  },
  requirementTagText: {
    color: "#58cc02",
    fontSize: 14,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 22,
  },
  settingsText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#FFFFFF",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    padding: 16,
    borderRadius: 8,
  },
  signOutText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#FF3B30",
  },
  quizStats: {
    gap: 8,
  },
  quizStatLabel: {
    color: "#BBBBBB",
    fontSize: 16,
  },
  quizStatValue: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  statHighlight: {
    color: "#58cc02",
    fontWeight: "bold",
  },
  statDetail: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#2d3748",
    marginVertical: 8,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  wordsContainer: {
    gap: 12,
    marginTop: 12,
  },
  wordCard: {
    backgroundColor: "#2d3748",
    borderRadius: 8,
    padding: 12,
  },
  wordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  frenchWord: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#58cc02",
    marginBottom: 4,
  },
  englishWord: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  contextText: {
    color: "#9ca3af",
    fontSize: 14,
    fontStyle: "italic",
    marginVertical: 4,
  },
  learnedDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  sectionBadge: {
    backgroundColor: "#58cc02",
    color: "#FFFFFF",
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    textTransform: "capitalize",
  },
  noWordsText: {
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
    padding: 16,
  },
});

export default ProfileScreen;
