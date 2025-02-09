import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { Feather as Icon } from '@expo/vector-icons';
import { database } from '../firebase/firebase';
import { ref, onValue } from 'firebase/database';

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
}

const Learnvid = () => {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const videosRef = ref(database, 'videos');
    onValue(videosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const videoList = Object.entries(data).map(([id, video]: [string, any]) => ({
          id,
          ...video,
        }));
        setVideos(videoList);
      }
    });
  }, []);

  const handleVideoPress = (video: Video) => {
    router.push({
      pathname: '/(tabs)/Frenchvid1',
      params: { videoUrl: video.url, title: video.title }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Learn Videos</Text>
      
      {/* Chapter 1 Container */}
      <View style={styles.chapterContainer}>
        <Text style={styles.chapterTitle}>Chapter 1</Text>
        <Text style={styles.lessonCount}>0/5 lessons completed</Text>
        
        <View style={styles.lessonList}>
          <TouchableOpacity 
            style={styles.lessonItem}
            onPress={() => router.replace('./Frenchvid1')}
          >
            <View style={styles.lessonIcon}>
              <Icon name="play-circle" size={24} color="#0066FF" />
            </View>
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonTitle}>Speaking Spanish</Text>
              <Text style={styles.lessonType}>SPEAKING PRACTICE</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.lessonItem}>
            <View style={styles.lessonIcon}>
              <Icon name="message-circle" size={24} color="#0066FF" />
            </View>
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonTitle}>Giving your name</Text>
              <Text style={styles.lessonType}>AI CONVERSATIONS</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#666666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chapter 2 Container */}
      <View style={styles.chapterContainer}>
        <Text style={styles.chapterTitle}>Chapter 2</Text>
        <Text style={styles.lessonCount}>0/5 lessons completed</Text>
        
        <View style={styles.lessonList}>
          <TouchableOpacity style={[styles.lessonItem, styles.lockedLesson]}>
            <View style={styles.lessonIcon}>
              <Icon name="lock" size={24} color="#999999" />
            </View>
            <View style={styles.lessonInfo}>
              <Text style={[styles.lessonTitle, styles.lockedText]}>Saying your nationality</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#999999" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.videoCard}
            onPress={() => handleVideoPress(item)}
          >
            {item.thumbnail && (
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.thumbnail}
              />
            )}
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle}>{item.title}</Text>
              <Text style={styles.videoDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  chapterContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chapterTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lessonCount: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  lessonList: {
    gap: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    gap: 12,
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  lessonType: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  lockedLesson: {
    opacity: 0.7,
  },
  lockedText: {
    color: '#999999',
  },
  videoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  videoInfo: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 14,
    color: '#BBBBBB',
  },
});

export default Learnvid;
