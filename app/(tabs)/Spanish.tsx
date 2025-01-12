import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { router } from 'expo-router';

interface ProficiencyLevel {
  id: string;
  title: string;
  level: number;
}

const proficiencyLevels: ProficiencyLevel[] = [
  {
    id: '1',
    title: "I'm new to French",
    level: 1,
  },
  {
    id: '2',
    title: 'I know some common words',
    level: 2,
  },
  {
    id: '3',
    title: 'I can have basic conversations',
    level: 3,
  },
  {
    id: '4',
    title: 'I can talk about various topics',
    level: 4,
  },
  {
    id: '5',
    title: 'I can discuss most topics in detail',
    level: 5,
  },
];

const ProgressBars = ({ level }: { level: number }) => {
  return (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4,5].map((bar) => (
        <View
          key={bar}
          style={[
            styles.progressBar,
            { backgroundColor: bar <= level ? 'rgb(240, 74, 99)' : 'rgba(240, 74, 99, 0.18)' },
          ]}
        />
      ))}
    </View>
  );
};

const LanguageProficiencyScreen = () => {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/Gif/lightgif.gif')}
          style={styles.mascot}
        />
        <View style={styles.questionBubble}>
          <Text style={styles.questionText}>
            How much French do you know?
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {proficiencyLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.optionButton,
              selectedLevel === level.id && styles.selectedOption,
            ]}
            onPress={() => setSelectedLevel(level.id)}
          >
            <ProgressBars level={level.level} />
            <Text style={styles.optionText}>{level.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedLevel && styles.continueButtonDisabled,
        ]}
        disabled={!selectedLevel}
        onPress={() => {
          router.replace('/quiz');
        }}
      >
        <Text style={styles.continueButtonText}>Let's quickly check your level!</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(78, 13, 22, 0.14)',
  },
  header: {
    marginTop:50,
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  mascot: {
    width: 80,
    height: 100,
    resizeMode: 'cover',
    borderRadius: 30,

  },
  questionBubble: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 19,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  optionButton: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 28,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedOption: {
    backgroundColor: '#2a3a4a',
    borderColor: 'rgba(240, 74, 99, 0.78)',
    borderWidth: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  progressBar: {
    width: 5,
    height: 16,
    borderRadius: 5,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  continueButton: {
    backgroundColor: 'rgb(240, 74, 99)',
    margin: 20,
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.59)',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LanguageProficiencyScreen;