import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import TabNavigator from './TabNavigator';
import { NavigationContainer } from '@react-navigation/native';



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

const HomeScreen: React.FC = () => {
  const [expandedCards, setExpandedCards] = useState({
    leaderboards: false,
    quests: false,
    profile: false,
  });


  const toggleCard = (card: keyof typeof expandedCards) => {
    setExpandedCards(prev => ({
      ...prev,
      [card]: !prev[card],
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="arrow-left" size={24} color="#fff" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.sectionTitle}></Text>
            <Text style={styles.lessonTitle}>Form basic sentences</Text>
          </View>
          <View style={styles.statsContainer}>
            <Icon name="flag" size={20} color="#fff" />
            <Text style={styles.statsText}>0</Text>
            <Icon name="diamond" size={20} color="#fff" />
            <Text style={styles.statsText}>500</Text>
            <Icon name="heart" size={20} color="#fff" />
            <Text style={styles.statsText}>5</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Learning Path */}
          <View style={styles.learningPath}>
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => {
                router.replace('/Crossword');
              }}
            >
              <Text style={styles.startButtonText}>START</Text>
            </TouchableOpacity>

            <View style={styles.pathNode}>
              <Icon name="star" size={32} color="#58cc02" />
            </View>
            <View style={styles.pathLine} />

            <View style={styles.pathNode}>
              <Icon name="star-outline" size={32} color="#666" />
              <View style={styles.lockIconContainer}>
                <Icon name="lock" size={16} color="#fff" />
              </View>
            </View>
            <View style={styles.pathLine} />

            <View style={styles.pathNode}>
              <Icon name="star-outline" size={32} color="#666" />
              <View style={styles.lockIconContainer}>
                <Icon name="lock" size={16} color="#fff" />
              </View>
            </View>
            <View style={styles.pathLine} />

            <View style={styles.pathNode}>
              <Icon name="treasure-chest" size={32} color="#666" />
              <View style={styles.lockIconContainer}>
                <Icon name="lock" size={16} color="#fff" />
              </View>
            </View>
            <View style={styles.pathLine} />

            <View style={styles.pathNode}>
              <Icon name="trophy" size={32} color="#666" />
              <View style={styles.lockIconContainer}>
                <Icon name="lock" size={16} color="#fff" />
              </View>
            </View>
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
});
<TabNavigator />

export default HomeScreen;