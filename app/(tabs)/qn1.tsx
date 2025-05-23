import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface GoalOption {
  id: string;
  icon: string;
  title: string;
}

const goals: GoalOption[] = [
    {
      id: '1',
      icon: 'briefcase',
      title: 'For work or business',
    },
    {
      id: '2',
      icon: 'globe',
      title: 'For travel or cultural exploration',
    },
    {
      id: '3',
      icon: 'edit-3',
      title: 'For studies or academic purposes',
    },
    {
      id: '4',
      icon: 'message-circle',
      title: 'For personal growth or fun',
    },
    {
      id: '5',
      icon: 'users',
      title: 'To connect with family or friends',
    },
    {
      id: '6',
      icon: 'help-circle',
      title: 'Other',
    },
  
];

const GoalSelectionScreen = () => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>What's your goal?</Text>
        
        <View style={styles.optionsContainer}>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.optionCard,
                selectedGoal === goal.id && styles.optionCardSelected,
              ]}
              onPress={() => handleGoalSelect(goal.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <Icon name={goal.icon} size={24} color="#000" />
                </View>
                <Text style={styles.optionText}>{goal.title}</Text>
              </View>
              <View style={styles.radioContainer}>
                <View style={styles.radioOuter}>
                  {selectedGoal === goal.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => {
            router.replace('/qn2');
          }}
        >
          <Text style={styles.nextButtonText}>Next Question</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'flex-start', 
    paddingTop: 30, 
  },
  scrollContent: {
    flexGrow: 1,  // This will make sure the content takes up available space
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    margin: 30,
    textAlign: 'center', 
    letterSpacing: 1.5,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: 'rgb(255, 255, 255)',
    borderRadius: 25,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    backgroundColor: 'rgb(255, 225, 225)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  

  // Button styles:
  skipButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 234, 0.76)', // Optional, you can keep or remove
    position: 'absolute',
    bottom: 80, // Position the button 80px from the bottom
    left: 20,
    right: 20,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  nextButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: 'rgb(240, 74, 99)',

    position: 'absolute',
    bottom: 20,  // Position the button 20px from the bottom
    left: 20,
    right: 20,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
    iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgb(255, 255, 255)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});

export default GoalSelectionScreen;



