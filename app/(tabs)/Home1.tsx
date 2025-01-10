import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

interface Lesson {
  id: string;
  title: string;
  type: 'speaking' | 'ai' | 'regular' | 'checkpoint';
  image: any;
  isCompleted: boolean;
  isLocked: boolean;
}

interface Chapter {
  id: string;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lessons: Lesson[];
}

const ChapterProgressScreen = () => {
  const [progress] = useState(new Animated.Value(0));
  const [overallProgress, setOverallProgress] = useState(1);
  
  const chapter: Chapter = {
    id: '1',
    title: 'Chapter 1',
    progress: 1/6,
    totalLessons: 6,
    completedLessons: 1,
    lessons: [
      {
        id: '1',
        title: '¡Hola!',
        type: 'regular',
        image: require('../../assets/images/food.jpeg'),
        isCompleted: true,
        isLocked: false,
      },
      {
        id: '2',
        title: 'Saying your name',
        type: 'speaking',
        image: require('../../assets/images/food.jpeg'),
        isCompleted: false,
        isLocked: false,
      },
      {
        id: '3',
        title: 'Asking how someone is',
        type: 'ai',
        image: require('../../assets/images/food.jpeg'),
        isCompleted: false,
        isLocked: true,
      },
      // Add more lessons
    ],
  };

  useEffect(() => {
    animateProgress();
  }, [overallProgress]);

  const animateProgress = () => {
    Animated.timing(progress, {
      toValue: overallProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const handleLessonComplete = () => {
    setOverallProgress(prev => Math.min(prev + 1, 100));
  };

  const renderLesson = (lesson: Lesson, index: number) => {
    return (
      <View key={lesson.id} style={styles.lessonContainer}>
        <View style={styles.lessonLine} />
        <TouchableOpacity
          style={[
            styles.lessonButton,
            lesson.isCompleted && styles.lessonCompleted,
            lesson.isLocked && styles.lessonLocked,
          ]}
          onPress={handleLessonComplete}
          disabled={lesson.isLocked}
        >
          <Image source={lesson.image} style={styles.lessonImage} />
          {lesson.isCompleted && (
            <View style={styles.checkmark}>
              <Icon name="check" size={16} color="#fff" />
            </View>
          )}
          {lesson.isLocked && (
            <View style={styles.lock}>
              <Icon name="lock" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.lessonDetails}>
          {lesson.type === 'speaking' && (
            <View style={styles.lessonTypeBadge}>
              <Icon name="mic" size={12} color="#fff" />
              <Text style={styles.lessonTypeBadgeText}>SPEAKING PRACTICE</Text>
            </View>
          )}
          {lesson.type === 'ai' && (
            <View style={[styles.lessonTypeBadge, styles.aiBadge]}>
              <Icon name="message-circle" size={12} color="#fff" />
              <Text style={styles.lessonTypeBadgeText}>AI CONVERSATIONS</Text>
            </View>
          )}
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Beginner A1</Text>
      
      <Animated.View style={[
        styles.progressBar,
        {
          width: progress.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        },
      ]} />

      <TouchableOpacity style={styles.premiumBanner}>
        <View style={styles.percentBadge}>
          <Text style={styles.percentSymbol}>%</Text>
        </View>
        <View style={styles.premiumContent}>
          <Text style={styles.premiumTitle}>
            Make learning easier with 70% off Premium
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.chapterHeader}>
        <Text style={styles.chapterTitle}>{chapter.title}</Text>
        <Text style={styles.chapterProgress}>
          {chapter.completedLessons}/{chapter.totalLessons} lessons completed
        </Text>
      </View>

      <View style={styles.lessonsContainer}>
        {chapter.lessons.map((lesson, index) => renderLesson(lesson, index))}
        
        <View style={styles.checkpointContainer}>
          <View style={styles.checkpointIcon}>
            <Icon name="award" size={24} color="#FFD700" />
          </View>
          <View style={styles.checkpointContent}>
            <Text style={styles.checkpointTitle}>Checkpoint</Text>
            <Text style={styles.checkpointSubtitle}>
              Test your skills to get access to the next chapter
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#58cc02',
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  premiumBanner: {
    backgroundColor: '#FFD700',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentBadge: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  percentSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  chapterHeader: {
    padding: 16,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chapterProgress: {
    fontSize: 16,
    color: '#666',
  },
  lessonsContainer: {
    padding: 16,
  },
  lessonContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
  },
  lessonLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#E5E7EB',
    position: 'absolute',
    left: 29,
    top: 30,
  },
  lessonButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  lessonCompleted: {
    borderColor: '#58cc02',
  },
  lessonLocked: {
    borderColor: '#ccc',
    opacity: 0.7,
  },
  lessonImage: {
    width: '100%',
    height: '100%',
  },
  checkmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#58cc02',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lock: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#666',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonDetails: {
    marginLeft: 12,
    flex: 1,
  },
  lessonTypeBadge: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  aiBadge: {
    backgroundColor: '#3b82f6',
  },
  lessonTypeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkpointContainer: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkpointIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkpointContent: {
    flex: 1,
  },
  checkpointTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  checkpointSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default ChapterProgressScreen;