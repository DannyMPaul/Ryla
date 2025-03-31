// import React from 'react';
// import { View, Text, StyleSheet, ScrollView } from 'react-native';

// const ReviewScreen = () => {
//   const stats = [
//     { label: 'Words Learned', value: 120 },
//     { label: 'Days Streak', value: 7 },
//     { label: 'Total XP', value: 1500 },
//   ];

//   return (
//     <ScrollView style={styles.container}>
//       <Text style={styles.title}>Review</Text>
//       <View style={styles.statsContainer}>
//         {stats.map((stat, index) => (
//           <View key={index} style={styles.statItem}>
//             <Text style={styles.statValue}>{stat.value}</Text>
//             <Text style={styles.statLabel}>{stat.label}</Text>
//           </View>
//         ))}
//       </View>
//       <View style={styles.chartPlaceholder}>
//         <Text style={styles.chartText}>Progress Chart Placeholder</Text>
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
//     marginBottom: 24,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 32,
//   },
//   statItem: {
//     alignItems: 'center',
//   },
//   statValue: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#0066FF',
//   },
//   statLabel: {
//     fontSize: 14,
//     color: '#666666',
//   },
//   chartPlaceholder: {
//     height: 200,
//     backgroundColor: '#F0F0F0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 8,
//   },
//   chartText: {
//     fontSize: 16,
//     color: '#666666',
//   },
// });

// export default ReviewScreen;
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const ReviewScreen = () => {
  const stats = [
    { label: 'Words Learned', value: 120 },
    { label: 'Days Streak', value: 7 },
    { label: 'Total XP', value: 1500 },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Review</Text>
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartText}>Progress Chart Placeholder</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(78, 13, 22, 0.14)', // Dark background
    padding: 46,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF', // Light text
    marginBottom: 24,
    textAlign:'center',
    margin:25,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E90FF', // Bright blue for stats
  },
  statLabel: {
    fontSize: 14,
    color: '#BBBBBB', // Subtle light text
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#1E1E1E', // Darker shade for chart placeholder
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1, // Border for better contrast
    borderColor: '#1A1A1A', // Subtle border color
  },
  chartText: {
    fontSize: 16,
    color: '#1A1A1A', // Lighter text for placeholder
  },
});

export default ReviewScreen;
