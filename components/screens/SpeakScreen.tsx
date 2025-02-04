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

// import Voice, { 
//   SpeechResultsEvent,
//   SpeechErrorEvent 
// } from '@react-native-voice/voice';
// import { PermissionsAndroid} from 'react-native';
// import axios from "axios";
// import Icon from "@expo/vector-icons/MaterialIcons";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// type Message = {
//   id: string;
//   text: string;
//   sender: "user" | "bot";
//   type?: "original" | "correction" | "response";
// };

// export default function LanguageLearningScreen() {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [isListening, setIsListening] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isVoiceMode, setIsVoiceMode] = useState(true);
//   const [inputText, setInputText] = useState("");
//   const [userId, setUserId] = useState<string>("");

//   const flatListRef = useRef<FlatList>(null);
//   const animatedValue = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     const voiceSetup = async () => {
//       Voice.onSpeechResults = onSpeechResults;
//       Voice.onSpeechError = onSpeechError;
//       await loadOrCreateUserId();
//     };
  
//     voiceSetup();
//     return () => {
//       Voice.destroy().then(Voice.removeAllListeners);
//     };
//   }, []);

//   const requestMicrophonePermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//           {
//             title: 'Microphone Permission',
//             message: 'App needs access to your microphone to record audio.',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           },
//         );
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       } catch (err) {
//         console.warn(err);
//         return false;
//       }
//     }
//     return true;
//   };

//   const loadOrCreateUserId = async () => {
//     try {
//       let id = await AsyncStorage.getItem("userId");
//       if (!id) {
//         id = `user_${Date.now()}`;
//         await AsyncStorage.setItem("userId", id);
//       }
//       setUserId(id);
//     } catch (error) {
//       console.error("Error loading user ID:", error);
//       // Generate temporary ID if storage fails
//       setUserId(`temp_${Date.now()}`);
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
//       const hasPermission = await requestMicrophonePermission();
//       if (!hasPermission) {
//         Alert.alert('Permission Denied', 'Microphone permission is required for voice input.');
//         return;
//       }
  
//       await Voice.start('en-US');
//       setIsListening(true);
//       startPulseAnimation();
//     } catch (error) {
//       console.error('Start listening error:', error);
//       Alert.alert('Error', 'Could not start voice recognition');
//     }
//   };

//   const stopListening = async () => {
//     try {
//       await Voice.stop();
//       setIsListening(false);
//     } catch (error) {
//       console.error("Stop listening error:", error);
//     }
//   };

//   const onSpeechResults = async (e: any) => {
//     const transcription = e.value[0];
//     await processUserInput(transcription);
//   };

//   const onSpeechError = (e: any) => {
//     console.error("Speech error:", e);
//     setIsListening(false);
//     Alert.alert("Error", "Voice recognition failed");
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
//       text: text,
//       sender: "user",
//       type: "original"
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setIsProcessing(true);

//     try {
//       const response = await axios.post("http://localhost:8000/process_text", {
//         text: text,
//         user_id: userId
//       });

//       const { original_text, corrected_text, response: botResponse } = response.data;

//       if (corrected_text !== original_text) {
//         const correctionMessage: Message = {
//           id: Date.now().toString() + "_correction",
//           text: corrected_text,
//           sender: "bot",
//           type: "correction"
//         };
//         setMessages(prev => [...prev, correctionMessage]);

//         if (isVoiceMode) {
//           Speech.speak(corrected_text);
//         }
//       }

//       const responseMessage: Message = {
//         id: Date.now().toString() + "_response",
//         text: botResponse,
//         sender: "bot",
//         type: "response"
//       };

//       setMessages(prev => [...prev, responseMessage]);

//       if (isVoiceMode) {
//         Speech.speak(botResponse);
//       }

//     } catch (error) {
//       console.error("Processing error:", error);
//       const errorMessage: Message = {
//         id: Date.now().toString() + "_error",
//         text: "Sorry, couldn't process your message. Please try again.",
//         sender: "bot",
//         type: "response"
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsProcessing(false);
//     }
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
//           <TouchableOpacity
//             onPress={() => setIsVoiceMode(!isVoiceMode)}
//             style={styles.modeToggle}
//           >
//             <Icon
//               name={isVoiceMode ? "keyboard" : "mic"}
//               size={24}
//               color="white"
//             />
//           </TouchableOpacity>
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
//                 <Icon
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
//                 <Icon name="send" size={24} color="white" />
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




//###############################################################################################################


// // LanguageLearningScreen.tsx
// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View, Text, TextInput, StyleSheet, TouchableOpacity,
//   FlatList, Animated, Easing, KeyboardAvoidingView,
//   Platform, Alert
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import * as Speech from 'expo-speech';
// import Voice, { 
//   SpeechResultsEvent,
//   SpeechErrorEvent 
// } from '@react-native-voice/voice';
// import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Icon from '@expo/vector-icons/MaterialIcons';

// // Types
// type Message = {
//   id: string;
//   text: string;
//   sender: 'user' | 'bot';
//   type?: 'original' | 'correction' | 'response';
// };

// interface WebSocketResponse {
//   original_text: string;
//   corrected_text: string;
//   response: string;
//   metadata: {
//     has_correction: boolean;
//   };
// }

// const WS_URL = 'ws://your-server-url/ws';

// export default function SpeakScreen() {
//   // State
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [isListening, setIsListening] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isVoiceMode, setIsVoiceMode] = useState(true);
//   const [inputText, setInputText] = useState('');
//   const [userId, setUserId] = useState<string>('');
//   const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

