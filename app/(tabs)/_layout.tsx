// _layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
// import { Colors } from '@/constants/Colors';  // Adjust imports as per your structure

// Custom Header Component with "MetaSucks"
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

// Layout that uses CustomHeader and wraps the tab screens
export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerTitle: () => <CustomHeader />,
        headerStyle: {
          opacity:1,
          backgroundColor: 'black',
          borderWidth: 3,
          borderBottomColor: 'purple',
          shadowColor: '#F0657A',
          shadowOffset: {
            width: 1,
            height: 2,
          },
          shadowOpacity: 0.8,
          shadowRadius: 1,
        },
        headerTintColor: 'white', // White text color
        tabBarStyle: { display: 'none' }, // Hides the tab bar (optional)
      }}
    >
      {}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'rgba(0,0,0,0)',
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
