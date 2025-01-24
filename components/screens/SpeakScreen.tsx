// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import Icon from 'react-native-vector-icons/Feather';

// const SpeakScreen = () => {
//   const [isRecording, setIsRecording] = useState(false);

//   const toggleRecording = () => {
//     setIsRecording(!isRecording);
//     // Here you would typically start/stop actual recording
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Speak</Text>
//       <View style={styles.promptContainer}>
//         <Text style={styles.prompt}>Repeat after me:</Text>
//         <Text style={styles.sentence}>"Hello, how are you?"</Text>
//       </View>
//       <TouchableOpacity style={[styles.recordButton, { backgroundColor: isRecording ? '#FF0000' : '#0066FF' }]} onPress={toggleRecording}>
//         <Icon name={isRecording ? 'square' : 'mic'} size={32} color="#FFFFFF" />
//       </TouchableOpacity>
//       <Text style={styles.instructions}>
//         {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
//       </Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     padding: 16,
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 32,
//   },
//   promptContainer: {
//     alignItems: 'center',
//     marginBottom: 48,
//   },
//   prompt: {
//     fontSize: 18,
//     marginBottom: 8,
//   },
//   sentence: {
//     fontSize: 24,
//     fontWeight: 'bold',
//   },
//   recordButton: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#0066FF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   instructions: {
//     fontSize: 16,
//     color: '#666666',
//   },
// });

// export default SpeakScreen;

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Video, ResizeMode } from 'expo-av';

const SpeakScreen = () => {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Here you would typically start/stop actual recording
  };


  
  return (
    <View style={styles.container}>
      <Video
        source={require('@/assets/videos/bg4.mp4')}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.STRETCH}
        shouldPlay
        isLooping
        isMuted
      />
      <Text style={styles.title}>Speak</Text>
      <View style={styles.promptContainer}>
        <Text style={styles.prompt}>Repeat after me:</Text>
        <Text style={styles.sentence}>"Hello, how are you?"</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.recordButton,
          { backgroundColor: isRecording ? 'rgb(168, 74, 240)' : 'rgb(240, 74, 99)' },
        ]}
        onPress={toggleRecording}
      >
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
    backgroundColor: '#121212', // Dark background
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF', // Light text
    margin:42,
    marginBottom: 32,
  },
  promptContainer: {
    marginTop:85,
    alignItems: 'center',
    marginBottom: 48,
  },
  prompt: {
    fontSize: 18,
    color: '#BBBBBB', // Subtle light text
    marginBottom: 8,
  },
  sentence: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF', // Bright text for sentence
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000000', // Add shadow for a glowing effect
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
  instructions: {
    fontSize: 16,
    color: '#BBBBBB', // Subtle instructions color
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});

export default SpeakScreen;
