import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../../firebase/firebase';
import { ref, onValue } from 'firebase/database';

interface Quiz {
  id: string;
  title: string;
  questions: number;
}

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const router = useRouter();

  useEffect(() => {
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
  }, []);

  const handleAddQuiz = () => {
    router.push('/(tabs)/admin/edit-quiz');
  };

  const handleEditQuiz = (quizId: string) => {
    router.push({ pathname: '/(tabs)/admin/edit-quiz', params: { id: quizId } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quiz Management</Text>
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
      />
    </View>
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
});

export default AdminDashboard; 