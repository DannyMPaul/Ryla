import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  type: 'query' | 'reply';
  text: string;
  audio: string;
  correct?: boolean;
}

interface Scenario {
  id: string;
  heading: string;
  image: any;
  question: string;
  options: { id: string; text: string; correct: boolean; audio: string }[];
}

const scenarios: Scenario[] = [
  {
    id: "1",
    heading: "SCENARIO: You and your Friends are in a restaurant waiting to order, and the waiter comes by.",
    image: require("../../assets/images/waiter.png"),
    question: "Good evening, everyone! How may I assist you today?",
    options: [
      { id: "r1", text: "Good morning. What's the time now?", correct: false, audio: "r1" },
      { id: "r2", text: "Good evening. Could we see the menu, please?", correct: true, audio: "r2" },
      { id: "r3", text: "I don't need help.", correct: false, audio: "r3" }
    ]
  },
  {
    id: "2",
    heading: "SCENARIO: The waiter hands you the menu and is ready to take your order.",
    image: require("../../assets/images/waiter.png"),
    question: "Here's the menu. May I take your order?",
    options: [
      { id: "rr1", text: "No, thank you. The weather is nice.", correct: false, audio: "r5" },
      { id: "rr2", text: "Yes, please. I'll have a garden salad and a lemonade.", correct: true, audio: "r4" },
      { id: "rr3", text: "I want food. Eating", correct: false, audio: "r6" }
    ]
  },
  {
    id: "3",
    heading: "SCENARIO: The waiter informs you about the salad ingredients.",
    image: require("../../assets/images/waiter.png"),
    question: "The salad includes onions. Would you like them removed?",
    options: [
      { id: "rrr1", text: "Yes, that's fine. Thank you for asking.", correct: true, audio: "r7" },
      { id: "rrr2", text: "No, the chair is comfortable.", correct: false, audio: "r8" },
      { id: "rrr3", text: "Why are you asking me?", correct: false, audio: "r9" }
    ]
  },
  {
    id: "4",
    heading: "SCENARIO: The waiter asks if you need anything else.",
    image: require("../../assets/images/waiter.png"),
    question: "Is there anything else I can bring you?",
    options: [
      { id: "rrrr1", text: "I like tables.", correct: false, audio: "r12" },
      { id: "rrrr2", text: "Bring me what you want.", correct: false, audio: "r11" },
      { id: "rrrr3", text: "Could I get some extra water, please?", correct: true, audio: "r10" }
    ]
  },
  {
    id: "5",
    heading: "SCENARIO: The waiter asks if you'd like to pay the bill.",
    image: require("../../assets/images/waiter.png"),
    question: "Would you like the bill now?",
    options: [
      { id: "rrrrr1", text: "Yes, please. Thank you for your service", correct: true, audio: "r13" },
      { id: "rrrrr2", text: "No, I don't like paying money.", correct: false, audio: "r14" },
      { id: "rrrrr3", text: "Why are you looking at me?", correct: false, audio: "r15" }
    ]
  }
];

const audioFiles: Record<string, any> = {
  r1: require('../../assets/audio/r1.mp3'),
  r2: require('../../assets/audio/r2.mp3'),
  r3: require('../../assets/audio/r3.mp3'),

  r4: require('../../assets/audio/r4.mp3'),
  r5: require('../../assets/audio/r5.mp3'),
  r6: require('../../assets/audio/r6.mp3'),

  r7: require('../../assets/audio/r7.mp3'),
  r8: require('../../assets/audio/r8.mp3'),
  r9: require('../../assets/audio/r9.mp3'),

  r10: require('../../assets/audio/r10.mp3'),
  r11: require('../../assets/audio/r11.mp3'),
  r12: require('../../assets/audio/r12.mp3'),

  r13: require('../../assets/audio/r13.mp3'),
  r14: require('../../assets/audio/r14.mp3'),
  r15: require('../../assets/audio/r15.mp3'),

  q1: require('../../assets/audio/q1.mp3'),
  q2: require('../../assets/audio/q2.mp3'),
  q3: require('../../assets/audio/q3.mp3'),
  q4: require('../../assets/audio/q4.mp3'),
  q5: require('../../assets/audio/q5.mp3'),
  // Add other audio files as needed
};

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate responsive sizes
const scale = SCREEN_WIDTH / 375; // 375 is standard iPhone width
const normalize = (size: number) => Math.round(scale * size);

