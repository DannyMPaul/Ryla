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
      const tempUserId = `${user.uid}`;
      // const tempUserId = 'vYef3AT5YhXDi9IYUN3Z06unQzx2'
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

////////////////////////////////////////////////

// import React, { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   Animated,
//   Easing,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { LinearGradient } from "expo-linear-gradient";
// import * as Speech from "expo-speech";
// import { Audio } from "expo-av";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { MaterialIcons } from "@expo/vector-icons";
// // import { getDatabase, ref as dbRef, onValue } from 'firebase/database';

// // Types
// type Message = {
//   id: string;
//   text: string;
//   sender: "user" | "bot";
//   type?: "original" | "correction" | "response" | "greeting";
// };

// const API_URL = "http://192.168.137.1:8000/process_text";

// export default function LanguageLearningScreen() {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [isListening, setIsListening] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isVoiceMode, setIsVoiceMode] = useState(true);
//   const [isSpeechEnabled, setIsSpeechEnabled] = useState(true); // New state for speech toggle
//   const [inputText, setInputText] = useState("");
//   const [userId, setUserId] = useState<string>("");
//   const [recording, setRecording] = useState<Audio.Recording | null>(null);

//   const flatListRef = useRef<FlatList>(null);
//   const animatedValue = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     setupVoiceRecording();
//     setupSpeech();
//     initializeUserSession();
//     return () => cleanup();
//   }, []);

//   const setupSpeech = async () => {
//     try {
//       await Speech.setDefaultLanguage("en-US");
//       await Speech.setDefaultPitch(1.0);
//       await Speech.setDefaultRate(0.9);
//     } catch (error) {
//       console.error("Error setting up speech:", error);
//       setIsSpeechEnabled(false);
//     }
//   };

//   const initializeUserSession = async () => {
//     try {
//       const uid = user.uid || `temp_${Date.now()}`; //what is the local way to get user id
//       setUserId(uid);

//       const response = await fetch(API_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           user_id: uid,
//           language: "en", // Default language
//           proficiency: "intermediate", // Default proficiency
//           target: "grammar_correction" // Default target
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to initialize user session");
//       }

//       const data = await response.json();

//       if (data.greeting) {
//         const greetingMessage: Message = {
//           id: "greeting_" + Date.now().toString(),
//           text: data.greeting,
//           sender: "bot",
//           type: "greeting"
//         };
//         setMessages([greetingMessage]);

//         if (isSpeechEnabled) {
//           speakResponse(data.greeting);
//         }
//       }
//     } catch (error) {
//       console.error("User initialization error:", error);
//       Alert.alert("Error", "Could not initialize user session");
//     }
//   };

//   const setupVoiceRecording = async () => {
//     try {
//       await Audio.requestPermissionsAsync();
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: true,
//         playsInSilentModeIOS: true,
//       });
//     } catch (error) {
//       console.error("Error setting up voice recording:", error);
//     }
//   };

//   const speakResponse = async (text: string) => {
//     try {
//       await Speech.stop();
//       setTimeout(() => {
//         Speech.speak(text, {
//           language: "en-US",
//           pitch: 1.0,
//           rate: 0.9,
//           onError: (error) => console.error("Speech error:", error),
//           onDone: () => console.log("Speech finished"),
//         });
//       }, 500);
//     } catch (error) {
//       console.error("Error speaking response:", error);
//     }
//   };

//   const cleanup = () => {
//     Speech.stop();
//     if (recording) {
//       recording.stopAndUnloadAsync();
//     }
//   };

//   const startPulseAnimation = () => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(animatedValue, {
//           toValue: 1,
//           duration: 1000,
//           easing: Easing.ease,
//           useNativeDriver: true,
//         }),
//         Animated.timing(animatedValue, {
//           toValue: 0,
//           duration: 1000,
//           easing: Easing.ease,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   };

