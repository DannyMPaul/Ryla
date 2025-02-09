import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Alert 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { database } from '../../firebase/firebase';
import { ref, set, get, push } from 'firebase/database';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

const EditQuiz = () => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  useEffect(() => {
    if (id) {
      loadQuiz();
    }
  }, [id]);

  const loadQuiz = async () => {
    const quizRef = ref(database, `quizzes/${id}`);
    const snapshot = await get(quizRef);
    const data = snapshot.val();
    if (data) {
      setTitle(data.title);
      setQuestions(Object.values(data.questions || {}));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a quiz title');
      return;
    }

    const quizRef = ref(database, `quizzes/${id || push(ref(database, 'quizzes')).key}`);
    await set(quizRef, {
      title,
      questions: questions.reduce((acc, q) => ({ ...acc, [q.id]: q }), {}),
    });

    router.back();
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        text: '',
        options: ['', '', '', ''],
        correctAnswer: '',
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{id ? 'Edit Quiz' : 'New Quiz'}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Quiz Title"
        value={title}
        onChangeText={setTitle}
      />

      {questions.map((question, index) => (
        <View key={question.id} style={styles.questionContainer}>
          <Text style={styles.questionTitle}>Question {index + 1}</Text>
          <TextInput
            style={styles.input}
            placeholder="Question Text"
            value={question.text}
            onChangeText={(text) => {
              const newQuestions = [...questions];
              newQuestions[index].text = text;
              setQuestions(newQuestions);
            }}
          />

          {question.options.map((option, optIndex) => (
            <TextInput
              key={optIndex}
              style={styles.input}
              placeholder={`Option ${optIndex + 1}`}
              value={option}
              onChangeText={(text) => {
                const newQuestions = [...questions];
                newQuestions[index].options[optIndex] = text;
                setQuestions(newQuestions);
              }}
            />
          ))}

          <TextInput
            style={styles.input}
            placeholder="Correct Answer"
            value={question.correctAnswer}
            onChangeText={(text) => {
              const newQuestions = [...questions];
              newQuestions[index].correctAnswer = text;
              setQuestions(newQuestions);
            }}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
        <Text style={styles.buttonText}>Add Question</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Quiz</Text>
      </TouchableOpacity>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  questionContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#58cc02',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#F0657A',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default EditQuiz; 