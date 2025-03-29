import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { database } from '../../app/firebase/firebase';
import { getAuth } from 'firebase/auth';
import axios from 'axios';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: number;
  isAdmin?: boolean;
  isMentor?: boolean;
  mentorId?: string;
}

interface Mentor {
  id: string;
  email: string;
  name: string;
  isOnline: boolean;
}

const DiscussionScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const auth = getAuth();

  useEffect(() => {
    loadMessages();
    loadMentors();
  }, []);

  const loadMessages = () => {
    const messagesRef = ref(database, 'messages');
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([id, msg]: [string, any]) => ({
          id,
          text: msg.text,
          userId: msg.userId,
          userName: msg.userName,
          timestamp: msg.timestamp,
          isAdmin: msg.isAdmin,
          isMentor: msg.isMentor,
          mentorId: msg.mentorId,
        }));
        setMessages(messageList.sort((a, b) => b.timestamp - a.timestamp));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const loadMentors = () => {
    const mentorsRef = ref(database, 'mentors');
    onValue(mentorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const mentorList = Object.entries(data).map(([id, mentor]: [string, any]) => ({
          id,
          email: mentor.email,
          name: mentor.name,
          isOnline: mentor.isOnline,
        }));
        setMentors(mentorList);
      }
    });
  };

  const sendEmailNotification = async (message: string, userName: string) => {
    try {
      // Send to admin
      await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
        service_id: 'YOUR_SERVICE_ID',
        template_id: 'YOUR_TEMPLATE_ID',
        user_id: 'YOUR_USER_ID',
        template_params: {
          to_email: 'admin@example.com',
          message: message,
          user_name: userName,
        },
      });

      // Send to all online mentors
      const onlineMentors = mentors.filter(mentor => mentor.isOnline);
      for (const mentor of onlineMentors) {
        await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
          service_id: 'YOUR_SERVICE_ID',
          template_id: 'YOUR_TEMPLATE_ID',
          user_id: 'YOUR_USER_ID',
          template_params: {
            to_email: mentor.email,
            message: message,
            user_name: userName,
          },
        });
      }
    } catch (error) {
      console.error('Error sending email notifications:', error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !auth.currentUser) return;

    setSending(true);
    try {
      const messagesRef = ref(database, 'messages');
      const messageData = {
        text: newMessage,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        timestamp: serverTimestamp(),
        isAdmin: false,
        isMentor: false,
      };

      await push(messagesRef, messageData);
      
      // Send email notifications
      await sendEmailNotification(newMessage, messageData.userName);
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discussion</Text>
        <View style={styles.onlineMentors}>
          <Text style={styles.onlineText}>
            {mentors.filter(m => m.isOnline).length} mentors online
          </Text>
        </View>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.userId === auth.currentUser?.uid ? styles.userMessage : styles.otherMessage,
              message.isAdmin && styles.adminMessage,
              message.isMentor && styles.mentorMessage,
            ]}
          >
            <View style={styles.messageContent}>
              <Text style={styles.userName}>
                {message.userId === auth.currentUser?.uid ? 'You' : message.userName}
                {message.isAdmin && ' (Admin)'}
                {message.isMentor && ' (Mentor)'}
              </Text>
              <Text style={styles.messageText}>{message.text}</Text>
              <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#666666"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="send" size={24} color={newMessage.trim() ? '#fff' : '#666666'} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111b21',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111b21',
  },
  header: {
    padding: 20,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#2b3940',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineMentors: {
    marginTop: 5,
  },
  onlineText: {
    color: '#58cc02',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  adminMessage: {
    borderColor: '#FFD700',
    borderWidth: 1,
  },
  mentorMessage: {
    borderColor: '#58cc02',
    borderWidth: 1,
  },
  messageContent: {
    backgroundColor: '#1f2937',
    padding: 10,
    borderRadius: 12,
  },
  userName: {
    fontSize: 12,
    color: '#0066FF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: 'white',
  },
  timestamp: {
    fontSize: 10,
    color: '#666666',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#2b3940',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#2b3940',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    color: 'white',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#0066FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2b3940',
    opacity: 0.5,
  },
});

export default DiscussionScreen; 