//   // Refs
//   const flatListRef = useRef<FlatList>(null);
//   const animatedValue = useRef(new Animated.Value(0)).current;

//   // Animations
//   const micButtonStyle = {
//     transform: [{
//       scale: animatedValue.interpolate({
//         inputRange: [0, 1],
//         outputRange: [1, 1.2],
//       }),
//     }],
//   };

//   useEffect(() => {
//     setupVoiceAndWebSocket();
//     return () => cleanup();
//   }, []);

//   const setupVoiceAndWebSocket = async () => {
//     await Voice.destroy();
//     Voice.onSpeechResults = onSpeechResults;
//     Voice.onSpeechError = onSpeechError;
//     await loadOrCreateUserId();
//     initializeWebSocket();
//   };

//   const cleanup = () => {
//     if (wsConnection) {
//       wsConnection.close();
//     }
//     Voice.destroy().then(Voice.removeAllListeners);
//   };

//   const loadOrCreateUserId = async () => {
//     try {
//       let id = await AsyncStorage.getItem('userId');
//       if (!id) {
//         id = `user_${Date.now()}`;
//         await AsyncStorage.setItem('userId', id);
//       }
//       setUserId(id);
//     } catch (error) {
//       console.error('Error loading user ID:', error);
//       setUserId(`temp_${Date.now()}`);
//     }
//   };

//   const initializeWebSocket = () => {
//     if (userId) {
//       const ws = new WebSocket(`${WS_URL}/${userId}`);
      
//       ws.onopen = () => {
//         console.log('WebSocket Connected');
//       };
      
//       ws.onmessage = (event) => {
//         const response = JSON.parse(event.data);
//         handleBotResponse(response);
//       };
      
//       ws.onerror = (error) => {
//         console.error('WebSocket error:', error);
//         Alert.alert('Connection Error', 'Failed to connect to the server');
//       };
      
//       ws.onclose = () => {
//         console.log('WebSocket Disconnected');
//         setTimeout(initializeWebSocket, 3000);
//       };
      
//       setWsConnection(ws);
//     }
//   };

//   const requestMicrophonePermission = async () => {
//     if (Platform.OS === 'ios') {
//       try {
//         const result = await check(PERMISSIONS.IOS.MICROPHONE);
//         if (result !== RESULTS.GRANTED) {
//           const permissionResult = await request(PERMISSIONS.IOS.MICROPHONE);
//           return permissionResult === RESULTS.GRANTED;
//         }
//         return true;
//       } catch (error) {
//         console.error('Permission error:', error);
//         return false;
//       }
//     } else {
//       try {
//         const result = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
//         if (result !== RESULTS.GRANTED) {
//           const permissionResult = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
//           return permissionResult === RESULTS.GRANTED;
//         }
//         return true;
//       } catch (error) {
//         console.error('Permission error:', error);
//         return false;
//       }
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
//       const hasPermission = await requestMicrophonePermission();
//       if (!hasPermission) {
//         Alert.alert('Permission Denied', 'Microphone permission is required for voice input.');
//         return;
//       }

