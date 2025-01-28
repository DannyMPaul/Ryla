import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import Flag from 'react-native-flags';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref as dbRef, update } from 'firebase/database';

type RouteType = '/(tabs)/English' | '/(tabs)/German' | '/(tabs)/Spanish';

interface LanguageOption {
  id: string;
  flag: string;
  title: string;
}

const languages: LanguageOption[] = [
  { id: '1', flag: 'GB', title: 'English' },
  { id: '2', flag: 'DE', title: 'German' },
  { id: '3', flag: 'FR', title: 'French' },
];

const qn2 = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const auth = getAuth();

  const handleLanguageSelect = async (languageId: string) => {
    setSelectedLanguage(languageId);
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const db = getDatabase();
      const userRef = dbRef(db, `users/${user.uid}`);

      try {
        await update(userRef, {
          'responses/languageSelection': {
            selectedLanguage: languageId,
            languageTitle: languages.find((l) => l.id === languageId)?.title,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  };

  const handleNext = async () => {
    if (!selectedLanguage) return;

    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const db = getDatabase();
      const userRef = dbRef(db, `users/${user.uid}`);

      try {
        let nextRoute = './English';
        if (selectedLanguage === '2') nextRoute = './German';
        if (selectedLanguage === '3') nextRoute = './Spanish';

        await update(userRef, {
          currentStep: 'quiz',
          selectedLanguage: languages.find((l) => l.id === selectedLanguage)?.title,
          lastUpdated: new Date().toISOString(),
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
                  {selectedLanguage === language.id && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next Question</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'flex-start',
    paddingTop: 30,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    margin: 30,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: 'rgb(255, 255, 255)',
    borderRadius: 25,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    backgroundColor: 'rgb(255, 225, 225)',
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
    fontWeight: '500',
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
  nextButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: '#F0657A',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
