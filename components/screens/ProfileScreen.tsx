import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <Image
          source={require('../assets/profile-placeholder.jpg')}
          style={styles.profileImage}
        /> */}
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.level}>Level 5 Learner</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>120</Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>7</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.settingsButton}>
        <Icon name="settings" size={24} color="#666666" />
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  level: {
    fontSize: 16,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 8,
  },
  settingsText: {
    marginLeft: 12,
    fontSize: 16,
  },
});

export default ProfileScreen;