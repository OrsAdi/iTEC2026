import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert, Animated,
  ImageBackground,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
Alert,
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // 1. ANIMAȚIILE AGRESIVE ȘI AICI
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 2. ACEEAȘI LOGICĂ DE ANIMAȚIE RAPIDĂ ȘI PUTERNICĂ
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15, // Mărim efectul
            duration: 2000, // Mai rapid
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  const handleSignUp = () => {
    if (name && email.includes("@") && password.length >= 6) {
      Alert.alert("SUCCESS", "Account created! Now login.");
      router.replace('/');
      router.replace("/");
    } else {
      Alert.alert("ERROR", "Please fill all fields correctly.");
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000' }}
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000",
        }}
        style={styles.background}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.glassWrapper}>
              <BlurView intensity={90} tint="dark" style={styles.blurContainer}>

                {/* 3. APLICĂM ANIMAȚIA AGRESIVĂ PE LOGO ȘI AICI */}
                <Animated.View style={[
                  styles.logoContainer,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: opacityAnim
                  }
                ]}>
                  <Animated.View
                    style={[
                      styles.logoContainer,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: opacityAnim,
                      },
                    ]}
                  >
                    <View style={styles.logoBox}>
                      <Text style={styles.logoTextMain}>GLITCH_</Text>
                      <Text style={styles.logoTextSub}>TAG</Text>
                    </View>
                  </Animated.View>

                  <Text style={styles.title}>CREATE ACCOUNT</Text>
                  <Text style={styles.subtitle}>Join the GLITCH_TAG network</Text>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#007AFF" />
                    <TextInput
                      style={styles.input}
                      placeholder="FULL NAME"
                      placeholderTextColor="#666"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="terminal-outline" size={20} color="#007AFF" />
                    <TextInput
                      style={styles.input}
                      placeholder="EMAIL ADDRESS"
                      placeholderTextColor="#666"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#007AFF"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="PASSWORD"
                      placeholderTextColor="#666"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleSignUp}
                  >
                    <Text style={styles.loginButtonText}>SIGN UP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push("/")}
                    style={styles.footerLink}
                  >
                    <Text style={styles.linkText}>
                      Already have an account?{" "}
                      <Text style={styles.boldText}>Login</Text>
                    </Text>
                  </TouchableOpacity>
              </BlurView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... ACELEAȘI STILURI CA ANTERIOR, ADAUGĂM logoContainer ...
  container: { flex: 1 },
  background: { flex: 1, backgroundColor: "#000" },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "center", padding: 25 },
  glassWrapper: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  blurContainer: {
    padding: 35,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  logoContainer: { marginBottom: 30 }, // ADAUGĂ AICI
  logoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  logoTextMain: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  logoTextSub: { color: "#007AFF", fontSize: 26, fontWeight: "bold" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 5,
  },
  subtitle: { fontSize: 13, color: "#888", marginBottom: 35 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 60,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  input: { flex: 1, color: "#fff", fontSize: 16, marginLeft: 10 },
  loginButton: {
    backgroundColor: "#007AFF",
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  loginButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  footerLink: { marginTop: 20 },
  linkText: { color: "#ccc" },
  boldText: { color: "#007AFF", fontWeight: "bold" },
});
