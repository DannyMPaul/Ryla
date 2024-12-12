import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../hooks/types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeScreen'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#58cc02" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.sectionTitle}>SECTION 1, UNIT 1</Text>
            <Text style={styles.lessonTitle}>Form basic sentences</Text>
          </View>
          <TouchableOpacity style={styles.guideButton}>
            <Icon name="book-open-variant" size={20} color="#fff" />
            <Text style={styles.guideButtonText}>GUIDEBOOK</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressContainer}>
          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startText}>START</Text>
          </TouchableOpacity>

          {/* Progress Path */}
          <View style={styles.pathContainer}>
            <View style={styles.node}>
              <Icon name="star" size={32} color="#58cc02" />
            </View>
            <View style={styles.pathLine} />
            <View style={styles.node}>
              <Icon name="star-outline" size={32} color="#666" />
            </View>
            <View style={styles.pathLine} />
            <View style={styles.node}>
              <Icon name="star-outline" size={32} color="#666" />
            </View>
          </View>

          {/* Mascot */}
          {/* <View style={styles.mascotContainer}>
            <Image
              source={require('../assets/images/splash.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
          </View> */}

          {/* Additional Nodes */}
          <View style={styles.node}>
            <Icon name="treasure-chest" size={32} color="#666" />
          </View>
          <View style={styles.pathLine} />
          <View style={styles.node}>
            <Icon name="trophy" size={32} color="#666" />
          </View>
        </View>
      </ScrollView>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Icon name="flag" size={24} color="#ff4b4b" />
          <Text style={styles.statText}>0</Text>
        </View>
        <View style={styles.stat}>
          <Icon name="diamond" size={24} color="#1cb0f6" />
          <Text style={styles.statText}>500</Text>
        </View>
        <View style={styles.stat}>
          <Icon name="heart" size={24} color="#ff4b4b" />
          <Text style={styles.statText}>5</Text>
        </View>
      </View>

      {/* Right Panel */}
      <View style={styles.rightPanel}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Unlock Leaderboards!</Text>
          <Text style={styles.cardSubtitle}>
            Complete 10 more lessons to start competing
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Daily Quests</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>
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
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Create a profile to save your progress!
          </Text>
          <TouchableOpacity style={styles.createProfileButton}>
            <Text style={styles.buttonText}>CREATE A PROFILE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signInButton}>
            <Text style={styles.buttonText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111b21',
  },
  header: {
    backgroundColor: '#58cc02',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: 16,
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
    marginTop: 4,
  },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#45a700',
    padding: 8,
    borderRadius: 8,
  },
  guideButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 24,
  },
  progressContainer: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#58cc02',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  startText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pathContainer: {
    alignItems: 'center',
  },
  node: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2b3940',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  pathLine: {
    width: 4,
    height: 40,
    backgroundColor: '#2b3940',
  },
  mascotContainer: {
    position: 'absolute',
    right: -100,
    top: '50%',
  },
  mascot: {
    width: 80,
    height: 80,
  },
  statsBar: {
    position: 'absolute',
    top: 0,
    right: 16,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rightPanel: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: width * 0.3,
    maxWidth: 300,
    gap: 16,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
  },
  viewAllText: {
    color: '#1cb0f6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#58cc02',
    borderRadius: 4,
  },
  createProfileButton: {
    backgroundColor: '#58cc02',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  signInButton: {
    backgroundColor: '#1cb0f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;