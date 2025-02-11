import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';

interface TargetUse {
  prompt: string;
  weight: number;
}

interface LanguageSettings {
  [key: string]: {
    [key: string]: TargetUse;
  };
}

const defaultTargetUses: LanguageSettings = {
  fr: {
    grammar_correction: { prompt: "Corriger la grammaire: ", weight: 1.0 },
    text_coherent: { prompt: "Rendre ce texte plus cohérent: ", weight: 0.8 },
    easier_understanding: { prompt: "Simplifier ce texte: ", weight: 0.6 },
    paraphrasing: { prompt: "Paraphraser ce texte: ", weight: 0.7 },
    formal_tone: { prompt: "Rendre le texte plus formel: ", weight: 0.9 },
    neutral_tone: { prompt: "Convertir le texte en ton neutre: ", weight: 0.8 }
  },
  en: {
    grammar_correction: { prompt: "Correct the grammar: ", weight: 1.0 },
    text_coherent: { prompt: "Make this text more coherent: ", weight: 0.8 },
    easier_understanding: { prompt: "Simplify this text: ", weight: 0.6 },
    paraphrasing: { prompt: "Paraphrase this text: ", weight: 0.7 },
    formal_tone: { prompt: "Make the text more formal: ", weight: 0.9 },
    neutral_tone: { prompt: "Convert text to a neutral tone: ", weight: 0.8 }
  }
};

const ModelSettingsScreen = () => {
  const [modelData, setModelData] = useState<LanguageSettings>(defaultTargetUses);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'fr'>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserModelData();
  }, []);

  const loadUserModelData = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const dbRef = ref(getDatabase(), `users/${user.uid}/modelData`);
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        setModelData(snapshot.val());
      } else {
        // Initialize with default settings if none exist
        await saveModelData(defaultTargetUses);
        setModelData(defaultTargetUses);
      }
    } catch (error) {
      console.error('Error loading model data:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveModelData = async (data: LanguageSettings) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const dbRef = ref(getDatabase(), `users/${user.uid}/modelData`);
      await set(dbRef, data);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving model data:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const updateWeight = (useCase: string, newWeight: number) => {
    const updatedData = { ...modelData };
    updatedData[selectedLanguage][useCase].weight = newWeight;
    setModelData(updatedData);
    saveModelData(updatedData);
  };

  const toggleLanguage = () => {
    setSelectedLanguage(prev => prev === 'en' ? 'fr' : 'en');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Model Settings</Text>
        <TouchableOpacity 
          style={styles.languageToggle}
          onPress={toggleLanguage}
        >
          <Text style={styles.languageText}>
            {selectedLanguage.toUpperCase()}
          </Text>
          <Feather name="globe" size={24} color="#58cc02" />
        </TouchableOpacity>
      </View>

      {Object.entries(modelData[selectedLanguage]).map(([useCase, settings]) => (
        <View key={useCase} style={styles.settingCard}>
          <Text style={styles.settingTitle}>
            {useCase.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </Text>
          <Text style={styles.promptText}>{settings.prompt}</Text>
          <View style={styles.weightContainer}>
            <Text style={styles.weightLabel}>Weight: {settings.weight}</Text>
            <View style={styles.weightSlider}>
              {[0.2, 0.4, 0.6, 0.8, 1.0].map(weight => (
                <TouchableOpacity
                  key={weight}
                  style={[
                    styles.weightButton,
                    settings.weight === weight && styles.weightButtonActive
                  ]}
                  onPress={() => updateWeight(useCase, weight)}
                >
                  <Text style={styles.weightButtonText}>{weight}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  languageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#58cc02',
  },
  settingCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  weightContainer: {
    gap: 8,
  },
  weightLabel: {
    fontSize: 16,
    color: '#333',
  },
  weightSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  weightButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  weightButtonActive: {
    backgroundColor: '#58cc02',
  },
  weightButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

export default ModelSettingsScreen; 