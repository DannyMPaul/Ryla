// import React, { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
//   StyleSheet,
//   Animated,
//   Easing,
//   ActivityIndicator,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { LinearGradient } from "expo-linear-gradient";
// import * as Speech from "expo-speech";
// import { Audio } from "expo-av";
// import * as FileSystem from "expo-file-system";
// import { MaterialIcons } from "@expo/vector-icons";
// import { getAuth } from "firebase/auth";

// type Message = {
//   id: string;
//   text: string;
//   sender: "user1" | "bot";
//   type?: "original" | "correction" | "response" | "greeting";
// };

// interface ProcessedResponse {
//   original_text: string;
//   corrected_text: string;
//   response: string;
//   metadata: {
//     language: string;
//     proficiency: string;
//     target: string;
//     processed_timestamp: string;
//     error?: string;
//   };
// }

// const API_URL = "http://localhost:8000";

// export default function LanguageLearningScreen() {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [inputText, setInputText] = useState("");
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [recording, setRecording] = useState<Audio.Recording | null>(null);
//   const [userId, setUserId] = useState<string>("");
//   const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
//   const [sessionInitialized, setSessionInitialized] = useState(false);
//   const [connectionError, setConnectionError] = useState(false);

//   const flatListRef = useRef<FlatList>(null);
//   const pulseAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     setupAudio();
//     initializeSession();
//     return cleanup;
//   }, []);

//   const setupAudio = async () => {
//     try {
//       await Audio.requestPermissionsAsync();
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: true,
//         playsInSilentModeIOS: true,
//       });
//       await Speech.getAvailableVoicesAsync();
//     } catch (error) {
//       console.error("Audio setup error:", error);
//       Alert.alert(
//         "Audio Setup Error",
//         "Could not initialize audio features. Some functionality may be limited."
//       );
//     }
//   };

//   const initializeSession = async () => {
//     try {
//       const auth = getAuth();
//       const user = auth.currentUser;

//       if (!user) {
//         Alert.alert(
//           "Authentication Error",
//           "Please sign in to use the language assistant."
//         );
//         return;
//       }

//       const tempUserId = user.uid;
//       setUserId(tempUserId);

//       try {
//         const response = await fetch(`${API_URL}/initialize_session`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             user_id: tempUserId,
//             language: "en",
//             proficiency: "intermediate",
//             target: "grammar_correction",
//           }),
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.detail || "Failed to initialize session");
//         }

//         const data = await response.json();
//         setSessionInitialized(true);
//         setConnectionError(false);

//         if (data.greeting) {
//           addMessage({
//             text: data.greeting,
//             sender: "bot",
//             type: "greeting",
//           });
//           if (isSpeechEnabled) await speakText(data.greeting);
//         }
//       } catch (error) {
//         console.error("API connection error:", error);
//         setConnectionError(true);

//         // Add a local greeting message if API is unavailable
//         addMessage({
//           text: "Welcome to the Language Assistant! I'll help you practice and improve your language skills. Please note that I'm currently in offline mode due to connection issues.",
//           sender: "bot",
//           type: "greeting",
//         });
//       }
//     } catch (error) {
//       console.error("Session initialization error:", error);
//     }
//   };

//   const processMessage = async (text: string) => {
//     if (!text.trim() || isProcessing) return;
//     setIsProcessing(true);

//     addMessage({
//       text: text.trim(),
//       sender: "user1",
//       type: "original",
//     });

//     try {
//       if (connectionError) {
//         // Fallback offline mode
//         setTimeout(() => {
//           addMessage({
//             text: "I'm currently offline. Your message was received, but I can't process it right now. Please check your internet connection.",
//             sender: "bot",
//             type: "response",
//           });
//           setIsProcessing(false);
//           setInputText("");
//         }, 1000);
//         return;
//       }

//       const response = await fetch(`${API_URL}/process_text`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           text: text.trim(),
//           user_id: userId,
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "Failed to process message");
//       }

//       const data: ProcessedResponse = await response.json();

//       if (data.corrected_text && data.corrected_text !== text) {
//         addMessage({
//           text: data.corrected_text,
//           sender: "bot",
//           type: "correction",
//         });
//       }

