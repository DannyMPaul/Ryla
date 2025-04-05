import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  View,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Audio, Video, ResizeMode } from "expo-av"; // Import ResizeMode
import { FontAwesome } from "@expo/vector-icons";
import { FACTS } from "../../../constants/Facts";
import { AudioFiles } from "../../../constants/AudioFiles";
import { ImageFiles } from "../../../constants/ImageFiles";
import { LinearGradient } from "expo-linear-gradient"; // Import LinearGradient

export default function FactDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const fact = FACTS.find((f) => f.id === id);
  const [isInFrench, setIsInFrench] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleLanguage = () => setIsInFrench(!isInFrench);

  const playSound = async () => {
    if (fact) {
      const audioFile =
        AudioFiles[fact.audio.replace(".mp3", "") as keyof typeof AudioFiles];
      if (audioFile) {
        const { sound } = await Audio.Sound.createAsync(audioFile);
        await sound.playAsync();
      }
    }
  };

  const toggleFavorite = () => setIsFavorite(!isFavorite);

  const goBack = () => router.back();

  if (!fact) return <Text>Fact not found</Text>;

  return (
    <View style={styles.container}>
      {/* Video Background */}
      <Video
        source={require("@/assets/videos/FeedbackBackground.mp4")} // Ensure your file path matches
        style={[StyleSheet.absoluteFill, styles.video]}
        resizeMode={ResizeMode.COVER} // Fixed issue by using ResizeMode enum
        shouldPlay
        isLooping
        isMuted
        // style={styles.video}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/Fact_Index")}
          style={styles.backButton}
        >
          <FontAwesome
            name="arrow-left"
            size={30}
            color="rgba(0, 255, 38, 0.93)"
          />
        </TouchableOpacity>
        <Image
          source={ImageFiles[fact.image as keyof typeof ImageFiles]}
          style={styles.image}
        />
        <TouchableOpacity onPress={toggleLanguage}>
          <LinearGradient
            colors={["rgba(255, 170, 0, 0.76)", "#C46E6D"]} // Replace with your desired gradient colors
            start={[0, 0]}
            end={[1, 1]}
            style={styles.textContainer}
          >
            <Text style={styles.text}>
              {isInFrench ? fact.textFr : fact.text}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={playSound} style={styles.button}>
            <FontAwesome name="play" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite} style={styles.button}>
            <FontAwesome
              name={isFavorite ? "star" : "star-o"}
              size={28}
              color="gold"
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  image: {
    width: "100%",
    height: 380,
    borderRadius: 50,
    marginBottom: 20,

    // Shadow for iOS
    shadowColor: "rgb(255, 255, 255)",
    shadowOffset: { width: 7, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 5,

    elevation: 5, // Android shadow
  },
  textContainer: {
    marginBottom: 20,
    padding: 6,
    borderRadius: 15,
  },
  text: {
    fontSize: 24,
    textAlign: "center",
    color: "rgba(255,255,255,1)",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    backgroundColor: "rgba(16, 210, 45, 0.92)",
    padding: 15,
    borderRadius: 15,
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0.4,
  },
});
