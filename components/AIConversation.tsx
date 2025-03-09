import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { getDatabase, ref, get, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';

interface AIConversationProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
  username?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  translation?: string;
  showTranslation?: boolean;
  analysis?: {
    correctedText?: string;
    feedback?: string;
    languageDetected?: string;
  };
}

// Predefined responses for demo purposes
const AI_RESPONSES = {
  greeting: {
    french: (name: string) => `Bonjour ${name}! Comment ça va aujourd'hui? Je suis votre tuteur de français.`,
    english: (name: string) => `Hello ${name}! How are you today? I am your French tutor.`
  },
  responses: [
    {
      french: "Très bien! Pouvez-vous me dire ce que vous aimez faire pendant votre temps libre?",
      english: "Very good! Can you tell me what you like to do in your free time?"
    },
    {
      french: "C'est intéressant! Avez-vous déjà visité la France?",
      english: "That's interesting! Have you ever visited France?"
    },
    {
      french: "Je comprends. Parlons de la nourriture française. Quel est votre plat préféré?",
      english: "I understand. Let's talk about French food. What is your favorite dish?"
    },
    {
      french: "Excellent choix! Savez-vous comment commander ce plat en français?",
      english: "Excellent choice! Do you know how to order this dish in French?"
    },
    {
      french: "Très bien! Maintenant, essayons de pratiquer quelques phrases utiles pour voyager.",
      english: "Very good! Now, let's try to practice some useful phrases for traveling."
    },
    {
      french: "Parfait! Vous faites de bons progrès. Continuons à pratiquer!",
      english: "Perfect! You're making good progress. Let's continue practicing!"
    }
  ],
  corrections: {
    "bonjur": {
      corrected: "bonjour",
      feedback: "Le mot correct est 'bonjour'. Attention à l'orthographe.",
      english_feedback: "The correct word is 'bonjour'. Pay attention to the spelling."
    },
    "je suis bien": {
      corrected: "je vais bien",
      feedback: "Pour dire 'I am well' en français, on dit généralement 'je vais bien' plutôt que 'je suis bien'.",
      english_feedback: "To say 'I am well' in French, we usually say 'je vais bien' rather than 'je suis bien'."
    },
    "j'aime le mange": {
      corrected: "j'aime manger",
      feedback: "Le verbe correct est 'manger' (to eat). 'Mange' est la forme conjuguée (il/elle mange).",
      english_feedback: "The correct verb is 'manger' (to eat). 'Mange' is the conjugated form (he/she eats)."
    }
  },
  english_responses: [
    "I see you're writing in English. Here's how to say that in French: ",
    "That's good English! Let me help you say it in French: ",
    "Let me translate that to French for you: ",
    "In French, you would say: "
  ]
};

// Sample translations for English inputs
const ENGLISH_TO_FRENCH = {
  "hello": "bonjour",
  "how are you": "comment allez-vous",
  "my name is": "je m'appelle",
  "i like": "j'aime",
  "i don't understand": "je ne comprends pas",
  "thank you": "merci",
  "yes": "oui",
  "no": "non",
  "please": "s'il vous plaît",
  "goodbye": "au revoir",
  "good morning": "bonjour",
  "good evening": "bonsoir",
  "good night": "bonne nuit",
  "what is your name": "comment vous appelez-vous",
  "i am learning french": "j'apprends le français",
  "where is": "où est",
  "how much": "combien",
  "i want": "je veux",
  "i need": "j'ai besoin de",
  "i love": "j'adore"
};

