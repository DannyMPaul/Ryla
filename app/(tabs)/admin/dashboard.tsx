import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../../firebase/firebase';
import { ref, onValue } from 'firebase/database';

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

const UserManagementSection = ({ users }: { users: Record<string, User> }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.sectionTitle}>User Management</Text>
        <Text style={styles.userCount}>{Object.keys(users).length} Users</Text>
      </TouchableOpacity>

      {isExpanded && Object.entries(users).map(([userId, user]) => (
        <View key={userId} style={styles.userCard}>
          <Text style={styles.userName}>{user.name || 'Anonymous'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userStats}>
            <Text style={styles.statLabel}>Level: </Text>
            <Text style={[
              styles.statValue,
              { 
                color: user.quiz_results?.details?.userLevel === 'beginner' ? '#FF6B6B' :
                       user.quiz_results?.details?.userLevel === 'intermediate' ? '#4ECDC4' : '#95E1D3'
              }
            ]}>
              {user.quiz_results?.details?.userLevel || 'Not taken'}
            </Text>
          </View>
          <View style={styles.userStats}>
            <Text style={styles.statLabel}>Accuracy: </Text>
            <Text style={styles.statValue}>
              {user.quiz_results?.details?.accuracy || 'N/A'}
            </Text>
          </View>
          <View style={styles.userStats}>
            <Text style={styles.statLabel}>Questions Completed: </Text>
            <Text style={styles.statValue}>
              {user.quiz_results?.details?.correctAnswers || 0}/
              {user.quiz_results?.details?.totalQuestions || 0}
            </Text>
          </View>
          <Text style={styles.userDate}>
            Joined: {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </View>
  );
};

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const router = useRouter();

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

    // Fetch users
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(data);
      }
    });
  }, []);

  const handleAddQuiz = () => {
    router.push('/(tabs)/admin/edit-quiz');
  };

  const handleEditQuiz = (quizId: string) => {
    router.push({ pathname: '/(tabs)/admin/edit-quiz', params: { id: quizId } });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      {/* Quiz Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiz Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddQuiz}>
          <Text style={styles.buttonText}>Add New Quiz</Text>
        </TouchableOpacity>
        
        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.quizItem}
              onPress={() => handleEditQuiz(item.id)}
            >
              <Text style={styles.quizTitle}>{item.title}</Text>
              <Text style={styles.quizInfo}>{item.questions} questions</Text>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      </View>

      {/* User Management Section */}
      <UserManagementSection users={users} />
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
});

export default AdminDashboard; 