//   const startListening = async () => {
//     try {
//       const { status } = await Audio.requestPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert(
//           "Permission Denied",
//           "Microphone permission is required for voice input."
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
//       console.error("Start listening error:", error);
//       Alert.alert("Error", "Could not start voice recording");
//     }
//   };

//   const stopListening = async () => {
//     try {
//       if (recording) {
//         await recording.stopAndUnloadAsync();
//         const uri = recording.getURI();
//         if (uri) {
//           // Here you would typically send the audio file to your speech-to-text service
//           // For demo purposes, we'll simulate a transcription
//           const simulatedTranscription = "This is a simulated transcription.";
//           await processUserInput(simulatedTranscription);
//         }
//       }
//       setRecording(null);
//       setIsListening(false);
//       animatedValue.setValue(0);
//     } catch (error) {
//       console.error("Stop listening error:", error);
//     }
//   };

//   const handleSendText = async () => {
//     if (!inputText.trim() || isProcessing) return;
//     await processUserInput(inputText.trim());
//     setInputText("");
//   };

//   const processUserInput = async (text: string) => {
//     if (!userId) {
//       Alert.alert("Error", "User ID not available");
//       return;
//     }

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       text,
//       sender: "user",
//       type: "original",
//     };

//     setMessages((prev) => [...prev, userMessage]);
//     setIsProcessing(true);

//     try {
//       const response = await fetch(API_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           text,
//           user_id: userId,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Network response was not ok");
//       }

//       const data = await response.json();
//       handleBotResponse(data);
//     } catch (error) {
//       console.error("HTTP request error:", error);
//       const errorMessage: Message = {
//         id: Date.now().toString() + "_error",
//         text: "Sorry, couldn't process your message. Please try again.",
//         sender: "bot",
//         type: "response",
//       };
//       setMessages((prev) => [...prev, errorMessage]);
//       setIsProcessing(false);
//     }
//   };

//   const handleBotResponse = (response: any) => {
//     const { original_text, corrected_text, response: botResponse } = response;
//     const has_correction = original_text !== corrected_text;

//     if (has_correction && corrected_text && corrected_text !== original_text) {
//       const correctionMessage: Message = {
//         id: Date.now().toString() + "_correction",
//         text: corrected_text,
//         sender: "bot",
//         type: "correction",
//       };
//       setMessages((prev) => [...prev, correctionMessage]);
//     }

//     if (botResponse) {
//       const responseMessage: Message = {
//         id: Date.now().toString() + "_response",
//         text: botResponse,
//         sender: "bot",
//         type: "response",
//       };

//       setMessages((prev) => [...prev, responseMessage]);

//       // Always speak the response if speech is enabled
//       if (isSpeechEnabled) {
//         speakResponse(botResponse);
//       }
//     }

//     setIsProcessing(false);
//   };

//   const renderMessage = ({ item }: { item: Message }) => (
//     <View
//       style={[
//         styles.messageContainer,
//         item.sender === "user" ? styles.userMessage : styles.botMessage,
//         item.type === "correction" && styles.correctionMessage,
//       ]}
//     >
//       <Text style={styles.messageText}>{item.text}</Text>
//       {item.type && (
//         <Text style={styles.messageTypeText}>
//           {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
//         </Text>
//       )}
//     </View>
//   );

//   const micButtonStyle = {
//     transform: [
//       {
//         scale: animatedValue.interpolate({
//           inputRange: [0, 1],
//           outputRange: [1, 1.2],
//         }),
//       },
//     ],
//     opacity: animatedValue.interpolate({
//       inputRange: [0, 1],
//       outputRange: [0.6, 1],
//     }),
//   };

