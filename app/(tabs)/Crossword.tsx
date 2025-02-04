import React, { useState, useEffect } from 'react';
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
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';

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
    direction: 'across',
    question: 'Quelle est ta couleur préférée ?',
    answer: 'BLEUE',
    length: 5,
    startX: 0,
    startY: 0,
  },
  {
    number: 2,
    direction: 'down',
    question: 'Où habites-tu ?',
    answer: 'PARIS',
    length: 5,
    startX: 0,
    startY: 0,
  },
  {
    number: 3,
    direction: 'across',
    question: 'Quelle heure est-il ?',
    answer: 'TROIS',
    length: 5,
    startX: 2,
    startY: 2,
  },
  {
    number: 4,
    direction: 'down',
    question: 'Quel est ton plat préféré ?',
    answer: 'RATATOUILLE',
    length: 11,
    startX: 4,
    startY: 1,
  },
  {
    number: 5,
    direction: 'across',
    question: "Comment s'appelle ton meilleur ami ?",
    answer: 'PIERRE',
    length: 6,
    startX: 0,
    startY: 4,
  },
  {
    number: 6,
    direction: 'down',
    question: "Parles-tu d'autres langues ?",
    answer: 'ANGLAIS',
    length: 7,
    startX: 6,
    startY: 2,
  },
  {
    number: 7,
    direction: 'across',
    question: 'Aimes-tu les animaux ?',
    answer: 'CHIENS',
    length: 6,
    startX: 3,
    startY: 6,
  },
  {
    number: 8,
    direction: 'down',
    question: 'Quels sont tes loisirs ?',
    answer: 'MUSIQUE',
    length: 7,
    startX: 8,
    startY: 3,
  }
];

