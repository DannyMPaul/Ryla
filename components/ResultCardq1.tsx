// components/ResultCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useRouter } from 'expo-router';

interface ResultCardProps {
  correctAnswers: number;
  totalQuestions: number;
  onRestart: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ correctAnswers, totalQuestions, onRestart }) => {
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/(tabs)/Home' as const);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quiz Completed!</Text>
      <Text style={styles.subtitle}>Your Results</Text>

      <View style={styles.resultContainer}>
        <Text style={styles.resultText}>
          {correctAnswers} / {totalQuestions} Correct
        </Text>
        <Text style={styles.percentageText}>
          {((correctAnswers / totalQuestions) * 100).toFixed(0)}%
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onRestart}>
          <Icon name="refresh-cw" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Restart</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleGoBack}>
          <Icon name="home" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(15, 0, 25)',
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#A56EFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  percentageText: {
    color: '#58cc02',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(127, 17, 224, 0.64)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ResultCard;