//       await Voice.start('en-US');
//       setIsListening(true);
//       startPulseAnimation();
//     } catch (error) {
//       console.error('Start listening error:', error);
//       Alert.alert('Error', 'Could not start voice recognition');
//     }
//   };

//   const stopListening = async () => {
//     try {
//       await Voice.stop();
//       setIsListening(false);
//       animatedValue.setValue(0);
//     } catch (error) {
//       console.error('Stop listening error:', error);
//     }
//   };

//   const onSpeechResults = async (e: SpeechResultsEvent) => {
//     if (e.value && e.value[0]) {
//       const transcription = e.value[0];
//       await processUserInput(transcription);
//     }
//   };

//   const onSpeechError = (e: SpeechErrorEvent) => {
//     console.error('Speech error:', e);
//     setIsListening(false);
//     Alert.alert('Error', 'Voice recognition failed');
//   };

//   const handleSendText = async () => {
//     if (!inputText.trim() || isProcessing) return;
//     await processUserInput(inputText.trim());
//     setInputText('');
//   };

//   const processUserInput = async (text: string) => {
//     if (!userId) {
//       Alert.alert('Error', 'User ID not available');
//       return;
//     }

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       text,
//       sender: 'user',
//       type: 'original'
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setIsProcessing(true);

//     if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
//       wsConnection.send(JSON.stringify({
//         text,
//         user_id: userId,
//         timestamp: new Date().toISOString()
//       }));
//     } else {
//       try {
//         const response = await fetch('http://localhost:8000/process_text', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             text,
//             user_id: userId
//           }),
//         });

//         const data = await response.json();
//         handleBotResponse(data);
//       } catch (error) {
//         console.error('HTTP request error:', error);
//         Alert.alert('Error', 'Failed to process message');
//         setIsProcessing(false);
//       }
//     }
//   };

//   const handleBotResponse = (response: WebSocketResponse) => {
//     const { original_text, corrected_text, response: botResponse, metadata } = response;

//     if (metadata.has_correction && corrected_text !== original_text) {
//       const correctionMessage: Message = {
//         id: Date.now().toString() + '_correction',
//         text: corrected_text,
//         sender: 'bot',
//         type: 'correction'
//       };
//       setMessages(prev => [...prev, correctionMessage]);

//       if (isVoiceMode) {
//         Speech.speak(corrected_text);
//       }
//     }

//     const responseMessage: Message = {
//       id: Date.now().toString() + '_response',
//       text: botResponse,
//       sender: 'bot',
//       type: 'response'
//     };

//     setMessages(prev => [...prev, responseMessage]);

//     if (isVoiceMode) {
//       Speech.speak(botResponse);
//     }

//     setIsProcessing(false);
//   };

//   const renderMessage = ({ item }: { item: Message }) => (
//     <View style={[
//       styles.messageContainer,
//       item.sender === 'user' ? styles.userMessage : styles.botMessage
//     ]}>
//       <Text style={styles.messageText}>{item.text}</Text>
//     </View>
//   );

