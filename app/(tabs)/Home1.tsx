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
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, get, update } from 'firebase/database';
import SpeechPractice from '../../components/SpeechPractice';
import AIConversation from '../../components/AIConversation';

const { width } = Dimensions.get('window');

type ValidRoute = 
  | '/(tabs)/Home' 
  | '/(tabs)/q2' 
  | '/(tabs)/q3';

interface Lesson {
  id: string;
  title: string;
  type: 'speaking' | 'ai' | 'regular' | 'checkpoint';
  image: any;
  isCompleted: boolean;
  isLocked: boolean;
  route?: ValidRoute;
  speechPractice?: boolean;
}

interface Chapter {
  id: string;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lessons: Lesson[];
}

const Home1Screen = () => {
  const router = useRouter();
  const [progress] = useState(new Animated.Value(0));
  const [overallProgress, setOverallProgress] = useState(1);
  const [unlockedLessons, setUnlockedLessons] = useState(['1', '2']); // Initially first two lessons unlocked
  const [showSpeechPractice, setShowSpeechPractice] = useState(false);
  const [showAIConversation, setShowAIConversation] = useState(false);
  const [username, setUsername] = useState('');
  const [chapterData, setChapterData] = useState<Chapter>({
    id: '1',
    title: 'Chapter 1',
    progress: 1/6,
    totalLessons: 6,
    completedLessons: 1,
    lessons: [
      {
        id: '1',
        title: 'Learn the Basics',
        type: 'regular',
        image: require('../../assets/images/FLE web.jpg'),
        isCompleted: true,
        isLocked: false,
        route: '/(tabs)/Home' as const
      },
      {
        id: '2',
        title: 'First Quiz',
        type: 'speaking',
        image: require('../../assets/images/qn.jpg'),
        isCompleted: false,
        isLocked: false, // Initially unlocked
        route: '/(tabs)/Home' as const,
        speechPractice: true
      },
      {
        id: '3',
        title: 'French Conversation',
        type: 'ai',
        image: require('../../assets/images/speaklrn.png'),
        isCompleted: false,
        isLocked: false, // Changed to false for testing
        // No route needed as it opens the AIConversation modal
      },
      // Add more lessons
    ],
  });
  
  // Add useEffect to check quiz completion status and fetch user data
  useEffect(() => {
    const checkQuizStatus = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getDatabase();
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        // Get username if available
        if (userData?.profile?.name) {
          setUsername(userData.profile.name);
        } else {
          // Use email or display name as fallback
          setUsername(user.displayName || user.email?.split('@')[0] || 'Student');
        }

        // Check if lessons are completed
        const updatedLessons = [...chapterData.lessons];
        let completedCount = 1; // First lesson is already completed
        let unlocked = ['1', '2']; // First two lessons are initially unlocked
        
        if (userData?.quizResponses?.q1?.completed) {
          // If q1 is completed, mark it as completed and unlock the next lesson
          updatedLessons[1].isCompleted = true;
          updatedLessons[2].isLocked = false;
          unlocked.push('3');
          completedCount++;
        }
        
        if (userData?.lessons?.['3']?.completed) {
          // If lesson 3 is completed, mark it as completed
          updatedLessons[2].isCompleted = true;
          completedCount++;
        }
        
        // Update state
        setUnlockedLessons(unlocked);
        setOverallProgress(completedCount);
        setChapterData(prev => ({
          ...prev,
          completedLessons: completedCount,
          progress: completedCount / prev.totalLessons,
          lessons: updatedLessons
        }));
      }
    };

    checkQuizStatus();
  }, []);

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
    // Update the chapter data
    const updatedLessons = chapterData.lessons.map(lesson => {
      if (lesson.type === 'ai' && lesson.id === '3') {
        return { ...lesson, isCompleted: true };
      }
      return lesson;
    });
    
    const completedCount = updatedLessons.filter(lesson => lesson.isCompleted).length;
    
    setChapterData(prev => ({
      ...prev,
      completedLessons: completedCount,
      progress: completedCount / prev.totalLessons,
      lessons: updatedLessons
    }));
    
    setOverallProgress(completedCount);
    
    // Update Firebase to record completion
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}/lessons/3`);
      update(userRef, { completed: true });
    }
  };

  const handleLessonPress = (lesson: Lesson) => {
    // For AI lessons, allow clicking even if locked (for testing)
    if (lesson.type === 'ai') {
      console.log('Opening AI conversation...');
      setShowAIConversation(true);
      return;
    }
    
    // For other lessons, check if locked
    if (lesson.isLocked || !lesson.route) return;
    
    if (lesson.speechPractice) {
      setShowSpeechPractice(true);
    } else {
      // Use replace for "Learn the Basics" lesson
      if (lesson.title === 'Learn the Basics') {
        router.replace(lesson.route as any);
      } else {
        router.push(lesson.route as any);
      }
    }
  };

  const renderLesson = (lesson: Lesson, index: number) => {
    console.log(`Rendering lesson ${lesson.id}: ${lesson.title}, type: ${lesson.type}, isLocked: ${lesson.isLocked}`);
    return (
      <View key={lesson.id} style={styles.lessonContainer}>
        <View style={styles.lessonLine} />
        <TouchableOpacity
          style={[
            styles.lessonButton,
            lesson.isCompleted && styles.lessonCompleted,
            lesson.isLocked && styles.lessonLocked,
          ]}
          onPress={() => {
            console.log(`Lesson ${lesson.id} pressed: ${lesson.title}, type: ${lesson.type}`);
            handleLessonPress(lesson);
          }}
          disabled={lesson.type !== 'ai' && lesson.isLocked} // Only disable non-AI lessons if locked
        >
          <Image source={lesson.image} style={styles.lessonImage} />
          {lesson.isCompleted && (
            <View style={styles.checkmark}>
              <Feather name="check" size={16} color="#fff" />
            </View>
          )}
          {lesson.isLocked && (
            <View style={styles.lock}>
              <Feather name="lock" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.lessonDetails}>
          {lesson.type === 'speaking' && (
            <View style={styles.lessonTypeBadge}>
              <Feather name="mic" size={12} color="#fff" />
              <Text style={styles.lessonTypeBadgeText}>SPEAKING PRACTICE</Text>
            </View>
          )}
          {lesson.type === 'ai' && (
            <View style={[styles.lessonTypeBadge, styles.aiBadge]}>
              <Feather name="message-circle" size={12} color="#fff" />
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
      
      {/* Test button for AI Conversation */}
      <TouchableOpacity 
        style={styles.testButton}
        onPress={() => {
          console.log('Test button pressed, opening AI conversation...');
          setShowAIConversation(true);
        }}
      >
        <Text style={styles.testButtonText}>Test AI Conversation with {username || 'Student'}</Text>
      </TouchableOpacity>
      
      <Animated.View style={[
        styles.progressBar,
        {
          width: progress.interpolate({
            inputRange: [0, chapterData.totalLessons],
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
        <Text style={styles.chapterTitle}>{chapterData.title}</Text>
        <Text style={styles.chapterProgress}>
          {chapterData.completedLessons}/{chapterData.totalLessons} lessons completed
        </Text>
      </View>

      <View style={styles.lessonsContainer}>
        {chapterData.lessons.map((lesson, index) => renderLesson(lesson, index))}
        
        <View style={styles.checkpointContainer}>
          <View style={styles.checkpointIcon}>
            <Feather name="award" size={24} color="#FFD700" />
          </View>
          <View style={styles.checkpointContent}>
            <Text style={styles.checkpointTitle}>Checkpoint</Text>
            <Text style={styles.checkpointSubtitle}>
              Test your skills to get access to the next chapter
            </Text>
          </View>
        </View>
      </View>

      <SpeechPractice 
        visible={showSpeechPractice}
        onClose={() => setShowSpeechPractice(false)}
      />
      
      <AIConversation
        visible={showAIConversation}
        onClose={() => setShowAIConversation(false)}
        onComplete={handleLessonComplete}
        username={username}
      />
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
  testButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default Home1Screen;