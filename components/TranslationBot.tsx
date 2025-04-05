import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import axios from "axios";

const MYMEMORY_API_URL = "https://api.mymemory.translated.net/get";

const fallbackTranslations = {
  tomato: "tomate",
  hello: "bonjour",
  goodbye: "au revoir",
  "thank you": "merci",
  please: "s'il vous plaît",
  "how are you": "comment allez-vous",
};

const TranslationBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<
    Array<{ text: string; isUser: boolean }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    checkApiAvailability();
  }, []);

  const checkApiAvailability = async () => {
    try {
      console.log("Checking MyMemory API availability...");
      const response = await fetch(`${MYMEMORY_API_URL}?q=test&langpair=en|fr`);
      console.log("MyMemory API response status:", response.status);

      if (response.ok) {
        console.log("MyMemory API is available");
        setIsOnline(true);
      } else {
        console.log("MyMemory API returned error status:", response.status);
        setIsOnline(false);
      }
    } catch (error) {
      console.error("MyMemory API connection error:", error);
      setIsOnline(false);
    }
  };

  const translateWithAPI = async (
    text: string,
    from: string,
    to: string
  ): Promise<string> => {
    try {
      console.log("Attempting translation with MyMemory API...");
      const response = await fetch(
        `${MYMEMORY_API_URL}?q=${encodeURIComponent(
          text
        )}&langpair=${from}|${to}`
      );

      if (!response.ok) {
        throw new Error(`Translation failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Translation successful:", data);
      return data.responseData?.translatedText || text;
    } catch (error) {
      console.error("Translation API error:", error);
      throw error;
    }
  };

  const fallbackTranslate = (text: string, isEnglishToFrench: boolean) => {
    const lowerText = text.toLowerCase();
    if (isEnglishToFrench) {
      return (
        fallbackTranslations[lowerText as keyof typeof fallbackTranslations] ||
        null
      );
    } else {
      const entry = Object.entries(fallbackTranslations).find(
        ([_, french]) => french.toLowerCase() === lowerText
      );
      return entry ? entry[0] : null;
    }
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const userQuery = query.toLowerCase().trim();
    setMessages((prev) => [...prev, { text: query, isUser: true }]);
    setQuery("");
    setIsLoading(true);

    try {
      let response: string;
      const isEnglishPattern = /^[a-zA-Z\s]+$/;
      const isEnglishToFrench = isEnglishPattern.test(userQuery);

      if (isOnline) {
        const translated = await translateWithAPI(
          userQuery,
          isEnglishToFrench ? "en" : "fr",
          isEnglishToFrench ? "fr" : "en"
        );
        response = `${
          isEnglishToFrench ? "fr" : "English"
        } translation: "${translated}"`;
      } else {
        const fallbackResult = fallbackTranslate(userQuery, isEnglishToFrench);
        if (fallbackResult) {
          response = `${
            isEnglishToFrench ? "fr" : "English"
          } translation: "${fallbackResult}"`;
        } else {
          response =
            "I'm sorry, I don't know that word yet. Please try another word or phrase.";
        }
      }

      setMessages((prev) => [...prev, { text: response, isUser: false }]);
    } catch (error) {
      console.error("Translation error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I couldn't translate that. Please try again.",
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.botButton}
        onPress={() => setIsOpen(true)}
      >
        <Feather name="message-circle" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.chatContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Translation Assistant</Text>
              {!isOnline && (
                <Text style={styles.offlineText}>(Offline Mode)</Text>
              )}
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.messagesContainer}>
              {messages.map((message, index) => (
                <View
                  key={index}
                  style={[
                    styles.message,
                    message.isUser ? styles.userMessage : styles.botMessage,
                  ]}
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              ))}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#F04A63" />
                </View>
              )}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Type a word to translate..."
                placeholderTextColor="#666"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                disabled={!query.trim()}
              >
                <Feather name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  botButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#F04A63",
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  chatContainer: {
    height: "70%",
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F04A63",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  offlineText: {
    color: "#fff",
    fontSize: 12,
    marginRight: 10,
    opacity: 0.8,
  },
  closeButton: {
    padding: 5,
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  message: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: "#F04A63",
    alignSelf: "flex-end",
  },
  botMessage: {
    backgroundColor: "#333",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
  },
  loadingContainer: {
    padding: 10,
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#2a2a2a",
  },
  input: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#fff",
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#F04A63",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TranslationBot;
