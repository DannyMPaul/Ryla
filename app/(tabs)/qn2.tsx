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
import CountryFlag from "react-native-country-flag";
import { getAuth } from 'firebase/auth';
import { getDatabase, ref as dbRef, update } from 'firebase/database';

type RouteType = '/(tabs)/English' | '/(tabs)/German' | '/(tabs)/Spanish';

interface LanguageOption {
  id: string;
  flag: string;
  title: string;
}

const languages: LanguageOption[] = [
  { id: '1', flag: 'gb', title: 'English' },
  { id: '2', flag: 'de', title: 'German' },
  { id: '3', flag: 'fr', title: 'French' },
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
        let nextRoute: RouteType = '/(tabs)/English'; 
        if (selectedLanguage === '2') nextRoute = '/(tabs)/German';
        if (selectedLanguage === '3') nextRoute = '/(tabs)/Spanish';

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
                  <CountryFlag isoCode={language.flag.toLowerCase()} size={32} />
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

export default qn2;



// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Animated,
//   Dimensions,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// const { width } = Dimensions.get('window');

// interface MatchItem {
//   id: string;
//   text: string;
//   matched?: boolean;
// }

// const MatchTheFollowing: React.FC = () => {
//   const [leftItems, setLeftItems] = useState<MatchItem[]>([
//     { id: '1', text: 'Apple' },
//     { id: '2', text: 'Banana' },
//     { id: '3', text: 'Orange' },
//     { id: '4', text: 'Grapes' },
//   ]);

//   const [rightItems, setRightItems] = useState<MatchItem[]>([
//     { id: 'a', text: 'Red' },
//     { id: 'b', text: 'Yellow' },
//     { id: 'c', text: 'Orange' },
//     { id: 'd', text: 'Purple' },
//   ]);

//   const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
//   const [selectedRight, setSelectedRight] = useState<string | null>(null);

//   const animateScale = useRef(new Animated.Value(1)).current;

//   const handleLeftPress = (id: string) => {
//     setSelectedLeft(id);
//     if (selectedRight) checkMatch(id, selectedRight);
//   };

//   const handleRightPress = (id: string) => {
//     setSelectedRight(id);
//     if (selectedLeft) checkMatch(selectedLeft, id);
//   };

//   const checkMatch = (leftId: string, rightId: string) => {
//     const leftItem = leftItems.find((item) => item.id === leftId);
//     const rightItem = rightItems.find((item) => item.id === rightId);

//     if (leftItem && rightItem) {
//       const isMatch =
//         (leftItem.text === 'Apple' && rightItem.text === 'Orange') ||
//         (leftItem.text === 'Banana' && rightItem.text === 'Yellow') ||
//         (leftItem.text === 'Orange' && rightItem.text === 'Red') ||
//         (leftItem.text === 'Grapes' && rightItem.text === 'Purple');

//       if (isMatch) {
//         animateSuccess();
//         setLeftItems((prev) =>
//           prev.map((item) =>
//             item.id === leftId ? { ...item, matched: true } : item
//           )
//         );
//         setRightItems((prev) =>
//           prev.map((item) =>
//             item.id === rightId ? { ...item, matched: true } : item
//           )
//         );
//       } else {
//         animateError();
//       }
//     }

//     setSelectedLeft(null);
//     setSelectedRight(null);
//   };

//   const animateSuccess = () => {
//     Animated.sequence([
//       Animated.timing(animateScale, {
//         toValue: 1.2,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//       Animated.timing(animateScale, {
//         toValue: 1,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const animateError = () => {
//     Animated.sequence([
//       Animated.timing(animateScale, {
//         toValue: 0.9,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//       Animated.timing(animateScale, {
//         toValue: 1.1,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//       Animated.timing(animateScale, {
//         toValue: 1,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Match the Following</Text>
//       <View style={styles.columnsContainer}>
//         {/* Left Column */}
//         <View style={styles.column}>
//           {leftItems.map((item) => (
//             <TouchableOpacity
//               key={item.id}
//               style={[
//                 styles.item,
//                 selectedLeft === item.id && styles.selectedItem,
//                 item.matched && styles.matchedItem,
//               ]}
//               onPress={() => handleLeftPress(item.id)}
//               disabled={item.matched}
//             >
//               <Text style={styles.itemText}>{item.text}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Right Column */}
//         <View style={styles.column}>
//           {rightItems.map((item) => (
//             <TouchableOpacity
//               key={item.id}
//               style={[
//                 styles.item,
//                 selectedRight === item.id && styles.selectedItem,
//                 item.matched && styles.matchedItem,
//               ]}
//               onPress={() => handleRightPress(item.id)}
//               disabled={item.matched}
//             >
//               <Text style={styles.itemText}>{item.text}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>

//       {/* Animation Container */}
//       <Animated.View
//         style={[
//           styles.animationContainer,
//           { transform: [{ scale: animateScale }] },
//         ]}
//       >
//         <Icon name="check-circle" size={50} color="#58cc02" />
//       </Animated.View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#111b21',
//     padding: 16,
//   },
//   title: {
//     color: '#fff',
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 24,
//   },
//   columnsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   column: {
//     width: '45%',
//   },
//   item: {
//     backgroundColor: '#2b3940',
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 12,
//     alignItems: 'center',
//   },
//   selectedItem: {
//     backgroundColor: '#F0657A',
//   },
//   matchedItem: {
//     backgroundColor: '#58cc02',
//   },
//   itemText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   animationContainer: {
//     position: 'absolute',
//     bottom: 50,
//     alignSelf: 'center',
//   },
// });

// export default MatchTheFollowing;