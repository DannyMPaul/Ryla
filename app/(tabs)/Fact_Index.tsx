import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Link, useFocusEffect, router } from "expo-router";
import { Video, ResizeMode } from "expo-av"; // Import Video component
import { FACTS } from "../../constants/Facts";
import FactItem from "@/components/FactItem";
// import FactItem from '../../components/FactItem';
import { Ionicons } from "@expo/vector-icons";

import { Fact } from "../../types/index";

export default function TabOneScreen() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const shuffleAndSetFacts = useCallback(() => {
    const shuffledFacts = [...FACTS].sort(() => Math.random() - 0.5);
    setFacts(shuffledFacts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      shuffleAndSetFacts();
    }, [shuffleAndSetFacts])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const renderItem = ({ item, index }: { item: Fact; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          },
        ],
      }}
    >
      <Link href={`../Facts_French/${item.id}`} asChild>
        <FactItem fact={item} onPress={() => {}} />
      </Link>
    </Animated.View>
  );

  const BackButton = () => (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => router.replace("/(tabs)/TabNavigator")}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back-circle" size={42} color="#F0657A" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Video Background */}
      <Video
        source={require("@/assets/videos/FeedbackBackground.mp4")} // Ensure your file path matches
        style={StyleSheet.absoluteFillObject} // Fill the screen
        resizeMode={ResizeMode.COVER} // Fixed issue by using ResizeMode enum
        shouldPlay
        isLooping
        isMuted
      />
      <BackButton />
      <FlatList
        data={facts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black", // Ensures black background behind video
  },
  listContainer: {
    padding: 15,
    zIndex: 2, // Ensure content is above the video background
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 21,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
});