//       if (data.response) {
//         addMessage({
//           text: data.response,
//           sender: "bot",
//           type: "response",
//         });
//         if (isSpeechEnabled) await speakText(data.response);
//       }
//     } catch (error) {
//       console.error("Process message error:", error);
//       Alert.alert("Error", "Failed to process message. Please try again.");

//       // Add error message to chat
//       addMessage({
//         text: "Sorry, I couldn't process your message. Please try again later.",
//         sender: "bot",
//         type: "response",
//       });
//     } finally {
//       setIsProcessing(false);
//       setInputText("");
//     }
//   };

//   const startRecording = async () => {
//     try {
//       const { status } = await Audio.requestPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert(
//           "Permission denied",
//           "Please grant microphone permissions to use voice input."
//         );
//         return;
//       }

//       const newRecording = new Audio.Recording();
//       await newRecording.prepareToRecordAsync(
//         Audio.RecordingOptionsPresets.HIGH_QUALITY
//       );
//       await newRecording.startAsync();
//       setRecording(newRecording);
//       setIsListening(true);
//       startPulseAnimation();
//     } catch (error) {
//       console.error("Recording error:", error);
//       Alert.alert("Error", "Failed to start recording");
//     }
//   };

//   const stopRecording = async () => {
//     try {
//       if (!recording) return;

//       await recording.stopAndUnloadAsync();
//       setIsListening(false);
//       pulseAnim.setValue(0);

//       const uri = recording.getURI();
//       if (!uri) {
//         throw new Error("No recording URI available");
//       }

//       // Add a loading message while processing
//       addMessage({
//         text: "Processing your voice input...",
//         sender: "bot",
//         type: "response",
//       });

//       // Implement actual speech-to-text here
//       // For now, we'll use a placeholder that indicates we need to implement
//       // a proper speech-to-text service

//       try {
//         // This is where you would implement a real speech-to-text service
//         // Below is a placeholder function
//         const transcribedText = await convertSpeechToText(uri);

//         // Remove the loading message
//         setMessages((prev) =>
//           prev.filter((msg) => msg.text !== "Processing your voice input...")
//         );

//         // Process the transcribed text
//         if (transcribedText && transcribedText.trim() !== "") {
//           await processMessage(transcribedText);
//         } else {
//           addMessage({
//             text: "I couldn't understand what you said. Please try again.",
//             sender: "bot",
//             type: "response",
//           });
//         }
//       } catch (sttError) {
//         console.error("Speech-to-text error:", sttError);
//         // Remove the loading message
//         setMessages((prev) =>
//           prev.filter((msg) => msg.text !== "Processing your voice input...")
//         );

//         addMessage({
//           text: "Sorry, I had trouble understanding your speech. Please try again or type your message.",
//           sender: "bot",
//           type: "response",
//         });
//       }
//     } catch (error) {
//       console.error("Stop recording error:", error);
//       Alert.alert("Error", "Failed to process your voice input");
//     } finally {
//       setRecording(null);
//     }
//   };

//   // Placeholder function for speech-to-text
//   // In a production app, you would integrate with a real STT service
//   const convertSpeechToText = async (audioUri: string): Promise<string> => {
//     // In a real implementation, you would:
//     // 1. Either upload the audio file to a server for processing
//     // 2. Or use a local library/API for speech recognition

//     // For now, simulate a delay and return a placeholder message
//     await new Promise((resolve) => setTimeout(resolve, 2000));

//     // This is just a placeholder - in production, replace with actual STT implementation
//     return "This is a placeholder for speech-to-text conversion. Please implement a real STT service.";
//   };

//   const startPulseAnimation = () => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulseAnim, {
//           toValue: 1,
//           duration: 1000,
//           easing: Easing.ease,
//           useNativeDriver: true,
//         }),
//         Animated.timing(pulseAnim, {
//           toValue: 0,
//           duration: 1000,
//           easing: Easing.ease,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   };

//   const addMessage = (message: Omit<Message, "id">) => {
//     const newMessage = { ...message, id: Date.now().toString() };
//     setMessages((prev) => [...prev, newMessage]);
//     // Use setTimeout to ensure the list updates before scrolling
//     setTimeout(() => {
//       flatListRef.current?.scrollToEnd({ animated: true });
//     }, 100);
//   };

