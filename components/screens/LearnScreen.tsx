import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useRouter } from 'expo-router';

const LearnScreen = () => {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Learn</Text>
      <View style={styles.lessonList}>
        {['Videos', 'Games', 'Food', 'Travel', 'Learn with AI'].map((lesson, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.lessonItem} 
            onPress={lesson === 'Learn with AI' ? () => router.replace('/(tabs)/Learnwithai') : undefined}
          >
            <TouchableOpacity 
            key={index} 
            style={styles.lessonItem} 
            onPress={lesson === 'Learn with AI' ? () => router.replace('/(tabs)/Learnwithai') : undefined}
          >
            
          </TouchableOpacity>
            <Icon name="book-open" size={24} color="#0066FF" />
            <Text style={styles.lessonText}>{lesson}</Text>
            <Icon name="chevron-right" size={24} color="#666666" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  lessonList: {
    gap: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 8,
  },
  lessonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
});

export default LearnScreen;