const AIConversation: React.FC<AIConversationProps> = ({ visible, onClose, onComplete, username = 'there' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);
  const [useEnglish, setUseEnglish] = useState(true); // Default to English for beginners
  const [showTranslations, setShowTranslations] = useState(true); // Default to showing translations
  const scrollViewRef = useRef<ScrollView>(null);

  // Add console logs for debugging
  console.log('AIConversation rendered, visible:', visible);

  useEffect(() => {
    console.log('AIConversation useEffect triggered, visible:', visible);
    setupAudio();
    if (visible && messages.length === 0) {
      // Send initial greeting when conversation opens
      console.log('Sending initial greeting...');
      sendInitialGreeting();
    }
  }, [visible]);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const sendInitialGreeting = async () => {
    console.log('sendInitialGreeting function called');
    setIsLoading(true);
    try {
      // Use a hardcoded greeting for demo with the user's name
      const aiMessage = useEnglish 
        ? AI_RESPONSES.greeting.english(username) 
        : AI_RESPONSES.greeting.french(username);
      const translation = useEnglish 
        ? AI_RESPONSES.greeting.french(username) 
        : AI_RESPONSES.greeting.english(username);

      setMessages([
        {
          id: Date.now().toString(),
          text: aiMessage,
          sender: 'ai',
          timestamp: Date.now(),
          translation: translation
        }
      ]);

      // Speak the AI message
      try {
        console.log('Speaking the AI message...');
        await Speech.speak(aiMessage, {
          language: useEnglish ? 'en-US' : 'fr-FR',
          rate: 0.8
        });
        console.log('Speech completed');
      } catch (speechError) {
        console.error('Error speaking the AI message:', speechError);
      }
    } catch (error) {
      console.error('Error sending initial greeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      console.log('Stopping recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);

      if (uri) {
        // For demo purposes, we'll simulate speech recognition
        simulateSpeechRecognition();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Could not process recording. Please try again.');
    }
  };

  const simulateSpeechRecognition = async () => {
    setIsLoading(true);
    
    // Simulate processing delay
    setTimeout(() => {
      // Sample phrases based on selected language
      const samplePhrases = useEnglish 
        ? [
            "Hello, my name is John",
            "I am fine, thank you",
            "I like to eat bread",
            "I don't understand",
            "Yes, I like France"
          ]
        : [
            "Bonjur, je m'appelle Jean",
            "Je suis bien, merci",
            "J'aime le mange du pain",
            "Je ne comprends pas",
            "Oui, j'aime la France"
          ];
      
      // Randomly select one
      const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
      
      // Process the simulated speech input
      processUserInput(randomPhrase);
    }, 1500);
  };

  const processUserInput = (text: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Check for corrections or translations
    analyzeAndRespond(text, userMessage.id);
  };

  const sendTextMessage = async () => {
    if (!inputText.trim()) return;
    
    processUserInput(inputText);
    setInputText('');
  };

  // Function to translate English to French (simplified demo)
  const translateEnglishToFrench = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    // Check for exact phrases first
    if (lowerText in ENGLISH_TO_FRENCH) {
      return ENGLISH_TO_FRENCH[lowerText as keyof typeof ENGLISH_TO_FRENCH];
    }
    
    // Check for partial matches
    let translated = text;
    for (const [english, french] of Object.entries(ENGLISH_TO_FRENCH)) {
      if (lowerText.includes(english)) {
        translated = translated.replace(
          new RegExp(english, 'i'), 
          french as string
        );
      }
    }
    
    return translated !== text ? translated : text + " (translation not available)";
  };

  // Function to translate French to English (simplified demo)
  const translateFrenchToEnglish = (text: string): string => {
    // Reverse the ENGLISH_TO_FRENCH dictionary
    const frenchToEnglish: Record<string, string> = Object.entries(ENGLISH_TO_FRENCH).reduce(
      (acc, [english, french]) => ({...acc, [french]: english}), 
      {}
    );
    
    const lowerText = text.toLowerCase();
    
    // Check for exact phrases first
    if (lowerText in frenchToEnglish) {
      return frenchToEnglish[lowerText];
    }
    
    // Check for partial matches
    let translated = text;
    for (const [french, english] of Object.entries(frenchToEnglish)) {
      if (lowerText.includes(french)) {
        translated = translated.replace(
          new RegExp(french, 'i'), 
          english
        );
      }
    }
    
    return translated !== text ? translated : text + " (translation not available)";
  };

  const analyzeAndRespond = async (userText: string, messageId: string) => {
    setIsLoading(true);
    try {
      let analysis: {
        languageDetected: string;
        correctedText: string;
        feedback: string;
      } | undefined = undefined;
      
      let translation: string | undefined = undefined;
      
      if (useEnglish) {
        // User is typing in English, translate to French
        translation = translateEnglishToFrench(userText);
        
        // Update the user message with translation
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, translation } 
            : msg
        ));
      } else {
        // User is typing in French, check for corrections
        analysis = {
          languageDetected: "French",
          correctedText: userText,
          feedback: ""
        };
        
        // Check for common errors in our predefined list
        const lowerText = userText.toLowerCase();
        for (const [error, correction] of Object.entries(AI_RESPONSES.corrections)) {
          if (lowerText.includes(error)) {
            analysis.correctedText = userText.replace(new RegExp(error, 'i'), correction.corrected);
            analysis.feedback = useEnglish ? correction.english_feedback : correction.feedback;
            break;
          }
        }
        
        // Also provide translation to English
        translation = translateFrenchToEnglish(userText);
        
        // Update the user message with analysis and translation
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, analysis, translation } 
            : msg
        ));
      }

      // Get AI response
      setTimeout(() => {
        // Get next response from our predefined list
        const responseObj = AI_RESPONSES.responses[responseIndex % AI_RESPONSES.responses.length];
        const aiMessage = useEnglish 
          ? responseObj.english 
          : responseObj.french;
        
        const aiTranslation = useEnglish 
          ? responseObj.french 
          : responseObj.english;
        
        setResponseIndex(prev => prev + 1);
        
        // If user wrote in English but we're in French mode, add translation suggestion
        let finalMessage = aiMessage;
        if (useEnglish && translation) {
          const prefix = AI_RESPONSES.english_responses[Math.floor(Math.random() * AI_RESPONSES.english_responses.length)];
          finalMessage = `${prefix}"${translation}"`;
        }
        
        // Add AI response
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: finalMessage,
          sender: 'ai',
          timestamp: Date.now(),
          translation: aiTranslation
        }]);

        // Speak the AI message
        Speech.speak(finalMessage, {
          language: useEnglish ? 'en-US' : 'fr-FR',
          rate: 0.8
        });

        // Save conversation to Firebase
        saveConversationToFirebase([...messages, {
          id: messageId,
          text: userText,
          sender: 'user',
          timestamp: Date.now(),
          translation,
          analysis
        }, {
          id: Date.now().toString(),
          text: finalMessage,
          sender: 'ai',
          timestamp: Date.now(),
          translation: aiTranslation
        }]);

        setIsLoading(false);
        
        // Scroll to bottom after new messages
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 1000);

    } catch (error) {
      console.error('Error analyzing and responding:', error);
      setIsLoading(false);
    }
  };

  const saveConversationToFirebase = async (conversationMessages: Message[]) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const db = getDatabase();
      const conversationRef = ref(db, `users/${user.uid}/conversations/${Date.now()}`);
      await update(conversationRef, {
        messages: conversationMessages,
        timestamp: Date.now(),
        language: useEnglish ? 'en' : 'fr'
      });
      
      // Mark the lesson as completed after saving the conversation
      if (onComplete && messages.length >= 4) { // Complete after a few exchanges
        onComplete();
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const toggleTranslation = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, showTranslation: !msg.showTranslation } 
        : msg
    ));
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.aiMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : {}
          ]}>{message.text}</Text>
          
          {/* Translation button */}
          {message.translation && showTranslations && (
            <TouchableOpacity 
              style={styles.translationButton}
              onPress={() => toggleTranslation(message.id)}
            >
              <Text style={styles.translationButtonText}>
                {message.showTranslation ? 'Hide Translation' : 'Show Translation'}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Translation text */}
          {message.translation && showTranslations && message.showTranslation && (
            <View style={styles.translationContainer}>
              <Text style={styles.translationText}>
                <Text style={styles.translationLabel}>{useEnglish ? 'French: ' : 'English: '}</Text>
                {message.translation}
              </Text>
            </View>
          )}
        </View>
        
        {/* Correction feedback */}
        {isUser && message.analysis && message.analysis.feedback && (
          <View style={styles.feedbackContainer}>
            {message.analysis.correctedText && message.analysis.correctedText !== message.text && (
              <Text style={styles.correctionText}>
                <Text style={styles.correctionLabel}>Correction: </Text>
                {message.analysis.correctedText}
              </Text>
            )}
            <Text style={styles.feedbackText}>
              <Text style={styles.feedbackLabel}>Feedback: </Text>
              {message.analysis.feedback}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {useEnglish ? 'English to French Practice' : 'French Conversation'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Language toggle and translation settings */}
        <View style={styles.settingsContainer}>
          <View style={styles.languageToggle}>
            <Text style={styles.languageLabel}>English</Text>
            <Switch
              value={!useEnglish}
              onValueChange={(value) => {
                setUseEnglish(!value);
                // Reset conversation when changing language
                if (messages.length > 0) {
                  Alert.alert(
                    'Change Language',
                    'Changing language will reset the conversation. Continue?',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Continue',
                        onPress: () => {
                          setMessages([]);
                          setTimeout(() => sendInitialGreeting(), 300);
                        },
                      },
                    ]
                  );
                }
              }}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={!useEnglish ? '#f5dd4b' : '#f4f3f4'}
            />
            <Text style={styles.languageLabel}>French</Text>
          </View>
          
          <View style={styles.translationSetting}>
            <Text style={styles.settingLabel}>Show Translations</Text>
            <Switch
              value={showTranslations}
              onValueChange={setShowTranslations}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={showTranslations ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map(renderMessage)}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={useEnglish ? "Type your message in English..." : "Écrivez votre message en français..."}
              placeholderTextColor="#999"
              multiline
            />
            
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordingActive]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <Feather name="mic" size={24} color={isRecording ? "#FF3B30" : "#007AFF"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendTextMessage}
              disabled={!inputText.trim()}
            >
              <Feather name="send" size={24} color={inputText.trim() ? "#007AFF" : "#CCC"} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  settingsContainer: {
    backgroundColor: '#FFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  languageLabel: {
    marginHorizontal: 8,
    fontSize: 16,
  },
  translationSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
  },
  userMessageBubble: {
    backgroundColor: '#007AFF',
  },
  aiMessageBubble: {
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  userMessageText: {
    color: '#FFF',
  },
  translationButton: {
    marginTop: 8,
    padding: 4,
    alignSelf: 'flex-start',
  },
  translationButtonText: {
    fontSize: 12,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  translationContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  translationText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  translationLabel: {
    fontWeight: 'bold',
  },
  feedbackContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  correctionText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  correctionLabel: {
    fontWeight: 'bold',
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
  },
  feedbackLabel: {
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  recordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  recordingActive: {
    backgroundColor: '#FFEBEB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
});

export default AIConversation; 