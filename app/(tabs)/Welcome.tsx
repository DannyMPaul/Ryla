import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const transcript = [
  "Welcome to RyLang, your gateway to mastering French and German!",
  "I'm your friendly cloud, here to guide you on this exciting journey.",
  "Together, we'll explore interactive lessons, practice speaking, and track your progress.",
  "Let's float into a world of new words, phrases, and endless opportunities.",
];

const VideoTranscriptionScreen: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<Video>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [sound, setSound] = useState<Audio.Sound>();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playFromPositionAsync(0);
    }
  }, []);

  useEffect(() => {
    const currentLineIndex = Math.floor((currentTime / duration) * transcript.length);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: currentLineIndex * 50, // Approximate height of each transcription line
        animated: true,
      });
    }
  }, [currentTime, duration]);

  useEffect(() => {
    async function loadSound() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/audio/Welcome.mp3'),
          { 
            shouldPlay: true,
            isLooping: false,
            volume: 1.0,
          }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && 'didJustFinish' in status && status.didJustFinish) {
            setShowButton(true);
          }
        });

        setSound(sound);
        await sound.playAsync();
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    }

    loadSound();
    return () => { sound?.unloadAsync(); };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={require('../../assets/videos/Cloud2.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={true}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setCurrentTime(status.positionMillis / 1000);
              setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
            }
          }}
          isLooping
          useNativeControls={false}
          isMuted={true}
          positionMillis={0}
        />
      </View>
      <ScrollView ref={scrollViewRef} style={styles.transcriptionContainer}>
        {transcript.map((line, index) => (
          <Text
            key={index}
            style={[
              styles.transcriptionText,
              Math.floor((currentTime / duration) * transcript.length) === index && styles.activeTranscription,
            ]}
          >
            {line}
          </Text>
        ))}
      </ScrollView>
      {showButton && (
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => router.replace('./TabNavigator')}
        >
          <Text style={styles.nextButtonText}>Proceed</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    width: width,
    height: width * 0.6,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 2,
    overflow: 'hidden',
  },
  video: {
    width: '300%',
    height: '450%',
    transform: [{ scale: 0.2 }],
  },
  transcriptionContainer: {
    flex: 1,
    padding: 16,
  },
  transcriptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  activeTranscription: {
    color: '#58cc02',
    fontWeight: 'bold',
  },
  nextButton: {
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default VideoTranscriptionScreen;
