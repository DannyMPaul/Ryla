import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { database, auth } from '../../firebase/firebase';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  mentorId: string;
  mentorName: string;
  timestamp: number;
  isReply: boolean;
  audioUrl?: string;
  isVoiceMessage?: boolean;
}

interface User {
  name: string;
  email: string;
  lastLogin?: string;
  progress?: {
    currentQuestion: number;
    totalCorrect: number;
    hearts: number;
  };
  quizResults?: {
    finalLevel: string;
    totalScore: number;
    scores: {
      beginner: number;
      intermediate: number;
      hard: number;
    };
    details: {
      totalQuestions: number;
      correctAnswers: number;
      accuracy: string;
    };
    completedAt: string;
  };
}

const MentorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.replace('/(tabs)');
      return;
    }

    loadMessages();
    loadUsers();
  }, []);

  const loadMessages = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const messagesRef = ref(database, 'messages');
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          // Filter messages for the current mentor
          const mentorMessages = Object.entries(data)
            .map(([id, msg]: [string, any]) => ({
              id,
              text: msg.text,
              userId: msg.userId,
              userName: msg.userName,
              mentorId: msg.mentorId,
              mentorName: msg.mentorName,
              timestamp: msg.timestamp,
              isReply: msg.isReply,
            }))
            .filter(msg => msg.mentorId === currentUser.email)
            .sort((a, b) => b.timestamp - a.timestamp);

          setMessages(mentorMessages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const loadUsers = () => {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          setUsers(data);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    });

    return () => unsubscribe();
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim() || !auth.currentUser) return;

    setSending(true);
    try {
      const messagesRef = ref(database, 'messages');
      const messageData = {
        text: replyText,
        userId: selectedMessage.userId,
        userName: auth.currentUser.displayName || 'Mentor',
        mentorId: auth.currentUser.email,
        mentorName: auth.currentUser.displayName || 'Mentor',
        timestamp: serverTimestamp(),
        isReply: true,
      };

      await push(messagesRef, messageData);
      setReplyText('');
      setSelectedMessage(null);
      setShowReplyModal(false);
      Alert.alert('Success', 'Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
      Alert.alert('Error', 'Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
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
        <Text style={styles.headerTitle}>Mentor Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <Text style={styles.noMessagesText}>No messages yet</Text>
        ) : (
          messages.map((message) => (
            <TouchableOpacity
              key={message.id}
              style={[
                styles.messageCard,
                message.isReply ? styles.replyMessage : styles.userMessage,
              ]}
            >
              <View style={styles.messageHeader}>
                <View style={styles.senderInfo}>
                  <Text style={styles.messageSender}>
                    {message.isReply ? 'You' : users[message.userId]?.name || message.userName}
                  </Text>
                  {!message.isReply && users[message.userId] && (
                    <View style={styles.userDetails}>
                      <Text style={styles.userEmail}>{users[message.userId]?.email || 'No email'}</Text>
                      {users[message.userId]?.quizResults && (
                        <View style={styles.userStats}>
                          <Text style={styles.userLevel}>
                            Level: {users[message.userId]?.quizResults?.finalLevel || 'N/A'}
                          </Text>
                          <Text style={styles.userAccuracy}>
                            Accuracy: {users[message.userId]?.quizResults?.details?.accuracy || 'N/A'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <Text style={styles.messageTime}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>
              <Text style={styles.messageText}>{message.text}</Text>
              {!message.isReply && (
                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => {
                    setSelectedMessage(message);
                    setShowReplyModal(true);
                  }}
                >
                  <Feather name="message-circle" size={16} color="#58cc02" />
                  <Text style={styles.replyButtonText}>Reply</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showReplyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReplyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply to Message</Text>
              <TouchableOpacity
                onPress={() => setShowReplyModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {selectedMessage && (
              <View style={styles.originalMessageContainer}>
                <Text style={styles.originalMessageLabel}>Original Message:</Text>
                <Text style={styles.originalMessageText}>{selectedMessage.text}</Text>
                <Text style={styles.originalMessageSender}>
                  From: {users[selectedMessage.userId]?.name || selectedMessage.userName}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Type your reply..."
              placeholderTextColor="#666"
              multiline
            />
            <TouchableOpacity
              style={[styles.replyButton, (!replyText.trim() || sending) && styles.replyButtonDisabled]}
              onPress={handleSendReply}
              disabled={!replyText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.replyButtonText}>Send Reply</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  logoutButton: {
    backgroundColor: '#F04A63',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messageCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  userMessage: {
    backgroundColor: '#2b3940',
  },
  replyMessage: {
    backgroundColor: '#1f2937',
    borderLeftWidth: 4,
    borderLeftColor: '#58cc02',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  senderInfo: {
    flex: 1,
  },
  userDetails: {
    marginTop: 4,
  },
  userEmail: {
    color: '#a0aec0',
    fontSize: 12,
    marginBottom: 2,
  },
  userStats: {
    flexDirection: 'row',
    gap: 8,
  },
  userLevel: {
    color: '#58cc02',
    fontSize: 12,
    fontWeight: '500',
  },
  userAccuracy: {
    color: '#58cc02',
    fontSize: 12,
    fontWeight: '500',
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
  noMessagesText: {
    color: '#666666',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
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
  replyInput: {
    backgroundColor: '#2b3940',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
    borderRadius: 8,
  },
  replyButtonDisabled: {
    backgroundColor: '#2b3940',
    opacity: 0.5,
  },
  replyButtonText: {
    color: '#58cc02',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  originalMessageContainer: {
    backgroundColor: '#2b3940',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  originalMessageLabel: {
    color: '#58cc02',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  originalMessageText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  originalMessageSender: {
    color: '#a0aec0',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default MentorDashboard; 