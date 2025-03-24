import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Linking,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Mentor {
  id: string;
  name: string;
  expertise: string;
  availability: string;
  email: string;
  image: string;
  rating: number;
}

const mentors: Mentor[] = [
  {
    id: '1',
    name: 'Dr. Sophie Martin',
    expertise: 'French Literature & Grammar',
    availability: 'Mon, Wed, Fri',
    email: 'sophie.martin@example.com',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Pierre Dubois',
    expertise: 'Conversational French',
    availability: 'Tue, Thu, Sat',
    email: 'pierre.dubois@example.com',
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
    rating: 4.9,
  },
  {
    id: '3',
    name: 'Marie Laurent',
    expertise: 'Business French & Culture',
    availability: 'Mon-Fri',
    email: 'marie.laurent@example.com',
    image: 'https://randomuser.me/api/portraits/women/2.jpg',
    rating: 4.7,
  },
];

const DiscussionScreen = () => {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const handleSendEmail = (mentor: Mentor) => {
    const subject = encodeURIComponent(emailSubject || 'Mentoring Session Request');
    const body = encodeURIComponent(emailBody || `Hi ${mentor.name},\n\nI would like to schedule a mentoring session with you.`);
    const mailtoLink = `mailto:${mentor.email}?subject=${subject}&body=${body}`;
    
    Linking.canOpenURL(mailtoLink)
      .then(supported => {
        if (supported) {
          return Linking.openURL(mailtoLink);
        }
      })
      .catch(error => console.error('Error opening email:', error));
  };

  const renderMentorCard = (mentor: Mentor) => (
    <TouchableOpacity
      key={mentor.id}
      style={styles.mentorCard}
      onPress={() => setSelectedMentor(mentor)}
    >
      <Image
        source={{ uri: mentor.image }}
        style={styles.mentorImage}
      />
      <View style={styles.mentorInfo}>
        <Text style={styles.mentorName}>{mentor.name}</Text>
        <Text style={styles.mentorExpertise}>{mentor.expertise}</Text>
        <View style={styles.availabilityContainer}>
          <Feather name="calendar" size={14} color="#666" />
          <Text style={styles.availabilityText}>{mentor.availability}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Feather name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{mentor.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meet Your Mentors</Text>
        <Text style={styles.headerSubtitle}>Schedule a session with expert French tutors</Text>
      </View>

      {!selectedMentor ? (
        <ScrollView style={styles.mentorList}>
          {mentors.map(renderMentorCard)}
        </ScrollView>
      ) : (
        <View style={styles.emailForm}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedMentor(null)}
          >
            <Feather name="arrow-left" size={24} color="#0066FF" />
            <Text style={styles.backButtonText}>Back to Mentors</Text>
          </TouchableOpacity>

          <View style={styles.selectedMentorInfo}>
            <Image
              source={{ uri: selectedMentor.image }}
              style={styles.selectedMentorImage}
            />
            <Text style={styles.selectedMentorName}>{selectedMentor.name}</Text>
            <Text style={styles.selectedMentorExpertise}>{selectedMentor.expertise}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Subject</Text>
            <TextInput
              style={styles.input}
              value={emailSubject}
              onChangeText={setEmailSubject}
              placeholder="Enter email subject"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={emailBody}
              onChangeText={setEmailBody}
              placeholder="Type your message here..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
            />
          </View>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => handleSendEmail(selectedMentor)}
          >
            <Feather name="mail" size={20} color="white" />
            <Text style={styles.sendButtonText}>Send Email</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111b21',
  },
  header: {
    padding: 20,
    backgroundColor: '#0066FF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  mentorList: {
    flex: 1,
    padding: 15,
  },
  mentorCard: {
    flexDirection: 'row',
    backgroundColor: '#2b3940',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  mentorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  mentorExpertise: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  availabilityText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 6,
  },
  emailForm: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#0066FF',
    fontSize: 16,
    marginLeft: 10,
  },
  selectedMentorInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  selectedMentorImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  selectedMentorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  selectedMentorExpertise: {
    fontSize: 16,
    color: '#ccc',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2b3940',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#0066FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default DiscussionScreen; 