//   const speakText = async (text: string) => {
//     try {
//       await Speech.stop();
//       await Speech.speak(text, {
//         language: "en-US",
//         pitch: 1.0,
//         rate: 0.9,
//         onError: (error) => console.error("Speech error:", error),
//       });
//     } catch (error) {
//       console.error("Speech error:", error);
//       setIsSpeechEnabled(false);
//     }
//   };

//   const cleanup = () => {
//     Speech.stop();
//     if (recording) recording.stopAndUnloadAsync();
//   };

//   const renderMessage = ({ item }: { item: Message }) => (
//     <View
//       style={[
//         styles.messageContainer,
//         item.sender === "user1" ? styles.userMessage : styles.botMessage,
//         item.type === "correction" && styles.correctionMessage,
//       ]}
//     >
//       <Text style={styles.messageText}>{item.text}</Text>
//       {item.type && (
//         <Text style={styles.messageType}>
//           {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
//         </Text>
//       )}
//     </View>
//   );

//   const retryConnection = () => {
//     setConnectionError(false);
//     initializeSession();
//   };

//   return (
//     <LinearGradient
//       colors={["#1A1A1A", "#330033", "#660033"]}
//       style={styles.container}
//     >
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.header}>
//           <Text style={styles.headerText}>Language Assistant</Text>
//           <View style={styles.headerControls}>
//             {connectionError && (
//               <TouchableOpacity
//                 onPress={retryConnection}
//                 style={styles.retryButton}
//               >
//                 <MaterialIcons name="refresh" size={24} color="white" />
//               </TouchableOpacity>
//             )}
//             <TouchableOpacity
//               onPress={() => setIsSpeechEnabled(!isSpeechEnabled)}
//               style={styles.speechToggle}
//             >
//               <MaterialIcons
//                 name={isSpeechEnabled ? "volume-up" : "volume-off"}
//                 size={24}
//                 color="white"
//               />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {connectionError && (
//           <View style={styles.connectionError}>
//             <Text style={styles.connectionErrorText}>
//               Offline mode - some features may be limited
//             </Text>
//           </View>
//         )}

//         <FlatList
//           ref={flatListRef}
//           data={messages}
//           renderItem={renderMessage}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.messageList}
//         />

//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//           style={styles.inputContainer}
//         >
//           <View style={styles.inputWrapper}>
//             <TextInput
//               style={styles.input}
//               value={inputText}
//               onChangeText={setInputText}
//               placeholder="Type your message..."
//               placeholderTextColor="#999"
//               multiline
//               editable={!isProcessing}
//             />
//             {isProcessing ? (
//               <View style={styles.sendButton}>
//                 <ActivityIndicator color="white" size="small" />
//               </View>
//             ) : (
//               <TouchableOpacity
//                 style={[
//                   styles.sendButton,
//                   !inputText.trim() && styles.sendButtonDisabled,
//                 ]}
//                 onPress={() => processMessage(inputText)}
//                 disabled={isProcessing || !inputText.trim()}
//               >
//                 <MaterialIcons name="send" size={24} color="white" />
//               </TouchableOpacity>
//             )}
//           </View>

