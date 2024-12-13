import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const SpeakScreen = () => {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Here you would typically start/stop actual recording
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Speak</Text>
      <View style={styles.promptContainer}>
        <Text style={styles.prompt}>Repeat after me:</Text>
        <Text style={styles.sentence}>"Hello, how are you?"</Text>
      </View>
      <TouchableOpacity style={[styles.recordButton, { backgroundColor: isRecording ? '#FF0000' : '#0066FF' }]} onPress={toggleRecording}>
        <Icon name={isRecording ? 'square' : 'mic'} size={32} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.instructions}>
        {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  promptContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  prompt: {
    fontSize: 18,
    marginBottom: 8,
  },
  sentence: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructions: {
    fontSize: 16,
    color: '#666666',
  },
});

export default SpeakScreen;