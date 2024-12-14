import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface ClueType {
  number: number;
  direction: 'across' | 'down';
  question: string;
  answer: string;
  length: number;
  startX: number;
  startY: number;
}

const clues: ClueType[] = [
  {
    number: 1,
    direction: 'down',
    question: 'Hindu festival of lights',
    answer: 'DIWALI',
    length: 6,
    startX: 0,
    startY: 0,
  },
  // Add more clues here
];

const CrosswordScreen = () => {
  const [selectedClue, setSelectedClue] = useState<ClueType | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showModal, setShowModal] = useState(false);

  const handleSquarePress = (x: number, y: number) => {
    const clue = clues.find(c => c.startX === x && c.startY === y);
    if (clue) {
      setSelectedClue(clue);
      setShowModal(true);
    }
  };

  const handleAnswer = (answer: string) => {
    if (selectedClue) {
      setAnswers({
        ...answers,
        [`${selectedClue.number}-${selectedClue.direction}`]: answer.toUpperCase(),
      });
      setShowModal(false);
    }
  };

  const renderGrid = () => {
    const grid = [];
    for (let i = 0; i < 10; i++) {
      const row = [];
      for (let j = 0; j < 10; j++) {
        const isStartingSquare = clues.some(c => c.startX === j && c.startY === i);
        const clue = clues.find(c => c.startX === j && c.startY === i);
        
        row.push(
          <TouchableOpacity
            key={`${i}-${j}`}
            style={[
              styles.square,
              isStartingSquare ? styles.startingSquare : null,
            ]}
            onPress={() => handleSquarePress(j, i)}
          >
            {isStartingSquare && (
              <Text style={styles.squareNumber}>{clue?.number}</Text>
            )}
            {answers[`${clue?.number}-${clue?.direction}`]?.[0] && (
              <Text style={styles.answerText}>
                {answers[`${clue?.number}-${clue?.direction}`][0]}
              </Text>
            )}
          </TouchableOpacity>
        );
      }
      grid.push(
        <View key={i} style={styles.row}>
          {row}
        </View>
      );
    }
    return grid;
  };

  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/back.jpg')}
        style={styles.background}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Crossword Puzzle</Text>
          
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Click on a number in the grid to begin.{'\n'}
              Type your answer, and then move on to the next numbered square.{'\n'}
              Double click a number to toggle between clues for across and down.
            </Text>
          </View>

          <TouchableOpacity style={styles.newGameButton}>
            <Icon name="refresh-cw" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>New game</Text>
          </TouchableOpacity>

          <View style={styles.gridContainer}>{renderGrid()}</View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="eye" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Show solution</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="rotate-ccw" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedClue?.number} {selectedClue?.direction.toUpperCase()}
            </Text>
            <Text style={styles.modalQuestion}>{selectedClue?.question}</Text>
            <Text style={styles.modalLength}>({selectedClue?.length} letters)</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter answer"
              placeholderTextColor="#666"
              autoCapitalize="characters"
              maxLength={selectedClue?.length}
              onSubmitEditing={(e) => handleAnswer(e.nativeEvent.text)}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#58cc02',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  gridContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startingSquare: {
    backgroundColor: '#F0F0F0',
  },
  squareNumber: {
    position: 'absolute',
    top: 2,
    left: 2,
    fontSize: 10,
    color: '#000000',
  },
  answerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1cb0f6',
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalQuestion: {
    fontSize: 16,
    marginBottom: 4,
  },
  modalLength: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CrosswordScreen;