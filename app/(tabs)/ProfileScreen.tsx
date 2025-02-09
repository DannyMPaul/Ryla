import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = () => {
  const [isLearnedWordsOpen, setIsLearnedWordsOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || 'User');
        setUserEmail(user.email || '');
        setProfileImage(user.photoURL);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const auth = getAuth();
    try {
      await auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (user) {
          setProfileImage(result.assets[0].uri);
          await updateProfile(user, {
            photoURL: result.assets[0].uri
          });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileIcon}>
              <Feather name="user" size={40} color="#0066FF" />
              <View style={styles.addImageIcon}>
                <Feather name="plus-circle" size={24} color="#58cc02" />
              </View>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
      </View>

      <TouchableOpacity 
        style={styles.dropdownHeader}
        onPress={() => setIsLearnedWordsOpen(!isLearnedWordsOpen)}
      >
        <Text style={styles.sectionTitle}>Learned Words</Text>
        <Feather 
          name={isLearnedWordsOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#666666"
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingsButton}>
        <Feather name="settings" size={24} color="#666666" />
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Feather name="log-out" size={24} color="#FF3B30" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 24,
  },
  imageContainer: {
    marginBottom: 16,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  addImageIcon: {
    position: 'absolute',
    right: -12,
    bottom: -12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666666',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  settingsText: {
    marginLeft: 12,
    fontSize: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  signOutText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#FF3B30',
  },
});

export default ProfileScreen; 