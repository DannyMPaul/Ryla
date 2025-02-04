// components/MatchPair1.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MatchItem {
  id: string;
  text: string;
  matched?: boolean;
}

interface MatchPair1Props {
  onComplete: () => void;
}

const MatchPair1: React.FC<MatchPair1Props> = ({ onComplete }) => {
  const [leftItems, setLeftItems] = useState<MatchItem[]>([
    { id: '1', text: 'le chat' }, // cat
    { id: '2', text: 'l\'oiseau' }, // bird
    { id: '3', text: 'le chien' }, // dog
    { id: '4', text: 'la pomme' }, // apple
  ]);

  const [rightItems, setRightItems] = useState<MatchItem[]>([
    { id: 'a', text: 'Bird' },
    { id: 'b', text: 'Cat' },
    { id: 'c', text: 'Dog' },
    { id: 'd', text: 'Apple' },
  ]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const animateScale = useRef(new Animated.Value(1)).current;

  const handleLeftPress = (id: string) => {
    setSelectedLeft(id);
    if (selectedRight) checkMatch(id, selectedRight);
  };

  const handleRightPress = (id: string) => {
    setSelectedRight(id);
    if (selectedLeft) checkMatch(selectedLeft, id);
  };

  const checkMatch = (leftId: string, rightId: string) => {
    const leftItem = leftItems.find((item) => item.id === leftId);
    const rightItem = rightItems.find((item) => item.id === rightId);

    if (leftItem && rightItem) {
      const isMatch =
        (leftItem.text === 'le chat' && rightItem.text === 'Cat') ||
        (leftItem.text === 'l\'oiseau' && rightItem.text === 'Bird') ||
        (leftItem.text === 'le chien' && rightItem.text === 'Dog') ||
        (leftItem.text === 'la pomme' && rightItem.text === 'Apple');

      if (isMatch) {
        animateSuccess();
        leftItem.matched = true;
        rightItem.matched = true;
        if (leftItems.every(item => item.matched) && rightItems.every(item => item.matched)) {
          onComplete();
        }
      } else {
        animateError();
      }
    }

    setSelectedLeft(null);
    setSelectedRight(null);
  };

  const animateSuccess = () => {
    Animated.sequence([
      Animated.timing(animateScale, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animateScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateError = () => {
    Animated.sequence([
      Animated.timing(animateScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animateScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animateScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Match the Following</Text>
      <View style={styles.columnsContainer}>
        {/* Left Column */}
        <View style={styles.column}>
          {leftItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.leftItem,
                selectedLeft === item.id && styles.selectedItem,
                item.matched && styles.matchedItem,
              ]}
              onPress={() => handleLeftPress(item.id)}
              disabled={item.matched}
            >
              <Text style={styles.itemText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Right Column */}
        <View style={styles.column}>
          {rightItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.rightItem,
                selectedRight === item.id && styles.selectedItem,
                item.matched && styles.matchedItem,
              ]}
              onPress={() => handleRightPress(item.id)}
              disabled={item.matched}
            >
              <Text style={styles.itemText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Animation Container */}
      <Animated.View
        style={[
          styles.animationContainer,
          { transform: [{ scale: animateScale }] },
        ]}
      >
        <Icon name="check-circle" size={50} color="#58cc02" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(15, 0, 25)',
    padding: 6,
  },
  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '47%',
  },
  leftItem: {
    backgroundColor: 'rgba(97, 46, 145, 0.67)', // Grey color for left column
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 32,
    alignItems: 'center',
  },
  rightItem: {
    backgroundColor: 'rgba(48, 17, 224, 0.64)', // Blue color for right column
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 32,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#F0657A',
  },
  matchedItem: {
    backgroundColor: '#58cc02',
  },
  itemText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  animationContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
});

export default MatchPair1;