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
import { getAuth } from 'firebase/auth';
import { getDatabase, ref as dbRef, update } from 'firebase/database';

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
<<<<<<< Updated upstream
            { backgroundColor: bar <= level ? 'rgb(240, 74, 99)' : 'rgba(240, 74, 99, 0.18)' },
=======
            { backgroundColor: bar <= level ? '#F0657A' : 'rgba(242, 0, 255, 0.28)' },
>>>>>>> Stashed changes
          ]}
        />
      ))}
    </View>
  );
};

const LanguageProficiencyScreen = () => {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const auth = getAuth();

  const handleLevelSelect = async (levelId: string) => {
    setSelectedLevel(levelId);
    
    const user = auth.currentUser;
    if (user) {
      const db = getDatabase();
      const userRef = dbRef(db, `users/${user.uid}`);
      
      try {
        const selectedProficiency = proficiencyLevels.find(l => l.id === levelId);
        await update(userRef, {
          'responses/proficiencyLevel': {
            selectedLevel: levelId,
            levelTitle: selectedProficiency?.title,
            levelNumber: selectedProficiency?.level,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error saving proficiency level:', error);
      }
    }
  };

  const handleContinue = async () => {
    if (!selectedLevel) return;

    const user = auth.currentUser;
    if (user) {
      const db = getDatabase();
      const userRef = dbRef(db, `users/${user.uid}`);
      
      try {
        await update(userRef, {
          currentStep: 'quiz',
          lastUpdated: new Date().toISOString(),
          'learningPath': {
            language: 'Spanish',
            startedAt: new Date().toISOString(),
            initialLevel: proficiencyLevels.find(l => l.id === selectedLevel)?.level
          }
        });
        router.replace('/quiz');
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

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
            onPress={() => handleLevelSelect(level.id)}
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
        onPress={handleContinue}
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
<<<<<<< Updated upstream
    marginTop:50,
    flexDirection: 'row',
=======
    flexDirection: 'column',
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    fontSize: 25,
=======
    fontSize: 22,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    backgroundColor: '#2a3a4a',
    borderColor: 'rgba(240, 74, 99, 0.78)',
=======
    backgroundColor: 'rgba(242, 0, 255, 0.09)',
    borderColor: '#F0657A',
>>>>>>> Stashed changes
    borderWidth: 2,
    // backgroundColor:'rgb(12, 239, 76)',

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
<<<<<<< Updated upstream
    backgroundColor: 'rgb(240, 74, 99)',
    margin: 20,
    padding: 16,
    borderRadius: 15,
=======
    backgroundColor: '#F0657A',
    margin: 20,
    padding: 16,
    borderRadius: 20,
>>>>>>> Stashed changes
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