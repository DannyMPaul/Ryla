import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  BackHandler,
} from "react-native";
import { Video, AVPlaybackStatus, ResizeMode } from "expo-av";
import { useRouter } from "expo-router";
import { Feather as Icon } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const EnglishVideoLessonScreen = () => {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.back();
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [])
  );

  const handleVideoProgress = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.durationMillis) {
      const progressValue = status.positionMillis / status.durationMillis;
      setProgress(progressValue);
    }
  };

  const togglePlaybackSpeed = async () => {
    const newSpeed =
      playbackSpeed === 1.0 ? 1.5 : playbackSpeed === 1.5 ? 2.0 : 1.0;
    if (videoRef.current) {
      await videoRef.current.setRateAsync(newSpeed, true);
      setPlaybackSpeed(newSpeed);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.replace("./Eng/Home")}
      >
        <Icon name="x" size={24} color="#1a1a1a" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Let's learn English!</Text>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={require("../../../assets/videos/French_L01.mp4")}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={handleVideoProgress}
            isLooping={false}
          />

          {/* Bookmark Button */}
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={() => setIsBookmarked(!isBookmarked)}
          >
            <Icon
              name="bookmark"
              size={24}
              color={isBookmarked ? "#1a74e4" : "#666666"}
            />
          </TouchableOpacity>

          {/* Playback Speed */}
          <TouchableOpacity
            style={styles.speedIndicator}
            onPress={togglePlaybackSpeed}
          >
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
          </TouchableOpacity>
        </View>

        {/* Translation Container */}
        <View style={styles.translationContainer}>
          <Text style={styles.foreignText}>Hello!</Text>
          <Text style={styles.nativeText}>你好! / ¡Hola! / Bonjour!</Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.back()}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e5e5e5",
    width: "100%",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#58cc02",
  },
  closeButton: {
    position: "absolute",
    top: 48,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 24,
  },
  videoContainer: {
    width: width - 64,
    height: (width - 64) * 0.75,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    position: "relative",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  bookmarkButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  speedIndicator: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speedText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  translationContainer: {
    width: "100%",
    backgroundColor: "#f7f7f7",
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    alignItems: "center",
  },
  foreignText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  nativeText: {
    fontSize: 20,
    color: "#666",
  },
  continueButton: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: "#1a74e4",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  continueText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default EnglishVideoLessonScreen;
