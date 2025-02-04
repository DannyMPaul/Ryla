//integrated with SpeakScreen.tsx

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import SpeakScreen from "./SpeakScreen";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  language?: "en" | "fr";
  type?: "grammar" | "conversation";
};

function TextScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "fr">("en");
  const [isProcessing, setIsProcessing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      language: selectedLanguage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsProcessing(true);

    try {
      const response = await axios.post("https://your-backend.com/process", {
        text: userMessage.text,
        language: selectedLanguage,
      });

      const botMessages: Message[] = [
        {
          id: Date.now().toString() + "_grammar",
          text: response.data.corrected_text || "No corrections needed.",
          sender: "bot",
          type: "grammar",
          language: selectedLanguage,
        },
        {
          id: Date.now().toString() + "_response",
          text: response.data.response,
          sender: "bot",
          type: "conversation",
          language: selectedLanguage,
        },
      ];

      setMessages((prev) => [...prev, ...botMessages]);
    } catch (error) {
      console.error("Processing error:", error);
      const errorMessage: Message = {
        id: Date.now().toString() + "_error",
        text: "Sorry, couldn't process your message.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <LinearGradient
      colors={["#1A1A1A", "#330033", "#660033"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          onPress={() =>
            setSelectedLanguage((prev) => (prev === "en" ? "fr" : "en"))
          }
          style={styles.languageToggle}
        >
          <Text style={styles.languageText}>
            Language: {selectedLanguage.toUpperCase()}
          </Text>
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageContainer,
                item.sender === "user" ? styles.userMessage : styles.botMessage,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
              {item.type && (
                <Text style={styles.messageTypeText}>
                  {item.type === "grammar" ? "Grammar" : "Response"}
                </Text>
              )}
            </View>
          )}
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
            onPress={handleSend}
            disabled={isProcessing || !inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("voice");

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "voice" && styles.activeTab]}
          onPress={() => setActiveTab("voice")}
        >
          <Text style={styles.tabText}>Voice</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "text" && styles.activeTab]}
          onPress={() => setActiveTab("text")}
        >
          <Text style={styles.tabText}>Text</Text>
        </TouchableOpacity>
      </View>
      {activeTab === "voice" ? <SpeakScreen /> : <TextScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    padding: 5,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF1493",
  },
  tabText: {
    color: "white",
    fontWeight: "bold",
  },
  languageToggle: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  languageText: {
    color: "white",
    fontWeight: "bold",
  },
  messageList: { padding: 10 },
  messageContainer: {
    maxWidth: "80%",
    borderRadius: 10,
    padding: 10,
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
  messageText: { color: "white" },
  messageTypeText: {
    color: "#888",
    fontSize: 10,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
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
  },
  sendButton: {
    backgroundColor: "#FF1493",
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
