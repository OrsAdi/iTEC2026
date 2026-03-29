import { BlurView } from "expo-blur";
import { ImageBackground, StyleSheet, View } from "react-native";

const BG_URL = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000";

export default function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <ImageBackground
      source={{ uri: BG_URL }}
      style={styles.background}
      imageStyle={styles.image}
    >
      <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#000" },
  image: { opacity: 0.55 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 20, 0.5)",
  },
  content: { flex: 1 },
});