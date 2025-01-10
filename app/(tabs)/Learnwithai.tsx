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
import Icon from 'react-native-vector-icons/Feather';
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
    image: require('../../assets/images/restaurant.avif'),
    subtitle: 'Ordering at a restaurant',
    level: 'C1 Advanced',
  },
];

const AIConversationsScreen = () => {
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
          <Icon name="message-circle" size={24} color="#666" />
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
                router.replace('/(tabs)/Learnwithaifood');
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
              <Icon name="chevron-right" size={24} color="#1cb0f6" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
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
    color: '#666666',
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
    backgroundColor: '#58cc02',
  },
  freeTrialText: {
    color: '#58cc02',
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
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#1f2937',
    marginBottom: 4,
  },
  itemLevel: {
    fontSize: 14,
    color: '#666666',
  },
});

export default AIConversationsScreen;