//           <TouchableOpacity
//             style={[
//               styles.micButton,
//               isListening && styles.micButtonActive,
//               isProcessing && styles.micButtonDisabled,
//             ]}
//             onPress={isListening ? stopRecording : startRecording}
//             disabled={isProcessing}
//           >
//             <MaterialIcons
//               name={isListening ? "stop" : "mic"}
//               size={24}
//               color="white"
//             />
//           </TouchableOpacity>
//         </KeyboardAvoidingView>
//       </SafeAreaView>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   safeArea: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "rgba(255,255,255,0.1)",
//   },
//   headerText: {
//     color: "white",
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   headerControls: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   speechToggle: {
//     padding: 8,
//   },
//   retryButton: {
//     padding: 8,
//     marginRight: 8,
//   },
//   connectionError: {
//     backgroundColor: "rgba(255,0,0,0.2)",
//     padding: 8,
//     alignItems: "center",
//   },
//   connectionErrorText: {
//     color: "white",
//     fontSize: 12,
//   },
//   messageList: {
//     padding: 16,
//     paddingBottom: 24,
//   },
//   messageContainer: {
//     maxWidth: "80%",
//     padding: 12,
//     borderRadius: 16,
//     marginVertical: 4,
//   },
//   userMessage: {
//     backgroundColor: "rgba(255,20,147,0.2)",
//     alignSelf: "flex-end",
//   },
//   botMessage: {
//     backgroundColor: "rgba(139,0,0,0.2)",
//     alignSelf: "flex-start",
//   },
//   correctionMessage: {
//     backgroundColor: "rgba(70,130,180,0.2)",
//   },
//   messageText: {
//     color: "white",
//     fontSize: 16,
//   },
//   messageType: {
//     color: "#999",
//     fontSize: 12,
//     marginTop: 4,
//     fontStyle: "italic",
//   },
//   inputContainer: {
//     padding: 16,
//     backgroundColor: "rgba(0,0,0,0.3)",
//   },
//   inputWrapper: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   input: {
//     flex: 1,
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 20,
//     padding: 12,
//     color: "white",
//     marginRight: 8,
//     maxHeight: 100,
//   },
//   sendButton: {
//     backgroundColor: "#FF1493",
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   sendButtonDisabled: {
//     backgroundColor: "rgba(255,20,147,0.5)",
//   },
//   micButton: {
//     backgroundColor: "#8B0000",
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 8,
//     alignSelf: "center",
//   },
//   micButtonActive: {
//     backgroundColor: "#FF1493",
//   },
//   micButtonDisabled: {
//     backgroundColor: "rgba(139,0,0,0.5)",
//   },
// });

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
  originalText?: string; // Store original text before translation
  isTranslated?: boolean; // Track if message is currently translated
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

const API_URL = "http://localhost:8000";

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
  const [learningLanguage, setLearningLanguage] = useState("en"); // Default language
  const [nativeLanguage, setNativeLanguage] = useState("fr"); // Default native language
  const [isTranslating, setIsTranslating] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

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
      Alert.alert(
        "Audio Setup Error",
        "Could not initialize audio features. Some functionality may be limited."
      );
    }
  };

  const initializeSession = async () => {
    try {
      const auth = getAuth();
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
          headers: {
            "Content-Type": "application/json",
          },
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
          // Auto-translate greeting if learning language is not English
          let greetingText = data.greeting;
          if (learningLanguage !== "en") {
            try {
              const translatedGreeting = await translateText(
                data.greeting,
                learningLanguage,
                "en"
              );
              if (translatedGreeting) {
                greetingText = translatedGreeting;
              }
            } catch (error) {
              console.error("Failed to translate greeting:", error);
            }
          }

          addMessage({
            text: greetingText,
            sender: "bot",
            type: "greeting",
            originalText: data.greeting,
            isTranslated: learningLanguage !== "en",
          });

          if (isSpeechEnabled) await speakText(greetingText);
        }
      } catch (error) {
        console.error("API connection error:", error);
        setConnectionError(true);

        // Add a local greeting message if API is unavailable
        addMessage({
          text: "Welcome to the Language Assistant! I'll help you practice and improve your language skills. Please note that I'm currently in offline mode due to connection issues.",
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
    // Don't attempt translation if text is empty or languages are the same
    if (!text || !text.trim() || fromLang === toLang) {
      return text;
    }

    // Show a brief loading message for longer translations
    if (text.length > 100) {
      setIsTranslating(true);
    }

    try {
      // Record start time for monitoring
      const startTime = Date.now();

      // Set up a timeout to abort excessive wait times
      const timeoutId = setTimeout(() => {
        console.warn("Translation taking too long, using original text");
        setIsTranslating(false);
        return text;
      }, 8000); // 8 second timeout

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

      // Clear the timeout since we got a response
      clearTimeout(timeoutId);

      // Log translation time for monitoring
      const elapsedTime = Date.now() - startTime;
      console.log(`Translation took ${elapsedTime}ms`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Translation failed");
      }

      const data = await response.json();

      // Check if translation was successful according to API
      if (!data.success) {
        console.warn("Translation marked as unsuccessful:", data.error);
        // If translation failed but server returned something, check if it's usable
        if (data.translated_text && data.translated_text !== text) {
          // Server provided a partial translation, use it
          return data.translated_text;
        }
        // Otherwise use original text
        return text;
      }

      // Verify we actually got a real translation (not empty or identical)
      if (
        !data.translated_text ||
        data.translated_text.trim() === "" ||
        data.translated_text === text
      ) {
        return text;
      }

      return data.translated_text;
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Fallback to original text
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleMessageTranslation = async (messageId: string) => {
    // Find the message to translate
    const messageToTranslate = messages.find(
      (message) => message.id === messageId
    );
    if (!messageToTranslate) return;

    // Already translated - switch back to original
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

    // Not translated yet - translate now
    setIsTranslating(true);
    try {
      // Determine translation direction based on message sender
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

    // Add user message immediately to improve perceived responsiveness
    const userMessageId = Date.now().toString();
    addMessage({
      text: originalText,
      sender: "user1",
      type: "original",
    });

    // Translate user input if needed
    if (learningLanguage !== nativeLanguage) {
      try {
        const translatedInput = await translateText(
          processedText,
          nativeLanguage,
          learningLanguage
        );

        if (translatedInput) {
          if (translatedInput !== processedText) {
            // Update the message with translation metadata if translation succeeded
            processedText = translatedInput;

            // Update the user message to include original text reference
            setMessages((prevMessages) =>
              prevMessages.map((message) =>
                message.id === userMessageId
                  ? {
                      ...message,
                      originalText: translatedInput,
                    }
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
        // Fallback offline mode with more context
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

      // If translation failed, add a notice but continue processing with original text
      if (translationFailed) {
        addMessage({
          text: "Note: Translation service is currently unavailable. Processing your original message.",
          sender: "bot",
          type: "response",
        });
        // Continue with the original text
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

      // Handle correction message if exists and differs from input
      if (data.corrected_text && data.corrected_text !== processedText) {
        let correctionText = data.corrected_text;
        let originalCorrection = correctionText;

        // Only attempt translation if the service is working
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
            // Continue with untranslated text - don't add another failure message
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

      // Handle response message
      if (data.response) {
        let responseText = data.response;
        let originalResponse = responseText;

        // Only attempt translation if the service is working
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
            // Continue with untranslated text
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

      // Add error message to chat
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

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Please grant microphone permissions to use voice input."
        );
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
      console.error("Recording error:", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      setIsListening(false);
      pulseAnim.setValue(0);

      const uri = recording.getURI();
      if (!uri) {
        throw new Error("No recording URI available");
      }

      // Add a loading message while processing
      addMessage({
        text: "Processing your voice input...",
        sender: "bot",
        type: "response",
      });

      // Implement actual speech-to-text here
      // For now, we'll use a placeholder that indicates we need to implement
      // a proper speech-to-text service

      try {
        // This is where you would implement a real speech-to-text service
        // Below is a placeholder function
        const transcribedText = await convertSpeechToText(uri);

        // Remove the loading message
        setMessages((prev) =>
          prev.filter((msg) => msg.text !== "Processing your voice input...")
        );

        // Process the transcribed text
        if (transcribedText && transcribedText.trim() !== "") {
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
        // Remove the loading message
        setMessages((prev) =>
          prev.filter((msg) => msg.text !== "Processing your voice input...")
        );

        addMessage({
          text: "Sorry, I had trouble understanding your speech. Please try again or type your message.",
          sender: "bot",
          type: "response",
        });
      }
    } catch (error) {
      console.error("Stop recording error:", error);
      Alert.alert("Error", "Failed to process your voice input");
    } finally {
      setRecording(null);
    }
  };

  // Placeholder function for speech-to-text
  // In a production app, you would integrate with a real STT service
  const convertSpeechToText = async (audioUri: string): Promise<string> => {
    // In a real implementation, you would:
    // 1. Either upload the audio file to a server for processing
    // 2. Or use a local library/API for speech recognition

    // For now, simulate a delay and return a placeholder message
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // This is just a placeholder - in production, replace with actual STT implementation
    return "This is a placeholder for speech-to-text conversion. Please implement a real STT service.";
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
    // Use setTimeout to ensure the list updates before scrolling
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const speakText = async (text: string) => {
    try {
      await Speech.stop();
      await Speech.speak(text, {
        language: "en-US", // Use English for TTS when translated
        pitch: 1.0,
        rate: 0.9,
        onError: (error) => console.error("Speech error:", error),
      });
    } catch (error) {
      console.error("Speech error:", error);
      setIsSpeechEnabled(false);
    }
  };

  const cleanup = () => {
    Speech.stop();
    if (recording) recording.stopAndUnloadAsync();
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

      {/* Translation button */}
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
