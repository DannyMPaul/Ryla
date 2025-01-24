import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { getAuth, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDatabase, ref as dbRef, onValue } from 'firebase/database';

interface UserData {
  name: string;
  email: string;
  lastLogin: string;
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
  learnedWords?: {
    [key: string]: {
      french: string;
      english: string;
      learnedAt: string;
      section: string;
      context?: string;
    };
  };
}

const ProfileScreen = () => {
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLearnedWordsOpen, setIsLearnedWordsOpen] = useState(false);
  const auth = getAuth();
  const storage = getStorage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || '');
        const nameFromEmail = user.email ? user.email.split('@')[0] : '';
        const displayName = user.displayName || nameFromEmail || 'User';
        const formattedName = displayName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        setUserName(formattedName);
        setProfileImage(user.photoURL);
      } 
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      const db = getDatabase();
      const userRef = dbRef(db, `users/${auth.currentUser.uid}`);
      
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        setUserData(data);
        console.log('User Data:', data);
      });
    }
  }, [auth.currentUser]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const user = auth.currentUser;
      if (!user) return;

      const imageRef = storageRef(storage, `profileImages/${user.uid}`);
      await uploadBytes(imageRef, blob);
      
      const downloadURL = await getDownloadURL(imageRef);
      await updateProfile(user, { photoURL: downloadURL });
      
      setProfileImage(downloadURL);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.replace('./index');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileIcon}>
              <Icon name="user" size={40} color="#0066FF" />
              <View style={styles.addImageIcon}>
                <Icon name="plus-circle" size={24} color="#58cc02" />
              </View>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {userData?.learnedWords ? Object.keys(userData.learnedWords).length : 0}
          </Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>7</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      <View style={styles.statsSection}>
        <TouchableOpacity 
          style={styles.dropdownHeader}
          onPress={() => setIsLearnedWordsOpen(!isLearnedWordsOpen)}
        >
          <Text style={styles.sectionTitle}>Learned Words</Text>
          <Icon 
            name={isLearnedWordsOpen ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
        
        {isLearnedWordsOpen && (
          <View style={styles.wordsContainer}>
            {userData?.learnedWords ? (
              Object.entries(userData.learnedWords)
                .sort(([,a], [,b]) => new Date(b.learnedAt).getTime() - new Date(a.learnedAt).getTime())
                .map(([key, word], index) => (
                  <View key={key} style={styles.wordCard}>
                    <View style={styles.wordHeader}>
                      <Text style={styles.frenchWord}>{word.french}</Text>
                      <Text style={styles.sectionBadge}>{word.section}</Text>
                    </View>
                    <Text style={styles.englishWord}>{word.english}</Text>
                    {word.context && (
                      <Text style={styles.contextText}>{word.context}</Text>
                    )}
                    <Text style={styles.learnedDate}>
                      Learned: {new Date(word.learnedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))
            ) : (
              <Text style={styles.noWordsText}>
                Complete quizzes to start building your vocabulary!
              </Text>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.settingsButton}>
        <Icon name="settings" size={24} color="#666666" />
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Icon name="log-out" size={24} color="#FF3B30" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {userData?.quizResults && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          
          <View style={styles.quizStats}>
            <Text style={styles.quizStatLabel}>Level: <Text style={styles.quizStatValue}>{userData.quizResults.finalLevel}</Text></Text>
            <Text style={styles.quizStatLabel}>Total Score: <Text style={styles.quizStatValue}>{userData.quizResults.totalScore}/15</Text></Text>
            <Text style={styles.quizStatLabel}>Accuracy: <Text style={styles.statHighlight}>{userData.quizResults.details.accuracy}</Text></Text>
            
            <View style={styles.sectionDivider} />
            
            <Text style={styles.quizStatLabel}>Section Scores:</Text>
            <Text style={styles.statDetail}>Beginner: {userData.quizResults.scores.beginner}/5</Text>
            <Text style={styles.statDetail}>Intermediate: {userData.quizResults.scores.intermediate}/5</Text>
            <Text style={styles.statDetail}>Advanced: {userData.quizResults.scores.hard}/5</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(78, 13, 22, 0.14)',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 50,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  profileIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  addImageIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 22,
  },
  settingsText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
  },
  signOutText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#FF3B30',
  },
  statsSection: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quizStats: {
    gap: 8,
  },
  quizStatLabel: {
    color: '#BBBBBB',
    fontSize: 16,
  },
  quizStatValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statHighlight: {
    color: '#58cc02',
    fontWeight: 'bold',
  },
  statDetail: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#2d3748',
    marginVertical: 8,
  },
  noQuizText: {
    color: '#BBBBBB',
    fontStyle: 'italic',
  },
  wordsContainer: {
    gap: 12,
    marginTop: 12,
  },
  wordCard: {
    backgroundColor: '#2d3748',
    borderRadius: 8,
    padding: 12,
  },
  frenchWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#58cc02',
    marginBottom: 4,
  },
  englishWord: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  learnedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionBadge: {
    backgroundColor: '#58cc02',
    color: '#FFFFFF',
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  contextText: {
    color: '#9ca3af',
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 4,
  },
  noWordsText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 16,
  },
});

export default ProfileScreen;