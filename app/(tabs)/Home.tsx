import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import TabNavigator from './TabNavigator';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, update, get } from 'firebase/database';



const { width } = Dimensions.get('window');

interface CardProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const ExpandableCard: React.FC<CardProps> = ({ title, isExpanded, onToggle, children }) => {
  const animatedHeight = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onToggle} style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Icon 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color="#fff" 
        />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.cardContent,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500],
            }),
            opacity: animatedHeight,
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

// Add this interface for type safety
interface UserProgress {
  quizResponses: {
    q1?: {
      completed: boolean;
      completedAt: string;
      attempts: number;
      failed?: boolean;
    };
    q2?: {
      completed: boolean;
      completedAt: string;
      attempts: number;
      failed?: boolean;
    };
    star2q1?: {
      completed: boolean;
      completedAt: string;
      attempts: number;
      failed?: boolean;
    };
    star2q2?: {
      completed: boolean;
      completedAt: string;
      attempts: number;
      failed?: boolean;
    };
  };
  quizResults?: {
    finalLevel: string;
    details?: {
      accuracy: string;
    };
  };
  unlockedStars: number;
  lastCompletedStar: number;
  currentLesson: number;
  currentQuestion: number;
  totalCorrect: number;
  hearts: number;
  name?: string;
}