const ChatGame = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

  const chatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // useEffect(() => {
  //   playAudio(`q${scenarios[currentScenarioIndex].id}`);
  // }, [currentScenarioIndex]);

  useEffect(() => {
    playAudio(`q${scenarios[currentScenarioIndex].id}`);
  }, [currentScenarioIndex]);
  
  useEffect(() => {
    // Autoplay the first question's audio on component mount
    // playAudio(`q${scenarios[0].id}`);
     playAudio(`q1`);

  }, []);
  

  const playAudio = async (file: string, onFinish?: () => void) => {
    try {
      // Stop and unload the previous sound if it exists
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      }
  
      // Load the new sound
      const { sound } = await Audio.Sound.createAsync(audioFiles[file]);
      setCurrentSound(sound);
  
      // Set up playback status for when the audio finishes
      if (onFinish) {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            onFinish();
          }
        });
      }
  
      // Play the sound
      await sound.playAsync();
    } catch (error) {
      // console.error('');
    }
  };
  
  
  const handleReply = (option: { id: string; text: string; correct: boolean; audio: string }) => {
    const currentScenario = scenarios[currentScenarioIndex];
  
    setMessages((prev) => [
      ...prev,
      { id: `${currentScenario.id}-q`, type: 'query', text: currentScenario.question, audio: `q${currentScenario.id}` },
      { id: `${option.id}-r`, type: 'reply', text: option.text, audio: option.audio, correct: option.correct },
    ]);
  
    playAudio(option.audio, () => {
      if (currentScenarioIndex < scenarios.length - 1) {
        setCurrentScenarioIndex((prev) => prev + 1);
        playAudio(`q${scenarios[currentScenarioIndex + 1].id}`);
      } else {
        setShowResult(true);
      }
    });
  
    if (option.correct) {
      setScore((prev) => prev + 1);
    }
  
    chatListRef.current?.scrollToEnd({ animated: true });
  };
  

  const handleRestart = () => {
    setMessages([]);
    setCurrentScenarioIndex(0);
    setScore(0);
    setShowResult(false);
  };

  const getResultMessage = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage === 100) {
      return "Excellent! You're a natural! 🎉🥇";
    } else if (percentage >= 80) {
      return "Great job! Keep up the good work! 👏🌟";
    } else if (percentage >= 60) {
      return "Well done! Room for improvement. 👍😊";
    } else {
      return "Nice try! Let's practice more. 💪🔁";
    }
  };

  const currentScenario = scenarios[currentScenarioIndex];

  // Add orientation change handling
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      // Update dimensions when orientation changes
      const width = window.width;
      const height = window.height;
      // You can update state here if needed
    });

    return () => subscription?.remove();
  }, []);

  const BackButton = () => (
    <TouchableOpacity 
      style={styles.backButton}
      onPress={() => router.replace('./Learnwithai')}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={24} color="#F0657A" />
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <BackButton />
  
      <View style={styles.header}>
        <Text style={styles.heading}>{currentScenario.heading}</Text>
      </View>
  
      <View style={styles.imageContainer}>
        <Image source={currentScenario.image} style={styles.image} />
        <TouchableOpacity 
          style={styles.audioButton}
          onPress={() => playAudio(`q${currentScenario.id}`)}
        >
          <Ionicons name="volume-high" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
  
      <View style={styles.progressIndicator}>
        {scenarios.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentScenarioIndex
                ? styles.progressDotActive
                : styles.progressDotInactive,
            ]}
          />
        ))}
      </View>
  
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentScenario.question}</Text>
      </View>
  
      <View style={styles.optionsContainer}>
        {currentScenario.options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionButton}
            onPress={() => handleReply(option)}
          >
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
  
      <FlatList
        ref={chatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageContainer}>
            <View
              style={[
                styles.messageBubble,
                item.type === 'query' ? styles.queryBubble : styles.replyBubble,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          </View>
        )}
        style={styles.chatContainer}
      />
  
      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultScore}>
            Score: {score}/{scenarios.length}
          </Text>
          <Text style={styles.resultMessage}>
            {getResultMessage(score, scenarios.length)}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleRestart}>
            <Text style={styles.backButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )};
  
  export default function Learnwithaifood() {
    return <ChatGame />;
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1A1A1A',
      padding: normalize(16),
    },
    header: {
      marginBottom: normalize(20),
      paddingTop: normalize(40),
    },
    heading: {
      fontSize: normalize(18),
      color: '#FFFFFF',
      marginBottom: normalize(10),
      textAlign: 'center',
      paddingHorizontal: normalize(16),
      fontWeight: '600',
    },
    imageContainer: {
      width: SCREEN_WIDTH * 0.8,
      height: SCREEN_WIDTH * 0.6,
      alignSelf: 'center',
      marginBottom: normalize(20),
      borderRadius: normalize(12),
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    questionContainer: {
      backgroundColor: 'rgba(79, 198, 172, 0.15)',
      padding: normalize(16),
      borderRadius: normalize(12),
      marginBottom: normalize(20),
      borderWidth: 1,
      borderColor: 'rgba(79, 198, 172, 0.3)',
    },
    questionText: {
      fontSize: normalize(18),
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: normalize(10),
      fontWeight: '500',
    },
    optionsContainer: {
      marginTop: normalize(10),
    },
    optionButton: {
      backgroundColor: 'rgba(79, 198, 172, 0.9)',
      padding: normalize(12),
      borderRadius: normalize(25),
      marginBottom: normalize(12),
      borderBottomRightRadius: 0,
      marginLeft: normalize(20),
      width: SCREEN_WIDTH * 0.8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 3,
    },
    optionText: {
      color: '#FFFFFF',
      fontSize: normalize(16),
      textAlign: 'center',
      fontWeight: '600',
    },
    chatContainer: {
      flex: 1,
      marginTop: normalize(20),
    },
    messageContainer: {
      flexDirection: 'row',
      marginBottom: normalize(10),
      paddingHorizontal: normalize(8),
    },
    messageBubble: {
      maxWidth: SCREEN_WIDTH * 0.7,
      padding: normalize(12),
      borderRadius: normalize(20),
      marginBottom: normalize(8),
    },
    queryBubble: {
      backgroundColor: 'rgba(79, 198, 172, 0.25)',
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 0,
      borderWidth: 1,
      borderColor: 'rgba(79, 198, 172, 0.4)',
    },
    replyBubble: {
      backgroundColor: 'rgba(79, 198, 172, 0.9)',
      alignSelf: 'flex-end',
      borderBottomRightRadius: 0,
    },
    messageText: {
      fontSize: normalize(16),
      color: '#FFFFFF',
      fontWeight: '500',
    },
    resultContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1A1A1A',
      padding: normalize(20),
    },
    resultScore: {
      fontSize: normalize(32),
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: normalize(20),
    },
    resultMessage: {
      fontSize: normalize(24),
      textAlign: 'center',
      color: '#FFFFFF',
      marginBottom: normalize(30),
      paddingHorizontal: normalize(20),
      fontWeight: '500',
    },
    backButton: {
      backgroundColor: '#4EC6AC',
      width: normalize(40),
      height: normalize(40),
      borderRadius: normalize(20),
      position: 'absolute',
      top: normalize(20),
      left: normalize(20),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    backButtonText: {
      color: '#FFFFFF',
      fontSize: normalize(18),
      fontWeight: 'bold',
    },
    audioButton: {
      position: 'absolute',
      right: normalize(10),
      top: normalize(10),
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: normalize(8),
      borderRadius: normalize(20),
    },
    progressIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: normalize(20),
    },
    progressDot: {
      width: normalize(8),
      height: normalize(8),
      borderRadius: normalize(4),
      marginHorizontal: normalize(4),
    },
    progressDotActive: {
      backgroundColor: '#4EC6AC',
    },
    progressDotInactive: {
      backgroundColor: '#666666',
    },
  });
  