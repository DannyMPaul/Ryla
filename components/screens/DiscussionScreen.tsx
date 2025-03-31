import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ref, onValue, set, push, serverTimestamp } from 'firebase/database';
import { database } from '../../app/firebase/firebase';
import { getAuth } from 'firebase/auth';
import { Feather } from '@expo/vector-icons';

interface Mentor {
  id: string;
  email: string;
  name: string;
  isOnline: boolean;
  lastSeen: number;
  expertise: string;
  avatar: string;
}

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  mentorId: string;
  mentorName: string;
  timestamp: number;
  isReply: boolean;
}

const STATIC_MENTORS = [
  {
    id: '1',
    name: "Sarah Johnson",
    email: "sarah.j@ryla.com",
    isOnline: true,
    lastSeen: Date.now(),
    expertise: "French Grammar & Conversation",
    avatar: "SJ"
  },
  {
    id: '2',
    name: "Michael Chen",
    email: "michael.c@ryla.com",
    isOnline: false,
    lastSeen: Date.now() - 3600000, // 1 hour ago
    expertise: "Pronunciation & Accent",
    avatar: "MC"
  },
  {
    id: '3',
    name: "Emma Rodriguez",
    email: "emma.r@ryla.com",
    isOnline: true,
    lastSeen: Date.now(),
    expertise: "Business French & Culture",
    avatar: "ER"
  }
];

const DiscussionScreen = () => {
  const [loading, setLoading] = useState(true);
  const [mentors] = useState<Mentor[]>(STATIC_MENTORS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    initializeMentors();
    loadMessages();
  }, []);

  const initializeMentors = async () => {
    try {
      const mentorsRef = ref(database, 'mentors');
      await set(mentorsRef, STATIC_MENTORS);
      console.log('Mentors initialized in database');
      setLoading(false);
    } catch (error) {
      console.error('Error initializing mentors:', error);
      setLoading(false);
    }
  };

  const loadMessages = () => {
    const messagesRef = ref(database, 'messages');
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const messageList = Object.entries(data).map(([id, msg]: [string, any]) => ({
            id,
            text: msg.text,
            userId: msg.userId,
            userName: msg.userName,
            mentorId: msg.mentorId,
            mentorName: msg.mentorName,
            timestamp: msg.timestamp,
            isReply: msg.isReply,
          }));
          setMessages(messageList.sort((a, b) => b.timestamp - a.timestamp));
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error processing messages:', error);
        setMessages([]);
      }
    });

    return () => unsubscribe();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedMentor || !auth.currentUser) return;

    setSending(true);
    try {
      const messagesRef = ref(database, 'messages');
      const messageData = {
        text: newMessage,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        mentorId: selectedMentor.id,
        mentorName: selectedMentor.name,
        timestamp: serverTimestamp(),
        isReply: false,
      };

      await push(messagesRef, messageData);
      setNewMessage('');
      setShowMessageModal(false);
      Alert.alert('Success', 'Message sent successfully!');
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Mentors</Text>
      </View>

      <ScrollView style={styles.mentorsContainer}>
        {mentors.map((mentor) => (
          <TouchableOpacity 
            key={mentor.id} 
            style={styles.mentorCard}
            onPress={() => {
              setSelectedMentor(mentor);
              setShowMessageModal(true);
            }}
          >
            <View style={styles.mentorAvatar}>
              <Text style={styles.mentorInitial}>
                {mentor.avatar}
              </Text>
            </View>
            <View style={styles.mentorInfo}>
              <Text style={styles.mentorName}>{mentor.name}</Text>
              <Text style={styles.mentorEmail}>{mentor.email}</Text>
              <Text style={styles.mentorExpertise}>{mentor.expertise}</Text>
              <View style={styles.onlineStatus}>
                <View style={[
                  styles.statusDot,
                  mentor.isOnline ? styles.onlineDot : styles.offlineDot
                ]} />
                <Text style={styles.statusText}>
                  {mentor.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              {!mentor.isOnline && mentor.lastSeen && (
                <Text style={styles.lastSeen}>
                  Last seen: {formatTime(mentor.lastSeen)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Messages Section */}
        <View style={styles.messagesSection}>
          <Text style={styles.messagesTitle}>Recent Messages</Text>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isReply ? styles.replyMessage : styles.userMessage
              ]}
            >
              <View style={styles.messageHeader}>
                <Text style={styles.messageSender}>
                  {message.isReply ? message.mentorName : 'You'}
                </Text>
                <Text style={styles.messageTime}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Message to {selectedMentor?.name}</Text>
              <TouchableOpacity
                onPress={() => setShowMessageModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your message..."
              placeholderTextColor="#666"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send Message</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  mentorsContainer: {
    flex: 1,
    padding: 15,
  },
  mentorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2b3940',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  mentorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mentorInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  mentorEmail: {
    color: '#a0aec0',
    fontSize: 12,
    marginBottom: 4,
  },
  mentorExpertise: {
    color: '#58cc02',
    fontSize: 12,
    marginBottom: 4,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: '#58cc02',
  },
  offlineDot: {
    backgroundColor: '#666666',
  },
  statusText: {
    color: '#a0aec0',
    fontSize: 12,
  },
  lastSeen: {
    color: '#666666',
    fontSize: 10,
    fontStyle: 'italic',
  },
  messagesSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2b3940',
  },
  messagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  messageContainer: {
    backgroundColor: '#2b3940',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: '#1f2937',
  },
  replyMessage: {
    backgroundColor: '#2b3940',
    borderLeftWidth: 4,
    borderLeftColor: '#58cc02',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageSender: {
    color: '#58cc02',
    fontSize: 14,
    fontWeight: '600',
  },
  messageTime: {
    color: '#666666',
    fontSize: 12,
  },
  messageText: {
    color: 'white',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 5,
  },
  messageInput: {
    backgroundColor: '#2b3940',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  sendButton: {
    backgroundColor: '#0066FF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2b3940',
    opacity: 0.5,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DiscussionScreen; 