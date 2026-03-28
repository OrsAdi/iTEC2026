import { BlurView } from "expo-blur";
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
    name: "Codrin Alberto",
    email: "codrinalberti@gmail.com",
    acronym: "SAFIRU",
    teamName: "FC AutoUtilitarele SA",
    avatar: availableAvatars[0].uri,
  });

  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {}
            <View style={styles.glassWrapper}>
              <View style={styles.blurContainer}>
                {}
                <View style={styles.logoContainer}>
                  <View style={styles.logoBox}>
                    <Text style={styles.logoTextMain}>MY</Text>
                    <Text style={styles.logoTextSub}>PROFILE</Text>
                  </View>
                </View>

                {}
                <View style={styles.avatarSection}>
                  <TouchableOpacity
                    onPress={() => setIsAvatarModalVisible(true)}
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

                  <View style={styles.teamBadge}>
                    <Text style={styles.teamBadgeText}>
                      {userData.teamName}
                    </Text>
                  </View>
                </View>

                <Text style={styles.title}>USER INFORMATION</Text>

                <View style={styles.form}>
                  {}
                  <View style={styles.inputLabelGroup}>
                    <Text style={styles.microLabel}>NAME</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={userData.name}
                        onChangeText={(text: string) =>
                          setUserData({ ...userData, name: text })
                        }
                      />
                    </View>
                  </View>

                  {}
                  <View style={styles.inputLabelGroup}>
                    <Text style={styles.microLabel}>EMAIL</Text>
                    <View style={[styles.inputWrapper, { opacity: 0.6 }]}>
                      <Text style={[styles.input, { paddingTop: 18 }]}>
                        {userData.email}
                      </Text>
                    </View>
                  </View>

                  {}
                  <View style={styles.inputLabelGroup}>
                    <Text style={styles.microLabel}>ACRONYM</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[
                          styles.input,
                          { color: "#007AFF", fontWeight: "bold" },
                        ]}
                        value={userData.acronym}
                        onChangeText={(text: string) =>
                          setUserData({ ...userData, acronym: text })
                        }
                        maxLength={8}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => setIsAlertVisible(true)}
                  >
                    <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.credits}>iTEC OVERRIDE v1.0.26</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {}
        <Modal
          visible={isAvatarModalVisible}
          animationType="fade"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
              <Text style={[styles.title, { marginBottom: 20 }]}>
                SELECT AVATAR
              </Text>
              <FlatList
                data={availableAvatars}
                numColumns={2}
                keyExtractor={(item) => item.id}
                renderItem={({
                  item,
                }: {
                  item: { id: string; uri: string };
                }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setUserData({ ...userData, avatar: item.uri });
                      setIsAvatarModalVisible(false);
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
                onPress={() => setIsAvatarModalVisible(false)}
                style={styles.footer}
              >
                <Text style={styles.footerLink}>CANCEL</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </Modal>
        {}
        <Modal visible={isAlertVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={95} tint="dark" style={styles.customAlertCard}>
              <View style={styles.alertHeaderBox}>
                <Text style={styles.alertHeaderTextMain}>PROFILE</Text>
                <Text style={styles.alertHeaderTextSub}>STATUS</Text>
              </View>

              <View style={styles.successIconCircle}>
                <Text style={styles.successIconText}>✓</Text>
              </View>

              <Text style={styles.alertTitle}>IDENTITY UPDATED</Text>
              <Text style={styles.alertMessage}>
                User profile information has been successfully updated.
              </Text>

              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setIsAlertVisible(false)}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, backgroundColor: "#001a33" },
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },

  avatarSection: { alignItems: "center", marginBottom: 25 },
  avatarTouch: { position: "relative", marginBottom: 12 },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  editBadgeText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  teamBadge: {
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 122, 255, 0.3)",
  },
  teamBadgeText: {
    color: "#007AFF",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

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
  inputLabelGroup: { marginBottom: 15, width: "100%" },
  microLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
    marginLeft: 5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  inputWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
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
  saveButton: {
    backgroundColor: "#007AFF",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
    overflow: "hidden",
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

  customAlertCard: {
    width: "80%",
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 122, 255, 0.4)",
    overflow: "hidden",
  },
  alertHeaderBox: { flexDirection: "row", marginBottom: 20 },
  alertHeaderTextMain: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  alertHeaderTextSub: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
    marginLeft: 5,
  },
  successIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 255, 120, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#00FF78",
  },
  successIconText: { color: "#00FF78", fontSize: 24, fontWeight: "bold" },
  alertTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  alertMessage: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 25,
  },
  alertButton: {
    backgroundColor: "#007AFF",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  alertButtonText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
  credits: { color: "#444", fontSize: 10, marginTop: 25 },
});

export default ProfileScreen;