//   return (
//     <LinearGradient
//       colors={["#1A1A1A", "#330033", "#660033"]}
//       style={styles.container}
//     >
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.header}>
//           <Text style={styles.headerText}>Language Learning Assistant</Text>
//           <View style={styles.headerButtons}>
//             <TouchableOpacity
//               onPress={() => setIsSpeechEnabled(!isSpeechEnabled)}
//               style={styles.headerButton}
//             >
//               <MaterialIcons
//                 name={isSpeechEnabled ? "volume-up" : "volume-off"}
//                 size={24}
//                 color="white"
//               />
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={() => setIsVoiceMode(!isVoiceMode)}
//               style={styles.headerButton}
//             >
//               <MaterialIcons
//                 name={isVoiceMode ? "keyboard" : "mic"}
//                 size={24}
//                 color="white"
//               />
//             </TouchableOpacity>
//           </View>
//         </View>

//         <FlatList
//           ref={flatListRef}
//           data={messages}
//           renderItem={renderMessage}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.messageList}
//           onContentSizeChange={() =>
//             flatListRef.current?.scrollToEnd({ animated: true })
//           }
//         />

//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//           style={styles.inputContainer}
//         >
//           {isVoiceMode ? (
//             <Animated.View style={[styles.micButtonWrapper, micButtonStyle]}>
//               <TouchableOpacity
//                 style={[
//                   styles.micButton,
//                   {
//                     backgroundColor: isListening ? "#FF1493" : "#8B0000",
//                     opacity: isProcessing ? 0.5 : 1,
//                   },
//                 ]}
//                 onPress={isListening ? stopListening : startListening}
//                 disabled={isProcessing}
//               >
//                 <MaterialIcons
//                   name={isListening ? "stop" : "mic"}
//                   size={30}
//                   color="white"
//                 />
//               </TouchableOpacity>
//             </Animated.View>
//           ) : (
//             <View style={styles.textInputContainer}>
//               <TextInput
//                 style={styles.textInput}
//                 value={inputText}
//                 onChangeText={setInputText}
//                 placeholder="Type your message..."
//                 placeholderTextColor="#999"
//                 multiline
//                 maxLength={500}
//               />
//               <TouchableOpacity
//                 style={[styles.sendButton, { opacity: isProcessing ? 0.5 : 1 }]}
//                 onPress={handleSendText}
//                 disabled={isProcessing || !inputText.trim()}
//               >
//                 <MaterialIcons name="send" size={24} color="white" />
//               </TouchableOpacity>
//             </View>
//           )}
//         </KeyboardAvoidingView>
//       </SafeAreaView>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   safeArea: { flex: 1 },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "rgba(255,255,255,0.1)",
//   },
//   headerText: {
//     color: "white",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   modeToggle: {
//     padding: 5,
//   },
//   messageList: {
//     padding: 10,
//   },
//   messageContainer: {
//     maxWidth: "80%",
//     borderRadius: 15,
//     padding: 12,
//     marginVertical: 5,
//     alignSelf: "flex-start",
//   },
//   userMessage: {
//     backgroundColor: "rgba(255,20,147,0.2)",
//     alignSelf: "flex-end",
//   },
//   botMessage: {
//     backgroundColor: "rgba(139,0,0,0.2)",
//   },
//   headerButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   headerButton: {
//     padding: 5,
//     marginLeft: 10,
//   },
//   correctionMessage: {
//     backgroundColor: "rgba(70,130,180,0.2)",
//   },
//   messageText: {
//     color: "white",
//     fontSize: 16,
//   },
//   messageTypeText: {
//     color: "#888",
//     fontSize: 12,
//     marginTop: 5,
//     fontStyle: "italic",
//   },
//   inputContainer: {
//     padding: 10,
//     backgroundColor: "rgba(0,0,0,0.3)",
//   },
//   micButtonWrapper: {
//     alignItems: "center",
//   },
//   micButton: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 5,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
//   textInputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   textInput: {
//     flex: 1,
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     color: "white",
//     marginRight: 10,
//     maxHeight: 100,
//     fontSize: 16,
//   },
//   sendButton: {
//     backgroundColor: "#FF1493",
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 5,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
// });