const CrosswordScreen = () => {
  const [selectedClue, setSelectedClue] = useState<ClueType | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [completedPuzzles, setCompletedPuzzles] = useState<string[]>([]);

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const db = getDatabase();
      const progressRef = ref(db, `users/${user.uid}/crosswordProgress`);
      
      try {
        const snapshot = await get(progressRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setAnswers(data.answers || {});
          setCompletedPuzzles(data.completedPuzzles || []);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    }
  };

  const saveProgress = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const db = getDatabase();
      const progressRef = ref(db, `users/${user.uid}/crosswordProgress`);
      
      try {
        await set(progressRef, {
          answers,
          completedPuzzles,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  const handleSquarePress = (x: number, y: number) => {
    const clue = clues.find(c => c.startX === x && c.startY === y);
    if (clue) {
      setSelectedClue(clue);
      setShowModal(true);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (selectedClue) {
      const newAnswers = {
        ...answers,
        [`${selectedClue.number}-${selectedClue.direction}`]: answer.toUpperCase(),
      };
      setAnswers(newAnswers);
      setShowModal(false);
      
      // Check if puzzle is complete
      const isComplete = checkPuzzleComplete(newAnswers);
      if (isComplete) {
        const puzzleId = new Date().toISOString();
        setCompletedPuzzles([...completedPuzzles, puzzleId]);
      }
      
      await saveProgress();
    }
  };

  const checkPuzzleComplete = (currentAnswers: { [key: string]: string }) => {
    return clues.every(clue => 
      currentAnswers[`${clue.number}-${clue.direction}`]?.toUpperCase() === clue.answer
    );
  };

  const handleNewGame = () => {
    setAnswers({});
    setShowSolution(false);
    setSelectedClue(null);
    setShowModal(false);
  };

  const handleShowSolution = () => {
    const solutionAnswers: { [key: string]: string } = {};
    clues.forEach(clue => {
      solutionAnswers[`${clue.number}-${clue.direction}`] = clue.answer;
    });
    setAnswers(solutionAnswers);
    setShowSolution(true);
  };

  const renderGrid = () => {
    const grid = [];
    for (let i = 0; i < 12; i++) {
      const row = [];
      for (let j = 0; j < 12; j++) {
        const isStartingSquare = clues.some(c => c.startX === j && c.startY === i);
        const clue = clues.find(c => c.startX === j && c.startY === i);
        const isPartOfWord = clues.some(c => {
          if (c.direction === 'across') {
            return i === c.startY && j >= c.startX && j < c.startX + c.length;
          } else {
            return j === c.startX && i >= c.startY && i < c.startY + c.length;
          }
        });
        
        row.push(
          <TouchableOpacity
            key={`${i}-${j}`}
            style={[
              styles.square,
              isStartingSquare ? styles.startingSquare : null,
              !isPartOfWord ? styles.blackSquare : null,
            ]}
            onPress={() => isPartOfWord ? handleSquarePress(j, i) : null}
            disabled={!isPartOfWord}
          >
            {isStartingSquare && (
              <Text style={styles.squareNumber}>{clue?.number}</Text>
            )}
            {answers[`${clue?.number}-${clue?.direction}`] && isStartingSquare && (
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

  const renderCluesAndAnswers = () => (
    <View style={styles.cluesContainer}>
      <View style={styles.clueColumn}>
        <Text style={styles.clueColumnTitle}>Across</Text>
        {clues
          .filter(clue => clue.direction === 'across')
          .map(clue => (
            <View key={`across-${clue.number}`} style={styles.clueItem}>
              <Text style={styles.clueNumber}>{clue.number}.</Text>
              <Text style={styles.clueText}>{clue.question}</Text>
              {showSolution && (
                <Text style={styles.solutionText}>{clue.answer}</Text>
              )}
            </View>
          ))}
      </View>

      <View style={styles.clueColumn}>
        <Text style={styles.clueColumnTitle}>Down</Text>
        {clues
          .filter(clue => clue.direction === 'down')
          .map(clue => (
            <View key={`down-${clue.number}`} style={styles.clueItem}>
              <Text style={styles.clueNumber}>{clue.number}.</Text>
              <Text style={styles.clueText}>{clue.question}</Text>
              {showSolution && (
                <Text style={styles.solutionText}>{clue.answer}</Text>
              )}
            </View>
          ))}
      </View>
    </View>
  );

  const renderCompletedPuzzles = () => (
    <View style={styles.completedContainer}>
      <Text style={styles.completedTitle}>Completed Puzzles</Text>
      {completedPuzzles.map((puzzleId, index) => (
        <Text key={puzzleId} style={styles.completedText}>
          Puzzle {index + 1} - {new Date(puzzleId).toLocaleDateString()}
        </Text>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/back.jpg')}
        style={styles.background}
      >
        <View style={styles.content}>
          <Text style={styles.title}>French Crossword Puzzle</Text>
          
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Click on a number in the grid to begin.{'\n'}
              Type your answer, and then move on to the next numbered square.{'\n'}
              Double click a number to toggle between clues for across and down.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.newGameButton}
            onPress={handleNewGame}
          >
            <Icon name="refresh-cw" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>New game</Text>
          </TouchableOpacity>

          <View style={styles.gridContainer}>{renderGrid()}</View>

          {renderCluesAndAnswers()}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShowSolution}
            >
              <Icon name="eye" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Show solution</Text>
            </TouchableOpacity>
          </View>

          {completedPuzzles.length > 0 && renderCompletedPuzzles()}
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
    width: 28,
    height: 28,
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
    fontSize: 16,
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
  blackSquare: {
    backgroundColor: '#000000',
  },
  clueList: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
  },
  clueText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  clueSection: {
    marginBottom: 16,
  },
  clueSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  completedContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  completedText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
  },
  solutionText: {
    fontSize: 14,
    color: '#58cc02',
    fontWeight: 'bold',
  },
  cluesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    marginTop: 20,
  },
  clueColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  clueColumnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  clueItem: {
    marginBottom: 12,
  },
  clueNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
});

export default CrosswordScreen;