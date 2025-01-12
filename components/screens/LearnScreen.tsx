// import React from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// import Icon from 'react-native-vector-icons/Feather';
// import { useRouter } from 'expo-router';

// const LearnScreen = () => {
//   const router = useRouter();

//   return (
//     <ScrollView style={styles.container}>
//       <Text style={styles.title}>Learn</Text>
//       <View style={styles.lessonList}>
//         {['Videos', 'Games', 'Food', 'Travel', 'Learn with AI'].map((lesson, index) => (
//           <TouchableOpacity 
//             key={index} 
//             style={styles.lessonItem} 
//             onPress={lesson === 'Learn with AI' ? () => router.replace('/(tabs)/Learnwithai') : lesson === 'Games' ? () => router.replace('/(tabs)/Crossword') : undefined}
//           >
//             <Icon name="book-open" size={24} color="#0066FF" />
//             <Text style={styles.lessonText}>{lesson}</Text>
//             <Icon name="chevron-right" size={24} color="#666666" />
//           </TouchableOpacity>
//         ))}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     padding: 16,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   lessonList: {
//     gap: 12,
//   },
//   lessonItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F0F0F0',
//     padding: 16,
//     borderRadius: 8,
//   },
//   lessonText: {
//     flex: 1,
//     marginLeft: 12,
//     fontSize: 16,
//   },
// });

// export default LearnScreen;

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; 
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';

const LearnScreen = () => {
  const router = useRouter();

  const lessons = [
    { name: 'Learn with AI', icon: 'cpu' },
    { name: 'Videos', icon: 'video' },
    { name: 'Games', icon: 'play-circle' }, // Keep 'play-circle'
    { name: 'Food', icon: 'coffee' },
    { name: 'Travel', icon: 'map' },
    { name: 'Facts', icon: 'globe' },
  ];

  return (
    <View style={styles.container}>
      <Video
        source={require('@/assets/videos/bg4.mp4')}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Learn</Text>
        <View style={styles.lessonList}>
          {lessons.map((lesson, index) => (
            <TouchableOpacity
              key={index}
              style={styles.lessonItem}
              onPress={() => {
                if (lesson.name === 'Learn with AI') {
                  router.push('/(tabs)/Learnwithai');
                } else if (lesson.name === 'Games') {
                  router.push('/(tabs)/Crossword');
                }
                else if (lesson.name === 'Facts') {
                  router.push('/(tabs)/Fact_Index');
                }
                // Add more conditions here for other lessons if needed
              }}
            >
              {/* Conditional icon rendering */}
              {lesson.name === 'Games' ? (
                <MaterialCommunityIcons name="gamepad" size={34} color="rgb(240, 74, 99)" />
              ) : (
                <Icon name={lesson.icon} size={34} color="rgb(240, 74, 99)" />
              )}
              <Text style={styles.lessonText}>{lesson.name}</Text>
              <Icon name="chevron-right" size={34} color="#666666" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'flex-start',
    paddingTop: 30,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  content: {
    flex: 1,
    padding: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.17)',

  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    margin: 30,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  lessonList: {
    gap: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(36, 28, 36, 0.4)',
    padding: 16,
    borderRadius: 18,
    margin: 6,

    shadowColor: 'rgba(0, 0, 0, 0.35)', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 8,

    elevation: 8,

    borderWidth: 1, // Set the border width
    borderColor: 'rgba(240, 74, 99, 0.2)',
  },
  lessonText: {
    flex: 1,
    marginLeft: 30,
    fontSize: 28,
    // fontWeight: 'bold',
    color:'rgb(255, 255, 255)',
  },
});

export default LearnScreen;



