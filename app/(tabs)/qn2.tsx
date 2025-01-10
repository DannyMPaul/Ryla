import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import Flag from 'react-native-flags';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref as dbRef, update } from 'firebase/database';

interface LanguageOption {
  id: string;
  flag: string;
  title: string;
}

const languages: LanguageOption[] = [
  {
    id: '1',
    flag: 'GB',
    title: 'English',
  },
  {
    id: '2',
    flag: 'DE',
    title: 'German',
  },
  {
    id: '3',
    flag: 'FR',
    title: 'French',
  },
];

type RouteType = '/(tabs)/English' | '/(tabs)/German' | '/(tabs)/Spanish';

const qn2 = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const auth = getAuth();

  const handleLanguageSelect = async (languageId: string) => {
    setSelectedLanguage(languageId);
    
    const user = auth.currentUser;
    if (user) {
      const db = getDatabase();
      const userRef = dbRef(db, `users/${user.uid}`);
      
      try {
        await update(userRef, {
          'responses/languageSelection': {
            selectedLanguage: languageId,
            languageTitle: languages.find(l => l.id === languageId)?.title,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  };

  const handleNext = async () => {
    if (!selectedLanguage) return;

    const user = auth.currentUser;
    if (user) {
      const db = getDatabase();
      const userRef = dbRef(db, `users/${user.uid}`);
      
      try {
        let nextRoute: RouteType = '/(tabs)/English';
        if (selectedLanguage === '2') nextRoute = '/(tabs)/German';
        if (selectedLanguage === '3') nextRoute = '/(tabs)/Spanish';

        await update(userRef, {
          currentStep: 'quiz',
          selectedLanguage: languages.find(l => l.id === selectedLanguage)?.title,
          lastUpdated: new Date().toISOString()
        });
        router.replace(nextRoute);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Which language do you want to learn?</Text>
        
        <View style={styles.optionsContainer}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.optionCard,
                selectedLanguage === language.id && styles.optionCardSelected,
              ]}
              onPress={() => handleLanguageSelect(language.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.flagContainer}>
                  <Flag code={language.flag} size={32} />
                </View>
                <Text style={styles.optionText}>{language.title}</Text>
              </View>
              <View style={styles.radioContainer}>
                <View style={styles.radioOuter}>
                  {selectedLanguage === language.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next Question</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Skip this question</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    backgroundColor: '#F0F0F0',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  skipButton: {
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default qn2;