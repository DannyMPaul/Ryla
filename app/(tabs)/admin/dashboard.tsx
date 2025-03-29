import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { database, auth } from '../../firebase/firebase';
import { ref, onValue, get } from 'firebase/database';
import { signOut } from 'firebase/auth';

interface Quiz {
  id: string;
  title: string;
  questions: number;
}

interface User {
  name: string;
  email: string;
  quiz_results?: {
    details?: {
      userLevel?: string;
      accuracy?: string;
      totalQuestions?: number;
      correctAnswers?: number;
    }
  };
  createdAt: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
}

const UserManagementSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch users data
    const usersRef = ref(database, 'users');
    console.log('Fetching users data...');

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Raw users data:', data);
      
      if (data) {
        setUsers(data);
      } else {
        console.log('No users found');
        setUsers({});
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.sectionTitle}>User Management</Text>
        <Text style={styles.userCount}>
          {isLoading ? 'Loading...' : `${Object.keys(users).length} Users`}
        </Text>
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F04A63" />
        </View>
      ) : isExpanded ? (
        Object.entries(users).length > 0 ? (
          Object.entries(users).map(([userId, user]) => (
            <View key={userId} style={styles.userCard}>
              <Text style={styles.userName}>{user.name || 'Anonymous'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              
              {/* Quiz Results Section */}
              {user.quiz_results?.details && (
                <View style={styles.statsContainer}>
                  <Text style={styles.statsTitle}>Quiz Results</Text>
                  <View style={styles.userStats}>
                    <Text style={styles.statLabel}>Level:</Text>
                    <Text style={[
                      styles.statValue,
                      { 
                        color: user.quiz_results.details.userLevel === 'beginner' ? '#FF6B6B' :
                               user.quiz_results.details.userLevel === 'intermediate' ? '#4ECDC4' : '#95E1D3'
                      }
                    ]}>
                      {user.quiz_results.details.userLevel || 'Not taken'}
                    </Text>
                  </View>
                  <View style={styles.userStats}>
                    <Text style={styles.statLabel}>Accuracy:</Text>
                    <Text style={styles.statValue}>
                      {user.quiz_results.details.accuracy || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.userStats}>
                    <Text style={styles.statLabel}>Questions Completed:</Text>
                    <Text style={styles.statValue}>
                      {user.quiz_results.details.correctAnswers || 0}/
                      {user.quiz_results.details.totalQuestions || 0}
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.userDate}>
                Joined: {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noUsersText}>No users found</Text>
        )
      ) : null}
    </View>
  );
};

const VideoManagementSection = ({ videos }: { videos: Record<string, Video> }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const handleAddVideo = () => {
    router.push('/(tabs)/admin/add-video');
  };

  return (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.sectionTitle}>Video Management</Text>
        <Text style={styles.videoCount}>{Object.keys(videos).length} Videos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.addButton} onPress={handleAddVideo}>
        <Text style={styles.buttonText}>Add New Video</Text>
      </TouchableOpacity>

      {isExpanded && Object.entries(videos).map(([videoId, video]) => (
        <View key={videoId} style={styles.videoCard}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.videoDescription}>{video.description}</Text>
          <Text style={styles.videoUrl}>URL: {video.url}</Text>
        </View>
      ))}
    </View>
  );
};

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [videos, setVideos] = useState<Record<string, Video>>({});
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(tabs)'); // Navigate back to main tabs after logout
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  useEffect(() => {
    // Fetch quizzes
    const quizzesRef = ref(database, 'quizzes');
    onValue(quizzesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const quizList = Object.entries(data).map(([id, quiz]: [string, any]) => ({
          id,
          title: quiz.title,
          questions: Object.keys(quiz.questions || {}).length,
        }));
        setQuizzes(quizList);
      }
    });

    // Fetch videos
    const videosRef = ref(database, 'videos');
    onValue(videosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVideos(data);
      }
    });
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* User Management Section */}
      <UserManagementSection />

      {/* Quiz Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiz Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(tabs)/admin/edit-quiz')}>
          <Text style={styles.buttonText}>Add New Quiz</Text>
        </TouchableOpacity>
        
        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.quizItem}
              onPress={() => router.push({ 
                pathname: '/(tabs)/admin/edit-quiz',
                params: { id: item.id }
              })}
            >
              <Text style={styles.quizTitle}>{item.title}</Text>
              <Text style={styles.quizInfo}>{item.questions} questions</Text>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      </View>

      {/* Video Management Section */}
      <VideoManagementSection videos={videos} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#58cc02',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  quizItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizInfo: {
    color: '#666',
    marginTop: 5,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    color: '#666',
    marginBottom: 10,
  },
  userStats: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  statLabel: {
    color: '#666',
    flex: 1,
  },
  statValue: {
    fontWeight: '500',
    flex: 1,
  },
  userDate: {
    color: '#999',
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  userCount: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  videoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  videoDescription: {
    color: '#666',
    marginBottom: 10,
  },
  videoUrl: {
    color: '#666',
  },
  videoCount: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  noUsersText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
});

export default AdminDashboard; 