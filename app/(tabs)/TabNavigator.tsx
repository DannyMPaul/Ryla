import React from 'react';
import { View, Text, StyleSheet, Image, Platform, BackHandler } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import TranslationBot from '../../components/TranslationBot';

// Import your screens
import LearnScreen from '../../components/screens/LearnScreen';
import CommunityScreen from '../../components/screens/CommunityScreen';
import SpeakScreen from '../../components/screens/SpeakScreen';
import DiscussionScreen from '../../components/screens/DiscussionScreen';
import ProfileScreen from '../../components/screens/ProfileScreen';
// import HoneScreen from './Home';
import HomeScreen from './Home1';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();  // Exit app when on main navigation
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#0066FF',
          tabBarInactiveTintColor: '#666666',
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="globe" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Learn"
          component={LearnScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="users" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Speak"
          component={SpeakScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="message-circle" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Discussion"
          component={DiscussionScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="message-square" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <TranslationBot />
    </View>
  );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#111b21', // Matches the primary background color
        height: Platform.OS === 'ios' ? 85 : 60,
        paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#2b3940', // Matches secondary background elements
      },
      tabBarLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#fff', // White text for contrast
      },
      profileIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
      },
      profileIconActive: {
        borderWidth: 2,
        borderColor: '#58cc02', // Highlight with the primary green color
      },
      profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
      },
    });

export default TabNavigator;