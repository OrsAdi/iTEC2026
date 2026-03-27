import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = () => {
  const [userData, setUserData] = useState({
    name: "Alberto Codrin",
    email: "codrinalberti@gmail.com",
    acronym: "Safiru",
    teamName: "FC AutoUtilitarele SA",
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.profileCard}>
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.infoSection}>
          <Text style={styles.label}>NUME</Text>
          <TextInput
            style={styles.input}
            value={userData.name}
            onChangeText={(text: string) =>
              setUserData({ ...userData, name: text })
            }
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>EMAIL (Citire doar)</Text>
          <Text style={styles.valueText}>{userData.email}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>ACRONIM ECHIPĂ</Text>
          <TextInput
            style={styles.input}
            value={userData.acronym}
            onChangeText={(text: string) =>
              setUserData({ ...userData, acronym: text })
            }
            maxLength={8}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => alert("Profil Salvat!")}
        >
          <Text style={styles.buttonText}>Salvează Modificările</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  profileCard: { padding: 20 },
  title: {
    color: "#00FF00",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
  },
  infoSection: { marginBottom: 25 },
  label: { color: "#888", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  input: {
    color: "#fff",
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#00FF00",
    paddingVertical: 5,
  },
  valueText: { color: "#555", fontSize: 18, marginTop: 5 },
  button: {
    backgroundColor: "#00FF00",
    padding: 18,
    borderRadius: 8,
    marginTop: 30,
    alignItems: "center",
  },
  buttonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
});

export default ProfileScreen;