const HomeScreen: React.FC = () => {
  const [userData, setUserData] = useState<UserProgress | null>(null);
  const [expandedCards, setExpandedCards] = useState({
    leaderboards: false,
    quests: false,
    profile: false,
  });
  const [unlockedStars, setUnlockedStars] = useState<number>(1);
  const [lastCompletedStar, setLastCompletedStar] = useState<number>(0);
  const [completedQuestions, setCompletedQuestions] = useState<{[key: string]: boolean}>({});
  const starScale = useRef(new Animated.Value(1)).current;
  const starOpacity = useRef(new Animated.Value(1)).current;
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const unlockScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      
      // Load initial state
      const loadUserProgress = async () => {
        const snapshot = await get(userRef);
        const data = snapshot.val();
        if (data) {
          setUserData(data);
          const completed = {
            q1: data.quizResponses?.q1?.completed || false,
            q2: data.quizResponses?.q2?.completed || false,
            star2q1: data.quizResponses?.star2q1?.completed || false,
            star2q2: data.quizResponses?.star2q2?.completed || false,
          };
          setCompletedQuestions(completed);
          setUnlockedStars(data.unlockedStars || 1);
          setLastCompletedStar(data.lastCompletedStar || 0);
        }
      };
      
      loadUserProgress();
      
      // Listen for real-time updates
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setUserData(data);
          const completed = {
            q1: data.quizResponses?.q1?.completed || false,
            q2: data.quizResponses?.q2?.completed || false,
            star2q1: data.quizResponses?.star2q1?.completed || false,
            star2q2: data.quizResponses?.star2q2?.completed || false,
          };
          setCompletedQuestions(completed);
          
          const previousUnlockedStars = unlockedStars;
          const newUnlockedStars = data.unlockedStars || 1;
          setUnlockedStars(newUnlockedStars);
          setLastCompletedStar(data.lastCompletedStar || 0);
          
          if (newUnlockedStars > previousUnlockedStars) {
            setTimeout(animateStarUnlock, 500);
          }
        }
      });

      // Check if new star was just unlocked
      if (user) {
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data?.unlockedStars > data?.lastViewedStar) {
            setShowUnlockAnimation(true);
            Animated.sequence([
              Animated.timing(unlockScale, {
                toValue: 1.2,
                duration: 300,
                useNativeDriver: true
              }),
              Animated.timing(unlockScale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
              })
            ]).start();
            
            // Update lastViewedStar
            update(userRef, {
              lastViewedStar: data.unlockedStars
            });
          }
        });
      }

      return () => unsubscribe();
    }
  }, []);

  const getMotivationalQuote = (level: string) => {
    const quotes = {
      Beginner: "Every expert was once a beginner. Let's start your journey!",
      Intermediate: "You're making great progress! Keep pushing forward!",
      Advanced: "Impressive skills! You're well on your way to mastery!"
    };
    return quotes[level as keyof typeof quotes] || quotes.Beginner;
  };

  const toggleCard = (card: keyof typeof expandedCards) => {
    setExpandedCards(prev => ({
      ...prev,
      [card]: !prev[card],
    }));
  };

  const animateStarUnlock = () => {
    Animated.sequence([
      Animated.timing(starOpacity, {
        toValue: 0.3,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(starScale, {
          toValue: 1.5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(starOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(starScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Update the renderPathNode to show proper progress
  const renderPathNode = (level: number, icon: string, onPress: () => void) => {
    const isUnlocked = level <= unlockedStars;
    const isCompleted = level === 1 ? 
      (completedQuestions.q1 && completedQuestions.q2) : 
      level === 2 ? 
      (completedQuestions.star2q1 && completedQuestions.star2q2) : 
      false;
    const isNextToUnlock = level === unlockedStars + 1;
    
    // Determine which route to navigate to based on progress
    const handlePress = () => {
      if (!isUnlocked) return;
      
      switch(level) {
        case 1:
          if (!completedQuestions.q1) router.replace('./q1');
          else if (!completedQuestions.q2) router.replace('./q2');
          break;
        case 2:
          if (!completedQuestions.star2q1) router.replace('./star2q1');
          else if (!completedQuestions.star2q2) router.replace('./star2q2');
          break;
        default:
          onPress();
      }
    };
    
    return (
      <TouchableOpacity 
        onPress={handlePress}
        disabled={!isUnlocked}
      >
        <Animated.View
          style={[
            styles.pathNode,
            isCompleted && styles.completedNode,
            isNextToUnlock && {
              transform: [{ scale: starScale }],
              opacity: starOpacity,
            },
          ]}
        >
          <Icon 
            name={isCompleted ? "star" : icon} 
            size={32} 
            color={isCompleted ? "#58cc02" : isUnlocked ? "#58cc02" : "#666"} 
          />
          {!isUnlocked && (
            <View style={styles.lockIconContainer}>
              <Icon name="lock" size={16} color="#fff" />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Quiz Results */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>
              Welcome, {userData?.name || 'Learner'}!
            </Text>
            {userData?.quizResults && (
              <View style={styles.quizResultsContainer}>
                <Text style={styles.levelText}>
                  Level: {userData.quizResults.finalLevel}
                </Text>
                <Text style={styles.accuracyText}>
                  Accuracy: {userData.quizResults.details?.accuracy || '0%'}
                </Text>
                <Text style={styles.motivationalText}>
                  {getMotivationalQuote(userData.quizResults.finalLevel)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Learning Path */}
          <View style={styles.learningPath}>
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => router.replace('./q1')}
            >
              <Text style={styles.startButtonText}>START</Text>
            </TouchableOpacity>

            {renderPathNode(1, "star", () => router.replace('./q1'))}
            <View style={styles.pathLine} />
            
            <Animated.View style={[
              styles.star,
              showUnlockAnimation && { transform: [{ scale: unlockScale }] }
            ]}>
              <TouchableOpacity 
                onPress={() => router.replace('./star2q1')}
                disabled={!userData?.unlockedStars || userData.unlockedStars < 2}
              >
                <Icon 
                  name="star" 
                  size={40} 
                  color={userData?.unlockedStars >= 2 ? "#FFD700" : "#666666"}
                />
              </TouchableOpacity>
            </Animated.View>
            <View style={styles.pathLine} />
            
            {renderPathNode(3, "star", () => router.replace('./q3'))}
            <View style={styles.pathLine} />
            
            {renderPathNode(4, "treasure-chest", () => router.replace('./bonus'))}
            <View style={styles.pathLine} />
            
            {renderPathNode(5, "trophy", () => router.replace('./final'))}
          </View>

          {/* Expandable Cards */}
          <View style={styles.cardsContainer}>
            <ExpandableCard
              title="Unlock Leaderboards!"
              isExpanded={expandedCards.leaderboards}
              onToggle={() => toggleCard('leaderboards')}
            >
              <Text style={styles.cardText}>
                Complete 10 more lessons to start competing
              </Text>
            </ExpandableCard>

            <ExpandableCard
              title="Daily Quests"
              isExpanded={expandedCards.quests}
              onToggle={() => toggleCard('quests')}
            >
              <View style={styles.questItem}>
                <Icon name="lightning-bolt" size={24} color="#ffd700" />
                <View style={styles.questContent}>
                  <Text style={styles.questText}>Earn 10 XP</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '0%' }]} />
                  </View>
                </View>
                <Text style={styles.questProgress}>0/10</Text>
              </View>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>VIEW ALL</Text>
              </TouchableOpacity>
            </ExpandableCard>

            {/* <ExpandableCard
              title="Create a profile to save your progress!"
              isExpanded={expandedCards.profile}
              onToggle={() => toggleCard('profile')}
            >
              <TouchableOpacity style={styles.createProfileButton}>
                <Text style={styles.buttonText}>CREATE A PROFILE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signInButton}>
                <Text style={styles.buttonText}>SIGN IN</Text>
              </TouchableOpacity>
            </ExpandableCard> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111b21',
  },
  header: {
    backgroundColor: '#F0657A',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lessonTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  learningPath: {
    alignItems: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#F0657A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pathNode: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2b3940',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pathLine: {
    width: 4,
    height: 40,
    backgroundColor: '#2b3940',
  },
  lockIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 4,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: {
    color: '#F0657A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardContent: {
    overflow: 'hidden',
  },
  cardText: {
    color: '#9ca3af',
    padding: 16,
    paddingTop: 0,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  questContent: {
    flex: 1,
  },
  questText: {
    color: '#fff',
    marginBottom: 4,
  },
  questProgress: {
    color: '#9ca3af',
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2b3940',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'pink',
    borderRadius: 4,
  },
  viewAllButton: {
    padding: 16,
    paddingTop: 0,
  },
  viewAllText: {
    color: '#1cb0f6',
    fontWeight: 'bold',
  },
  createProfileButton: {
    backgroundColor: '#F0657A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
  },
  signInButton: {
    backgroundColor: '#1cb0f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quizResultsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  levelText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  accuracyText: {
    color: '#58cc02',
    fontSize: 16,
    marginTop: 4,
  },
  motivationalText: {
    color: '#fff',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    opacity: 0.9,
  },
  unlockedNode: {
    backgroundColor: '#1f2937',
  },
  nodeContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedNode: {
    borderColor: '#58cc02',
    borderWidth: 2,
  },
  star: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2b3940',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
<TabNavigator />

export default HomeScreen;