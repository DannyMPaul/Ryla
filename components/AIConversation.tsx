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
}

const AIConversation: React.FC<AIConversationProps> = ({ visible, onClose, onComplete, username = 'there' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useEnglish, setUseEnglish] = useState(true);
  const [showTranslations, setShowTranslations] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && messages.length === 0) {
      sendInitialGreeting();
    }
  }, [visible]);

  const speakText = async (text: string, language: string) => {
    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        language: language,
        rate: 0.8,
        onDone: () => {
          setIsSpeaking(false);
        }
      });
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const sendInitialGreeting = async () => {
    setIsLoading(true);
    try {
      const aiMessage = useEnglish 
        ? `Hello ${username}! I'm your translation assistant. Type in ${useEnglish ? 'English' : 'French'} and I'll translate it.` 
        : `Bonjour ${username}! Je suis votre assistant de traduction. Écrivez en ${useEnglish ? 'anglais' : 'français'} et je le traduirai.`;

      const translation = useEnglish 
        ? `Bonjour ${username}! Je suis votre assistant de traduction. Écrivez en anglais et je le traduirai.`
        : `Hello ${username}! I'm your translation assistant. Type in French and I'll translate it.`;

      setMessages([
        {
          id: Date.now().toString(),
          text: aiMessage,
          sender: 'ai',
          timestamp: Date.now(),
          translation: translation
        }
      ]);

      // Speak the initial greeting
      await speakText(aiMessage, useEnglish ? 'en-US' : 'fr-FR');
    } catch (error) {
      console.error('Error sending initial greeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processUserInput = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    translateAndRespond(text, userMessage.id);
  };

  const sendTextMessage = async () => {
    if (!inputText.trim()) return;
    processUserInput(inputText);
    setInputText('');
  };

  const translateAndRespond = async (userText: string, messageId: string) => {
    setIsLoading(true);
    try {
      let translation: string | undefined = undefined;
      
      if (useEnglish) {
        // User is typing in English, translate to French
        translation = await translateText(userText, 'en', 'fr');
      } else {
        // User is typing in French, translate to English
        translation = await translateText(userText, 'fr', 'en');
      }
      
      // Update the user message with translation
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, translation } 
          : msg
      ));

      // Add AI response with translation
      const aiMessage = useEnglish 
        ? `Here's the French translation: "${translation}"`
        : `Voici la traduction en anglais: "${translation}"`;

      const aiTranslation = useEnglish 
        ? `Voici la traduction en français: "${translation}"`
        : `Here's the English translation: "${translation}"`;

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: aiMessage,
        sender: 'ai',
        timestamp: Date.now(),
        translation: aiTranslation
      }]);

      // Speak the AI response
      await speakText(aiMessage, useEnglish ? 'en-US' : 'fr-FR');

      // Save conversation to Firebase
      saveConversationToFirebase([...messages, {
        id: messageId,
        text: userText,
        sender: 'user',
        timestamp: Date.now(),
        translation
      }, {
        id: Date.now().toString(),
        text: aiMessage,
        sender: 'ai',
        timestamp: Date.now(),
        translation: aiTranslation
      }]);

      // Scroll to bottom after new messages
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error translating and responding:', error);
      Alert.alert('Translation Error', 'Failed to translate the text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const translateText = async (text: string, fromLang: string, toLang: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
      );
      
      if (!response.ok) {
        throw new Error(`Translation failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
      throw new Error('Invalid translation response');
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
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
      
      if (onComplete && messages.length >= 4) {
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
          
          {message.translation && showTranslations && message.showTranslation && (
            <View style={styles.translationContainer}>
              <Text style={styles.translationText}>
                <Text style={styles.translationLabel}>{useEnglish ? 'French: ' : 'English: '}</Text>
                {message.translation}
              </Text>
            </View>
          )}

          {!isUser && (
            <TouchableOpacity 
              style={styles.speakButton}
              onPress={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  speakText(message.text, useEnglish ? 'en-US' : 'fr-FR');
                }
              }}
            >
              <Feather 
                name={isSpeaking ? "stop-circle" : "play-circle"} 
                size={24} 
                color="#007AFF" 
              />
            </TouchableOpacity>
          )}
        </View>
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
            {useEnglish ? 'English to French Translation' : 'French to English Translation'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.settingsContainer}>
          <View style={styles.languageToggle}>
            <Text style={styles.languageLabel}>English</Text>
            <Switch
              value={!useEnglish}
              onValueChange={(value) => {
                setUseEnglish(!value);
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
                <Text style={styles.loadingText}>Translating...</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={useEnglish ? "Type in English..." : "Écrivez en français..."}
              placeholderTextColor="#999"
              multiline
            />
            
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
  speakButton: {
    marginTop: 8,
    padding: 4,
    alignSelf: 'flex-start',
  },
});

export default AIConversation; 