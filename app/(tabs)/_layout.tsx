import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Custom Header Component
const CustomHeader = () => {
  return (
    <View style={styles.header}>
      <Text style={styles.logoText}>
        Ry
        <Text style={styles.Lang}>Lang</Text>
      </Text>
    </View>
  );
};

// Layout with Tabs
export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerTitle: () => <CustomHeader />,
        headerStyle: {
          opacity: 1,
          backgroundColor: 'black',
          borderWidth: 3,
          borderBottomColor: 'purple',
          shadowColor: '#F0657A',
          shadowOffset: { width: 1, height: 2 },
          shadowOpacity: 0.8,
          shadowRadius: 1,
        },
        headerTintColor: 'white',
        tabBarStyle: {
          backgroundColor: '#111b21',
          borderTopColor: '#2b3940',
          borderTopWidth: 1,
          height: 60,
        },
        tabBarActiveTintColor: '#58cc02',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      {/* Define Tab Screens */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Icon name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          tabBarLabel: 'Quiz',
          tabBarIcon: ({ color }) => <Icon name="check-circle" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="proficiency"
        options={{
          tabBarLabel: 'Proficiency',
          tabBarIcon: ({ color }) => <Icon name="bar-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Icon name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F0657A',
  },
  Lang: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
