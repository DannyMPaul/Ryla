import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import TranslatorFooter from '../../components/TranslatorFooter';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function TabsLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
      />
      {/* {isLoggedIn && <TranslatorFooter />} */}
    </View>
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
