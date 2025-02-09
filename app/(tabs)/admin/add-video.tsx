import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../../firebase/firebase';
import { ref, push } from 'firebase/database';

const AddVideo = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const router = useRouter();

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) {
      Alert.alert('Error', 'Title and URL are required');
      return;
    }

    try {
      const videosRef = ref(database, 'videos');
      await push(videosRef, {
        title,
        description,
        url,
        thumbnail,
        createdAt: new Date().toISOString()
      });

      router.back();
    } catch (error) {
      console.error('Error saving video:', error);
      Alert.alert('Error', 'Failed to save video');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Video</Text>

      <TextInput
        style={styles.input}
        placeholder="Video Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Video URL"
        value={url}
        onChangeText={setUrl}
      />

      <TextInput
        style={styles.input}
        placeholder="Thumbnail URL (optional)"
        value={thumbnail}
        onChangeText={setThumbnail}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Video</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#F0657A',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddVideo; 