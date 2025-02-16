import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { MaterialIcons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";

type Message = {
  id: string;
  text: string;
  sender: "user1" | "bot";
  type?: "original" | "correction" | "response" | "greeting";
};

interface ProcessedResponse {
  original_text: string;
  corrected_text: string;
  response: string;
  metadata: {
    language: string;
    proficiency: string;
    target: string;
    processed_timestamp: string;
    error?: string;
  };
}

const API_URL = "http://192.168.93.44:8000";

export default function LanguageLearningScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setupAudio();
    initializeSession();
    return cleanup;
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      await Speech.getAvailableVoicesAsync();
    } catch (error) {
      console.error("Audio setup error:", error);
    }
  };

  const initializeSession = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("No authenticated user");
      }

      const tempUserId = user.uid;
      setUserId(tempUserId);

      const response = await fetch(`${API_URL}/initialize_session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: tempUserId,
          language: "en",
          proficiency: "intermediate",
          target: "grammar_correction",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize session");
      }

      const data = await response.json();

      if (data.greeting) {
        addMessage({
          text: data.greeting,
          sender: "bot",
          type: "greeting",
        });
        if (isSpeechEnabled) await speakText(data.greeting);
      }
    } catch (error) {
      console.error("Session initialization error:", error);
      Alert.alert("Error", "Could not initialize session");
    }
  };

  const processMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);

    addMessage({
      text: text.trim(),
      sender: "user1",
      type: "original",
    });

    try {
      const response = await fetch(`${API_URL}/process_text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          user_id: userId,
        }),
      });

      const data: ProcessedResponse = await response.json();

      if (data.corrected_text && data.corrected_text !== text) {
        addMessage({
          text: data.corrected_text,
          sender: "bot",
          type: "correction",
        });
      }

      if (data.response) {
        addMessage({
          text: data.response,
          sender: "bot",
          type: "response",
        });
        if (isSpeechEnabled) await speakText(data.response);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process message");
    } finally {
      setIsProcessing(false);
      setInputText("");
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied");
        return;
      }

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsListening(true);
      startPulseAnimation();
    } catch (error) {
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        // Replace with actual speech-to-text implementation
        const transcribedText = "Sample transcription";
        await processMessage(transcribedText);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to stop recording");
    } finally {
      setRecording(null);
      setIsListening(false);
      pulseAnim.setValue(0);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const addMessage = (message: Omit<Message, "id">) => {
    const newMessage = { ...message, id: Date.now().toString() };
    setMessages((prev) => [...prev, newMessage]);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const speakText = async (text: string) => {
    try {
      await Speech.stop();
      await Speech.speak(text, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (error) {
      console.error("Speech error:", error);
    }
  };

  const cleanup = () => {
    Speech.stop();
    if (recording) recording.stopAndUnloadAsync();
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user1" ? styles.userMessage : styles.botMessage,
        item.type === "correction" && styles.correctionMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      {item.type && (
        <Text style={styles.messageType}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </Text>
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={["#1A1A1A", "#330033", "#660033"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Language Assistant</Text>
          <TouchableOpacity
            onPress={() => setIsSpeechEnabled(!isSpeechEnabled)}
            style={styles.speechToggle}
          >
            <MaterialIcons
              name={isSpeechEnabled ? "volume-up" : "volume-off"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => processMessage(inputText)}
              disabled={isProcessing || !inputText.trim()}
            >
              <MaterialIcons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={isListening ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            <MaterialIcons
              name={isListening ? "stop" : "mic"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  speechToggle: {
    padding: 8,
  },
  messageList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    backgroundColor: "rgba(255,20,147,0.2)",
    alignSelf: "flex-end",
  },
  botMessage: {
    backgroundColor: "rgba(139,0,0,0.2)",
    alignSelf: "flex-start",
  },
  correctionMessage: {
    backgroundColor: "rgba(70,130,180,0.2)",
  },
  messageText: {
    color: "white",
    fontSize: 16,
  },
  messageType: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  inputContainer: {
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 12,
    color: "white",
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#FF1493",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    backgroundColor: "#8B0000",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    alignSelf: "center",
  },
  micButtonActive: {
    backgroundColor: "#FF1493",
  },
});