//   return (
//     <LinearGradient
//       colors={['#1A1A1A', '#330033', '#660033']}
//       style={styles.container}
//     >
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.header}>
//           <Text style={styles.headerText}>Language Learning Assistant</Text>
//           <TouchableOpacity
//             onPress={() => setIsVoiceMode(!isVoiceMode)}
//             style={styles.modeToggle}
//           >
//             <Icon
//               name={isVoiceMode ? 'keyboard' : 'mic'}
//               size={24}
//               color="white"
//             />
//           </TouchableOpacity>
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
//           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           style={styles.inputContainer}
//         >
//           {isVoiceMode ? (
//             <Animated.View style={[styles.micButtonWrapper, micButtonStyle]}>
//               <TouchableOpacity
//                 style={[
//                   styles.micButton,
//                   {
//                     backgroundColor: isListening ? '#FF1493' : '#8B0000',
//                     opacity: isProcessing ? 0.5 : 1,
//                   },
//                 ]}
//                 onPress={isListening ? stopListening : startListening}
//                 disabled={isProcessing}
//               >
//                 <Icon
//                   name={isListening ? 'stop' : 'mic'}
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
//                 <Icon name="send" size={24} color="white" />
//               </TouchableOpacity>
//             </View>
//           )}
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
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   headerText: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   modeToggle: {
//     padding: 8,
//   },
//   messageList: {
//     padding: 16,
//   },
//   messageContainer: {
//     maxWidth: '80%',
//     marginVertical: 8,
//     padding: 12,
//     borderRadius: 16,
//   },
//   userMessage: {
//     alignSelf: 'flex-end',
//     backgroundColor: '#4A90E2',
//   },
//   botMessage: {
//     alignSelf: 'flex-start',
//     backgroundColor: '#2C2C2E',
//   },
//   messageText: {
//     color: 'white',
//     fontSize: 16,
//   },
//   inputContainer: {
//     padding: 16,
//   },
//   textInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   textInput: {
//     flex: 1,
//     backgroundColor: '#2C2C2E',
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 8,
//     color: 'white',
//     maxHeight: 100,
//   },
//   sendButton: {
//     backgroundColor: '#4A90E2',
//     borderRadius: 20,
//     padding: 8,
//   },
//   micButtonWrapper: {
//     alignItems: 'center',
//   },
//   micButton: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });


///////////////////////////////////////////////////////////////////////////////////////////////

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Speech from "expo-speech";
import Voice, { 
  SpeechResultsEvent,
  SpeechErrorEvent 
} from '@react-native-voice/voice';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Icon from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  type?: "original" | "correction" | "response";
};

interface WebSocketResponse {
  original_text: string;
  corrected_text: string;
  response: string;
  metadata: {
    has_correction: boolean;
  };
}

const WS_URL = 'ws://your-server-url/ws';
const HTTP_FALLBACK_URL = 'http://localhost:8000/process_text';

