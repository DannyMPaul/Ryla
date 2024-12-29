import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#0066FF',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* Auth and onboarding screens - hidden */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarStyle: { display: 'none' },
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="qn1"
        options={{
          tabBarStyle: { display: 'none' },
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="qn2"
        options={{
          tabBarStyle: { display: 'none' },
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="Spanish"
        options={{
          tabBarStyle: { display: 'none' },
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="Welcome"
        options={{
          tabBarStyle: { display: 'none' },
          tabBarItemStyle: { display: 'none' },
        }}
      />

      {/* Main Tab Navigation */}
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="globe" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Learn"
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="users" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Speak"
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="message-circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Review"
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="trending-up" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Me"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.profileIcon, focused && styles.profileIconActive]}>
              <Icon name="user" size={24} color={focused ? '#0066FF' : '#666666'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Learnwithaifood"
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#111b21',
    height: Platform.OS === 'ios' ? 85 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2b3940',
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  profileIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconActive: {
    borderWidth: 2,
    borderColor: '#0066FF',
  },
});
