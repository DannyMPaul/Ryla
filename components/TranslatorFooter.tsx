import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform, AppState, AppStateStatus } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';

// LibreTranslate API URL - update this to your computer's IP address when testing on physical devices
// For emulators, localhost or 10.0.2.2 (Android) should work
// For physical devices, use your computer's IP address (e.g., 192.168.1.X)
// Uncomment the appropriate line for your environment:

// const LIBRE_TRANSLATE_API_URL = 'http://10.0.2.2:5000'; // For Android emulator
const LIBRE_TRANSLATE_API_URL = 'http://127.0.0.1:5000'; // For iOS simulator
// const LIBRE_TRANSLATE_API_URL = 'http://192.168.1.36:5000'; // For physical devices

const TranslatorFooter = () => {
  const router = useRouter();
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  // Check server availability when the component mounts and when the app comes to the foreground
  useEffect(() => {
    checkServerAvailability();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      checkServerAvailability();
    }
    setAppState(nextAppState);
  };

  const checkServerAvailability = async () => {
    try {
      const response = await axios.get(`${LIBRE_TRANSLATE_API_URL}/languages`, { timeout: 10000 });
      setIsServerAvailable(response.status === 200);
    } catch (error) {
      console.log('Translation server not available:', error);
      setIsServerAvailable(false);
    }
  };

  const navigateToTranslator = () => {
    router.push('/(tabs)/voice-translator');
  };

  return (
    <View style={styles.footer}>
      <TouchableOpacity 
        style={[styles.translatorButton, isServerAvailable ? styles.serverAvailable : styles.serverUnavailable]}
        onPress={navigateToTranslator}
        activeOpacity={0.7}
      >
        <Feather name="mic" size={24} color="#fff" />
        <Text style={styles.buttonText}>
          {isServerAvailable ? 'Translator' : 'Translator (Offline)'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  translatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  serverAvailable: {
    backgroundColor: '#3b82f6',
  },
  serverUnavailable: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default TranslatorFooter; 