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

interface ProficiencyLevel {
  id: string;
  title: string;
  level: number;
}

const proficiencyLevels: ProficiencyLevel[] = [
  {
    id: '1',
    title: "I'm new to German",
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
      {[1, 2, 3, 4].map((bar) => (
        <View
          key={bar}
          style={[
            styles.progressBar,
            { backgroundColor: bar <= level ? '#4B94D8' : '#1f2937' },
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
            How much German do you know?
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
          // Handle continue
        }}
      >
        <Text style={styles.continueButtonText}>CONTINUE</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111b21',
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  mascot: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  questionBubble: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  optionButton: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedOption: {
    backgroundColor: '#2a3a4a',
    borderColor: '#4B94D8',
    borderWidth: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  progressBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  continueButton: {
    backgroundColor: '#58cc02',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#2a3a4a',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LanguageProficiencyScreen;