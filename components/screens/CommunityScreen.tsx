import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const CommunityScreen = () => {
  const posts = [
    { id: '1', author: 'User1', content: 'Just finished my first lesson!' },
    { id: '2', author: 'User2', content: 'Anyone want to practice speaking?' },
    { id: '3', author: 'User3', content: 'Check out my progress this week!' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community</Text>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.post}>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.content}>{item.content}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  post: {
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  author: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  content: {
    fontSize: 14,
  },
});

export default CommunityScreen;