import React, { useState } from "react";
import {
  FlatList,
  Image,
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
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = () => {
  const availableAvatars = [
    { id: "1", uri: "https://api.dicebear.com/7.x/bottts/png?seed=1" },
    { id: "2", uri: "https://api.dicebear.com/7.x/bottts/png?seed=2" },
    { id: "3", uri: "https://api.dicebear.com/7.x/bottts/png?seed=3" },
    { id: "4", uri: "https://api.dicebear.com/7.x/bottts/png?seed=4" },
  ];

  const [userData, setUserData] = useState({
    name: "Codrin iTEC",
    email: "codrin@itec.ro",
    acronym: "ITEC2026",
    teamName: "Echipa Racheta",
    avatar: availableAvatars[0].uri,
  });

  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Glass Wrapper pentru tot profilul */}
            <View style={styles.glassWrapper}>
              <View style={styles.blurContainer}>
                {/* Logo Style Header */}
                <View style={styles.logoContainer}>
                  <View style={styles.logoBox}>
                    <Text style={styles.logoTextMain}>MY</Text>
                    <Text style={styles.logoTextSub}>PROFILE</Text>
                  </View>
                </View>

                {/* Avatar Section adaptat */}
                <View style={styles.avatarWrapper}>
                  <TouchableOpacity
                    onPress={() => setIsModalVisible(true)}
                    style={styles.avatarTouch}
                  >
                    <Image
                      source={{ uri: userData.avatar }}
                      style={styles.avatarImage}
                    />
                    <View style={styles.editBadge}>
                      <Text style={styles.editBadgeText}>+</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.title}>USER SETTINGS</Text>

                <View style={styles.form}>
                  {/* Name Input */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={userData.name}
                      onChangeText={(text: string) =>
                        setUserData({ ...userData, name: text })
                      }
                      placeholder="NAME"
                      placeholderTextColor="#444"
                    />
                  </View>

                  {/* Email (Read Only style) */}
                  <View style={[styles.inputWrapper, { opacity: 0.6 }]}>
                    <Text style={[styles.input, { paddingTop: 18 }]}>
                      {userData.email}
                    </Text>
                  </View>

                  {/* Acronym Input */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={userData.acronym}
                      onChangeText={(text: string) =>
                        setUserData({ ...userData, acronym: text })
                      }
                      placeholder="ACRONYM"
                      placeholderTextColor="#444"
                      maxLength={8}
                    />
                  </View>

                  {/* Team Input */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={userData.teamName}
                      onChangeText={(text: string) =>
                        setUserData({ ...userData, teamName: text })
                      }
                      placeholder="TEAM NAME"
                      placeholderTextColor="#444"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => alert("Profile Updated")}
                  >
                    <Text style={styles.loginButtonText}>SAVE CHANGES</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.credits}>iTEC OVERRIDE v1.0.26</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Modal adaptat vizual */}
        <Modal visible={isModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContainer,
                { borderColor: "#007AFF", borderWidth: 1 },
              ]}
            >
              <Text style={[styles.title, { marginBottom: 20 }]}>
                SELECT AVATAR
              </Text>
              <FlatList
                data={availableAvatars}
                numColumns={2}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setUserData({ ...userData, avatar: item.uri });
                      setIsModalVisible(false);
                    }}
                    style={styles.avatarOption}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.avatarOptionImage}
                    />
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.footer}
              >
                <Text style={styles.footerLink}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, backgroundColor: "#007AFF" },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "center", padding: 25 },

  // Glassmorphism effect
  glassWrapper: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  blurContainer: {
    padding: 35,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },

  // Avatar specific
  avatarWrapper: { marginBottom: 30 },
  avatarTouch: { position: "relative" },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  editBadgeText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  // Logo Style de la Login
  logoContainer: { marginBottom: 20 },
  logoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  logoTextMain: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  logoTextSub: {
    color: "#007AFF",
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 5,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: "#888",
    marginBottom: 25,
    textTransform: "uppercase",
  },

  form: { width: "100%" },
  inputWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },

  loginButton: {
    backgroundColor: "#007AFF",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#111",
    width: "80%",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
  },
  avatarOption: { margin: 15 },
  avatarOptionImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#444",
  },

  footer: { marginTop: 20 },
  footerLink: { color: "#007AFF", fontWeight: "bold" },
  credits: { color: "#87c7ed", fontSize: 10, marginTop: 25 },
});

export default ProfileScreen;