export default function LanguageLearningScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [inputText, setInputText] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setupVoiceAndWebSocket();
    return () => cleanup();
  }, []);

  const setupVoiceAndWebSocket = async () => {
    await Voice.destroy();
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    await loadOrCreateUserId();
    initializeWebSocket();
  };

  const cleanup = () => {
    if (wsConnection) {
      wsConnection.close();
    }
    Voice.destroy().then(Voice.removeAllListeners);
  };

  const loadOrCreateUserId = async () => {
    try {
      let id = await AsyncStorage.getItem("userId");
      if (!id) {
        id = `user_${Date.now()}`;
        await AsyncStorage.setItem("userId", id);
      }
      setUserId(id);
    } catch (error) {
      console.error("Error loading user ID:", error);
      setUserId(`temp_${Date.now()}`);
    }
  };

  const initializeWebSocket = () => {
    if (userId) {
      const ws = new WebSocket(`${WS_URL}/${userId}`);
      
      ws.onopen = () => {
        console.log('WebSocket Connected');
      };
      
      ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        handleBotResponse(response);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't alert - will fallback to HTTP
      };
      
      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        setTimeout(initializeWebSocket, 3000);
      };
      
      setWsConnection(ws);
    }
  };

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'ios') {
      try {
        const result = await check(PERMISSIONS.IOS.MICROPHONE);
        if (result !== RESULTS.GRANTED) {
          const permissionResult = await request(PERMISSIONS.IOS.MICROPHONE);
          return permissionResult === RESULTS.GRANTED;
        }
        return true;
      } catch (error) {
        console.error('Permission error:', error);
        return false;
      }
    } else {
      try {
        const result = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
        if (result !== RESULTS.GRANTED) {
          const permissionResult = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
          return permissionResult === RESULTS.GRANTED;
        }
        return true;
      } catch (error) {
        console.error('Permission error:', error);
        return false;
      }
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startListening = async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Microphone permission is required for voice input.');
        return;
      }

      await Voice.start('en-US');
      setIsListening(true);
      startPulseAnimation();
    } catch (error) {
      console.error('Start listening error:', error);
      Alert.alert('Error', 'Could not start voice recognition');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      animatedValue.setValue(0);
    } catch (error) {
      console.error("Stop listening error:", error);
    }
  };

  const onSpeechResults = async (e: SpeechResultsEvent) => {
    if (e.value && e.value[0]) {
      const transcription = e.value[0];
      await processUserInput(transcription);
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error('Speech error:', e);
    setIsListening(false);
    Alert.alert('Error', 'Voice recognition failed');
  };

  const handleSendText = async () => {
    if (!inputText.trim() || isProcessing) return;
    await processUserInput(inputText.trim());
    setInputText("");
  };

  const processUserInput = async (text: string) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not available');
      return;
    }
  
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      type: 'original'
    };
  
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
  
    if (wsConnection?.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        text,
        user_id: userId,
        timestamp: new Date().toISOString()
      }));
    } else {
      try {
        const response = await fetch(HTTP_FALLBACK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            user_id: userId
          }),
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const data = await response.json();
        handleBotResponse({
          ...data,
          metadata: {
            has_correction: data.corrected_text !== data.original_text
          }
        });
      } catch (error) {
        console.error('HTTP request error:', error);
        const errorMessage: Message = {
          id: Date.now().toString() + '_error',
          text: "Sorry, couldn't process your message. Please try again.",
          sender: 'bot',
          type: 'response'
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsProcessing(false);
      }
    }
  };  

  const handleBotResponse = (response: WebSocketResponse | any) => {
    // Handle both WebSocket and HTTP responses
    const original_text = response.original_text;
    const corrected_text = response.corrected_text;
    const botResponse = response.response;
    const has_correction = response.metadata?.has_correction ?? (original_text !== corrected_text);
  
    if (has_correction && corrected_text && corrected_text !== original_text) {
      const correctionMessage: Message = {
        id: Date.now().toString() + '_correction',
        text: corrected_text,
        sender: 'bot',
        type: 'correction'
      };
      setMessages(prev => [...prev, correctionMessage]);
  
      if (isVoiceMode) {
        Speech.speak(corrected_text);
      }
    }
  
    if (botResponse) {
      const responseMessage: Message = {
        id: Date.now().toString() + '_response',
        text: botResponse,
        sender: 'bot',
        type: 'response'
      };
  
      setMessages(prev => [...prev, responseMessage]);
  
      if (isVoiceMode) {
        Speech.speak(botResponse);
      }
    }
  
    setIsProcessing(false);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user" ? styles.userMessage : styles.botMessage,
        item.type === "correction" && styles.correctionMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      {item.type && (
        <Text style={styles.messageTypeText}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </Text>
      )}
    </View>
  );

  const micButtonStyle = {
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      },
    ],
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
    }),
  };

  return (
    <LinearGradient
      colors={["#1A1A1A", "#330033", "#660033"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Language Learning Assistant</Text>
          <TouchableOpacity
            onPress={() => setIsVoiceMode(!isVoiceMode)}
            style={styles.modeToggle}
          >
            <Icon
              name={isVoiceMode ? "keyboard" : "mic"}
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
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputContainer}
        >
          {isVoiceMode ? (
            <Animated.View style={[styles.micButtonWrapper, micButtonStyle]}>
              <TouchableOpacity
                style={[
                  styles.micButton,
                  {
                    backgroundColor: isListening ? "#FF1493" : "#8B0000",
                    opacity: isProcessing ? 0.5 : 1,
                  },
                ]}
                onPress={isListening ? stopListening : startListening}
                disabled={isProcessing}
              >
                <Icon
                  name={isListening ? "stop" : "mic"}
                  size={30}
                  color="white"
                />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, { opacity: isProcessing ? 0.5 : 1 }]}
                onPress={handleSendText}
                disabled={isProcessing || !inputText.trim()}
              >
                <Icon name="send" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modeToggle: {
    padding: 5,
  },
  messageList: {
    padding: 10,
  },
  messageContainer: {
    maxWidth: "80%",
    borderRadius: 15,
    padding: 12,
    marginVertical: 5,
    alignSelf: "flex-start",
  },
  userMessage: {
    backgroundColor: "rgba(255,20,147,0.2)",
    alignSelf: "flex-end",
  },
  botMessage: {
    backgroundColor: "rgba(139,0,0,0.2)",
  },
  correctionMessage: {
    backgroundColor: "rgba(70,130,180,0.2)",
  },
  messageText: {
    color: "white",
    fontSize: 16,
  },
  messageTypeText: {
    color: "#888",
    fontSize: 12,
    marginTop: 5,
    fontStyle: "italic",
  },
  inputContainer: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  micButtonWrapper: {
    alignItems: "center",
  },
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "white",
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#FF1493",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});