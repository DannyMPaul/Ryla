import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

interface ConversationItem {
  id: string;
  icon: string;
  title: string;
  image: any;
  subtitle: string;
  level: string;
}

const conversationItems: ConversationItem[] = [
  {
    id: '1',
    icon: '👋',
    title: 'Introduce yourself',
    image: require('../../assets/images/back.jpg'),
    subtitle: 'Giving your name',
    level: 'A1 Beginner',
  },
  {
    id: '2',
    icon: '💼',
    title: 'Talk about your job',
    image: require('../../assets/images/firefighter.jpg'),
    subtitle: 'Talking about your job',
    level: 'A1 Beginner',
  },
  {
    id: '3',
    icon: '🍽️',
    title: 'Order food',
    image: require('../../assets/images/food.jpeg'),
    subtitle: 'Ordering food and drinks',
    level: 'A1 Beginner',
  },
  {
    id: '4',
    icon: '🍷',
    title: 'Order food',
    image: require('../../assets/images/restaurant1.jpg'),
    subtitle: 'Ordering at a restaurant',
    level: 'C1 Advanced',
  },
];

const BackButton = () => (
  <TouchableOpacity 
    style={styles.backButton}
    onPress={() => router.replace('./TabNavigator')}
    activeOpacity={0.7}
  >
    <Ionicons name="arrow-back-circle" size={42} color="#F0657A" />
  </TouchableOpacity>
);

const LearnWithAIScreen = () => {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.replace('/(tabs)');
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>AI Conversations</Text>
        
        <View style={styles.header}>
          <Feather name="message-circle" size={24} color="#666" />
          <Text style={styles.headerText}>
            Practice speaking in real-life situations at your level and get personalized feedback.
          </Text>
        </View>

        <View style={styles.freeTrialBadge}>
          <View style={styles.freeTrialDot} />
          <Text style={styles.freeTrialText}>FREE TRIES AVAILABLE</Text>
        </View>

        {conversationItems.map((item) => (
          <TouchableOpacity 
            key={item.id}
            style={styles.conversationItem}
            onPress={() => {
              if (item.id === '3') {
                // router.replace('/(tabs)/Learnwithaifood');
                router.push('/(tabs)/Learnwithaifood');

              } else {
                // Handle other navigation
              }
            }}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={styles.itemTitle}>{item.title}</Text>
            </View>

            <View style={styles.itemContent}>
              <Image source={item.image} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                <Text style={styles.itemLevel}>{item.level}</Text>
              </View>
              <Feather name="chevron-right" size={24} color="#1cb0f6" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BackButton />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#0a0a1a', // Changed from 'rgba(78, 13, 22, 0.23)' to a darker blue-black

  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF', // Light text for dark background
    marginBottom: 16,
    marginTop: 30,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
    paddingRight: 40,
  },
  headerText: {
    fontSize: 16,
    color: '#CCCCCC', // Lighter text for readability
    flex: 1,
    lineHeight: 24,
  },
  freeTrialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  freeTrialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50', // Green for visibility
  },
  freeTrialText: {
    color: '#4CAF50', // Matching green
    fontSize: 14,
    fontWeight: '600',
  },
  conversationItem: {
    marginBottom: 24,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  itemIcon: {
    fontSize: 24,
    color: '#FFD700', // Gold for emphasis
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF', // Light text
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e', // Changed from '#2C2C2C' to a darker blue
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e', // Changed from '#444444' to a darker blue
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25, // Increased shadow opacity for better contrast
    shadowRadius: 4,
    elevation: 3, // Increased elevation for better depth
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCCC', // Lighter text
    marginBottom: 4,
  },
  itemLevel: {
    fontSize: 14,
    color: '#888888', // Subtle text for level info
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darker background for better contrast
  },
});

export default LearnWithAIScreen;