import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppBackground from "./components/AppBackground";
import { supabase } from "./lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [modal, setModal] = useState<{
    visible: boolean;
    type: "error" | "success";
    title: string;
    message: string;
  }>({ visible: false, type: "error", title: "", message: "" });
  const router = useRouter();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 300, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 0.7, duration: 150, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/feed");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/feed");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const showError = (title: string, message: string) => {
    setModal({ visible: true, type: "error", title, message });
  };

  const showSuccess = (title: string, message: string) => {
    setModal({ visible: true, type: "success", title, message });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showError("INPUT_ERROR", "Completează email și parola.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) showError("ACCESS_DENIED", error.message);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      showError("INPUT_ERROR", "Completează email și parola.");
      return;
    }
    if (password.length < 6) {
      showError("INPUT_ERROR", "Parola trebuie să aibă minim 6 caractere.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: "itec://feed" },
    });
    setLoading(false);
    if (error) {
      showError("EROARE", error.message);
    } else {
      showSuccess(
        "CONT_CREAT",
        "Verifică email-ul pentru a confirma contul, apoi loghează-te."
      );
    }
  };

  const handleModalClose = () => {
    setModal((prev) => ({ ...prev, visible: false }));
    if (modal.type === "success") setIsSignUp(false);
  };

  const isError = modal.type === "error";

  return (
    <AppBackground>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.glassWrapper}>
            <BlurView intensity={90} tint="dark" style={styles.blurContainer}>

              <Animated.View
                style={[styles.logoContainer, { transform: [{ scale: pulseAnim }], opacity: opacityAnim }]}
              >
                <View style={styles.logoBox}>
                  <Text style={styles.logoTextMain}>GLITCH_</Text>
                  <Text style={styles.logoTextSub}>TAG</Text>
                </View>
              </Animated.View>

              <Text style={styles.title}>
                {isSignUp ? "CREATE_ACCOUNT" : "SYSTEM_OVERRIDE"}
              </Text>
              <Text style={styles.subtitle}>
                {isSignUp ? "Join the network" : "Ready for digital vandalism?"}
              </Text>

              <View style={styles.form}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="terminal-outline" size={20} color="#007AFF" />
                  <TextInput
                    style={styles.input}
                    placeholder="EMAIL"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
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
                  style={[styles.loginButton, loading && { opacity: 0.6 }]}
                  onPress={isSignUp ? handleSignUp : handleLogin}
                  disabled={loading}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? "SE PROCESEAZĂ..." : isSignUp ? "CREEAZĂ CONT" : "LOGIN"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={styles.footerLink}>
                    {isSignUp ? "Ai deja cont? Login" : "Nu ai cont? Request Access"}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.credits}>VER. 1.0.26 | iTEC OVERRIDE</Text>
              </View>

            </BlurView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal stilizat */}
      <Modal visible={modal.visible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={95} tint="dark" style={styles.modalCard}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderMain}>SYSTEM</Text>
              <Text style={styles.modalHeaderSub}> ALERT</Text>
            </View>

            {/* Icon */}
            <View style={[
              styles.modalIconCircle,
              isError ? styles.modalIconCircleError : styles.modalIconCircleSuccess,
            ]}>
              <Text style={[
                styles.modalIconText,
                isError ? styles.modalIconTextError : styles.modalIconTextSuccess,
              ]}>
                {isError ? "✕" : "✓"}
              </Text>
            </View>

            {/* Title */}
            <Text style={[
              styles.modalTitle,
              isError ? styles.modalTitleError : styles.modalTitleSuccess,
            ]}>
              {modal.title}
            </Text>

            {/* Message */}
            <Text style={styles.modalMessage}>{modal.message}</Text>

            {/* Button */}
            <TouchableOpacity
              style={[
                styles.modalBtn,
                isError ? styles.modalBtnError : styles.modalBtnSuccess,
              ]}
              onPress={handleModalClose}
            >
              <Text style={styles.modalBtnText}>
                {isError ? "RETRY" : "OK"}
              </Text>
            </TouchableOpacity>

          </BlurView>
        </View>
      </Modal>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "center", padding: 25 },
  glassWrapper: {
    borderRadius: 30, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  blurContainer: {
    padding: 35, alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  logoContainer: { marginBottom: 30 },
  logoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(0,122,255,0.1)",
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 15, borderWidth: 1, borderColor: "#007AFF",
  },
  logoTextMain: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  logoTextSub: { color: "#007AFF", fontSize: 26, fontWeight: "bold" },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", letterSpacing: 2, marginBottom: 5 },
  subtitle: { fontSize: 13, color: "#888", marginBottom: 35, textTransform: "uppercase" },
  form: { width: "100%" },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12, marginBottom: 15,
    paddingHorizontal: 15, height: 60,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  input: { flex: 1, color: "#fff", fontSize: 16, marginLeft: 10 },
  loginButton: {
    backgroundColor: "#007AFF", height: 60,
    borderRadius: 12, justifyContent: "center",
    alignItems: "center", marginTop: 10,
  },
  loginButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold", letterSpacing: 2 },
  footer: { marginTop: 30, alignItems: "center" },
  footerLink: { color: "#007AFF", fontWeight: "bold", fontSize: 14 },
  credits: { color: "#444", fontSize: 10, marginTop: 25 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "80%", borderRadius: 25, padding: 30, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,122,255,0.4)",
    overflow: "hidden", backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalHeader: { flexDirection: "row", marginBottom: 20 },
  modalHeaderMain: { color: "#fff", fontSize: 14, fontWeight: "bold", letterSpacing: 2 },
  modalHeaderSub: { color: "#007AFF", fontSize: 14, fontWeight: "bold", letterSpacing: 2 },
  modalIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: "center", alignItems: "center",
    marginBottom: 16, borderWidth: 1.5,
  },
  modalIconCircleError: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "#ef4444",
  },
  modalIconCircleSuccess: {
    backgroundColor: "rgba(0,255,120,0.1)",
    borderColor: "#00FF78",
  },
  modalIconText: { fontSize: 24, fontWeight: "bold" },
  modalIconTextError: { color: "#ef4444" },
  modalIconTextSuccess: { color: "#00FF78" },
  modalTitle: {
    fontSize: 16, fontWeight: "bold", letterSpacing: 2,
    marginBottom: 10, textAlign: "center",
  },
  modalTitleError: { color: "#ef4444" },
  modalTitleSuccess: { color: "#00FF78" },
  modalMessage: {
    color: "rgba(255,255,255,0.7)", fontSize: 13,
    textAlign: "center", lineHeight: 20, marginBottom: 24,
  },
  modalBtn: {
    width: "100%", paddingVertical: 14,
    borderRadius: 12, alignItems: "center",
  },
  modalBtnError: { backgroundColor: "#ef4444" },
  modalBtnSuccess: { backgroundColor: "#007AFF" },
  modalBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15, letterSpacing: 2 },
});