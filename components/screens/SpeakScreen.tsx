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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { MaterialIcons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";

type Message = {
  id: string;
  text: string;
  sender: "user1" | "bot";
  type?: "original" | "correction" | "response" | "greeting";
  originalText?: string;
  isTranslated?: boolean;
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

interface TranslationResponse {
  translated_text: string;
  source_language: string;
  target_language: string;
}

interface AudioError extends Error {
  code?: string;
}

const API_URL = "http://192.168.1.33:8000";

export const getFirebaseToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");
  return await user.getIdToken();
};

export default function LanguageLearningScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [learningLanguage, setLearningLanguage] = useState("en");
  const [nativeLanguage, setNativeLanguage] = useState("fr");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setupAudio();
    initializeSession();

    return () => {
      if (recording) recording.stopAndUnloadAsync().catch(console.error);
      Speech.stop().catch(console.error);
    };
  }, []);

  const initializeSession = async () => {
    try {
      const auth = getAuth();
      await auth.currentUser?.reload();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          "Authentication Error",
          "Please sign in to use the language assistant."
        );
        return;
      }

      const tempUserId = user.uid;
      setUserId(tempUserId);

      try {
        const response = await fetch(`${API_URL}/initialize_session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: tempUserId,
            language: learningLanguage,
            proficiency: "intermediate",
            target: "grammar_correction",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to initialize session");
        }

        const data = await response.json();
        setSessionInitialized(true);
        setConnectionError(false);

        if (data.greeting) {
          let greetingText = data.greeting;
          let originalGreeting = data.greeting;
          let isTranslated = false;

          if (nativeLanguage === "fr" && learningLanguage !== "fr") {
            try {
              const translatedGreeting = await translateText(
                data.greeting,
                learningLanguage,
                nativeLanguage
              );
              if (translatedGreeting) {
                greetingText = translatedGreeting;
                isTranslated = true;
              }
            } catch (error) {
              console.error("Failed to translate greeting:", error);
            }
          }

          addMessage({
            text: greetingText,
            sender: "bot",
            type: "greeting",
            originalText: originalGreeting,
            isTranslated: isTranslated,
          });

          if (isSpeechEnabled) await speakText(greetingText);
        }
      } catch (error) {
        console.error("API connection error:", error);
        setConnectionError(true);

        addMessage({
          text: "Bienvenue dans l'Assistant Linguistique ! Je vais vous aider à pratiquer et améliorer vos compétences linguistiques. Veuillez noter que je suis actuellement en mode hors ligne en raison de problèmes de connexion.",
          sender: "bot",
          type: "greeting",
        });
      }
    } catch (error) {
      console.error("Session initialization error:", error);
    }
  };

  const translateText = async (
    text: string,
    fromLang: string,
    toLang: string
  ): Promise<string | null> => {
    if (!text || !text.trim() || fromLang === toLang) return text;

    if (text.length > 100) setIsTranslating(true);

    try {
      const timeoutId = setTimeout(() => {
        console.warn("Translation taking too long, using original text");
        setIsTranslating(false);
        return text;
      }, 8000);

      const response = await fetch(`${API_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          source_language: fromLang,
          target_language: toLang,
          user_id: userId,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Translation failed");
      }

      const data = await response.json();

      if (!data.success) {
        console.warn("Translation marked as unsuccessful:", data.error);
        return data.translated_text && data.translated_text !== text
          ? data.translated_text
          : text;
      }

      return !data.translated_text ||
        data.translated_text.trim() === "" ||
        data.translated_text === text
        ? text
        : data.translated_text;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleMessageTranslation = async (messageId: string) => {
    const messageToTranslate = messages.find((msg) => msg.id === messageId);
    if (!messageToTranslate) return;

    if (messageToTranslate.isTranslated && messageToTranslate.originalText) {
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                text: message.originalText!,
                originalText: message.text,
                isTranslated: false,
              }
            : message
        )
      );
      return;
    }

    setIsTranslating(true);
    try {
      const fromLang =
        messageToTranslate.sender === "bot" ? learningLanguage : nativeLanguage;
      const toLang =
        messageToTranslate.sender === "bot" ? nativeLanguage : learningLanguage;

      const translatedText = await translateText(
        messageToTranslate.text,
        fromLang,
        toLang
      );

      if (translatedText) {
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  text: translatedText,
                  originalText: message.text,
                  isTranslated: true,
                }
              : message
          )
        );
      }
    } catch (error) {
      console.error("Translation toggle error:", error);
      Alert.alert("Translation Error", "Failed to translate message.");
    } finally {
      setIsTranslating(false);
    }
  };

  const processMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);

    let processedText = text.trim();
    let originalText = processedText;
    let translationFailed = false;

    const userMessageId = Date.now().toString();
    addMessage({
      text: originalText,
      sender: "user1",
      type: "original",
    });

    if (learningLanguage !== nativeLanguage) {
      try {
        const translatedInput = await translateText(
          processedText,
          nativeLanguage,
          learningLanguage
        );

        if (translatedInput) {
          if (translatedInput !== processedText) {
            processedText = translatedInput;
            setMessages((prevMessages) =>
              prevMessages.map((message) =>
                message.id === userMessageId
                  ? { ...message, originalText: translatedInput }
                  : message
              )
            );
          }
        } else {
          translationFailed = true;
        }
      } catch (error) {
        console.error("Failed to translate user input:", error);
        translationFailed = true;
      }
    }

    try {
      if (connectionError) {
        setTimeout(() => {
          addMessage({
            text: "I'm currently offline. Your message was received, but I can't process it right now. Please check your internet connection.",
            sender: "bot",
            type: "response",
          });
          setIsProcessing(false);
          setInputText("");
        }, 1000);
        return;
      }

      if (translationFailed) {
        addMessage({
          text: "Note: Translation service is currently unavailable. Processing your original message.",
          sender: "bot",
          type: "response",
        });
        processedText = originalText;
      }

      const response = await fetch(`${API_URL}/process_text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: processedText,
          user_id: userId,
          language: learningLanguage,
          proficiency: "intermediate",
          target: "grammar_correction",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to process message");
      }

      const data: ProcessedResponse = await response.json();

      if (data.corrected_text && data.corrected_text !== processedText) {
        let correctionText = data.corrected_text;
        let originalCorrection = correctionText;

        if (!translationFailed && learningLanguage !== nativeLanguage) {
          try {
            const translatedCorrection = await translateText(
              correctionText,
              learningLanguage,
              nativeLanguage
            );

            if (translatedCorrection) {
              correctionText = translatedCorrection;
            }
          } catch (error) {
            console.error("Failed to translate correction:", error);
          }
        }

        addMessage({
          text: correctionText,
          sender: "bot",
          type: "correction",
          originalText:
            learningLanguage !== nativeLanguage
              ? originalCorrection
              : undefined,
          isTranslated:
            learningLanguage !== nativeLanguage && !translationFailed,
        });
      }

      if (data.response) {
        let responseText = data.response;
        let originalResponse = responseText;

        if (!translationFailed && learningLanguage !== nativeLanguage) {
          try {
            const translatedResponse = await translateText(
              responseText,
              learningLanguage,
              nativeLanguage
            );

            if (translatedResponse) {
              responseText = translatedResponse;
            }
          } catch (error) {
            console.error("Failed to translate response:", error);
          }
        }

        addMessage({
          text: responseText,
          sender: "bot",
          type: "response",
          originalText:
            learningLanguage !== nativeLanguage ? originalResponse : undefined,
          isTranslated:
            learningLanguage !== nativeLanguage && !translationFailed,
        });

        if (isSpeechEnabled) await speakText(responseText);
      }
    } catch (error) {
      console.error("Process message error:", error);
      addMessage({
        text: "Sorry, I couldn't process your message. Please try again later.",
        sender: "bot",
        type: "response",
      });
    } finally {
      setIsProcessing(false);
      setInputText("");
    }
  };

  const setupAudio = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Please enable microphone access.");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error("Audio setup error:", error);
    }
  };

  const startRecording = async () => {
    try {
      if (!recording) {
        const recordingInstance = new Audio.Recording();

        await recordingInstance.prepareToRecordAsync({
          isMeteringEnabled: true,
          android: {
            extension: ".wav",
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AMR_NB,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 64000,
          },
          ios: {
            extension: ".wav",
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 64000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: "audio/wav",
            bitsPerSecond: 128000,
          },
        });

        await recordingInstance.startAsync();
        setRecording(recordingInstance);
        setIsListening(true);

        startPulseAnimation();
      }
    } catch (error) {
      console.error("Recording error:", error);
      Alert.alert("Error", "Failed to start recording.");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      setIsListening(false);
      pulseAnim.setValue(0);

      const uri = recording.getURI();
      if (!uri) throw new Error("No recording URI available");

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) throw new Error("Audio file not found");

      setIsConverting(true);
      addMessage({
        text: "Converting speech to text...",
        sender: "bot",
        type: "response",
      });

      try {
        const transcribedText = await convertSpeechToText(uri);

        setMessages((prev) =>
          prev.filter((msg) => msg.text !== "Converting speech to text...")
        );

        if (transcribedText.trim() !== "") {
          await processMessage(transcribedText);
        } else {
          addMessage({
            text: "I couldn't understand what you said. Please try again.",
            sender: "bot",
            type: "response",
          });
        }
      } catch (sttError) {
        console.error("Speech-to-text error:", sttError);
        setMessages((prev) =>
          prev.filter((msg) => msg.text !== "Converting speech to text...")
        );

        addMessage({
          text: "Sorry, I had trouble converting your speech. Please try again or type your message.",
          sender: "bot",
          type: "response",
        });
      }
    } catch (error) {
      console.error("Stop recording error:", error);
      Alert.alert("Error", "Failed to process your voice input");
    } finally {
      setIsConverting(false);
      setRecording(null);
    }
  };

  const convertSpeechToText = async (audioUri: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("audio", {
        uri: audioUri,
        type: "audio/wav",
        name: "speech.wav",
      } as any);

      const response = await fetch(`${API_URL}/speech-to-text`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error("Speech to text conversion failed");
      }

      const responseText = await response.text();

      try {
        const data = JSON.parse(responseText);
        if (!data.text) throw new Error("No transcription received");
        return data.text;
      } catch (error) {
        console.error("Speech-to-text parsing error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Speech-to-text error:", error);
      throw error;
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
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const speakText = async (text: string) => {
    try {
      await Speech.stop();
      await Speech.speak(text, {
        language: "fr-CA",
        pitch: 1.0,
        rate: 0.9,
        onError: (error) => console.error("Speech error:", error),
      });
    } catch (error) {
      console.error("Speech error:", error);
      setIsSpeechEnabled(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      processMessage(inputText);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View>
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
            {item.isTranslated && " (Translated)"}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.translateButton}
        onPress={() => toggleMessageTranslation(item.id)}
        disabled={isTranslating}
      >
        <Text style={styles.translateButtonText}>
          {item.isTranslated ? "Show Original" : "Translate"}
        </Text>
        <MaterialIcons
          name="translate"
          size={16}
          color="rgba(255,255,255,0.7)"
        />
      </TouchableOpacity>
    </View>
  );

  const retryConnection = () => {
    setConnectionError(false);
    initializeSession();
  };

  return (
    <LinearGradient
      colors={["#1A1A1A", "#330033", "#660033"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Language Assistant</Text>
          <View style={styles.headerControls}>
            {connectionError && (
              <TouchableOpacity
                onPress={retryConnection}
                style={styles.retryButton}
              >
                <MaterialIcons name="refresh" size={24} color="white" />
              </TouchableOpacity>
            )}
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
        </View>

        {connectionError && (
          <View style={styles.connectionError}>
            <Text style={styles.connectionErrorText}>
              Offline mode - some features may be limited
            </Text>
          </View>
        )}

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
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              multiline
              editable={!isProcessing}
              onKeyPress={handleKeyPress}
              blurOnSubmit={false}
            />
            {isProcessing ? (
              <View style={styles.sendButton}>
                <ActivityIndicator color="white" size="small" />
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={() => processMessage(inputText)}
                disabled={isProcessing || !inputText.trim()}
              >
                <MaterialIcons name="send" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.micButton,
              isListening && styles.micButtonActive,
              isProcessing && styles.micButtonDisabled,
            ]}
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
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  speechToggle: {
    padding: 8,
  },
  retryButton: {
    padding: 8,
    marginRight: 8,
  },
  connectionError: {
    backgroundColor: "rgba(255,0,0,0.2)",
    padding: 8,
    alignItems: "center",
  },
  connectionErrorText: {
    color: "white",
    fontSize: 12,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
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
  translateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    marginVertical: 2,
    alignSelf: "flex-start",
  },
  translateButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginRight: 4,
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
  sendButtonDisabled: {
    backgroundColor: "rgba(255,20,147,0.5)",
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
  micButtonDisabled: {
    backgroundColor: "rgba(139,0,0,0.5)",
  },
});
