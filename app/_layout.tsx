import { Ionicons } from "@expo/vector-icons"; // Librăria de iconițe
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Ascundem titlul de sus
        tabBarStyle: styles.tabBar, // Stilul bării de jos
        tabBarActiveTintColor: "#007AFF", // Culoarea când e selectat
        tabBarInactiveTintColor: "#888", // Culoarea când nu e selectat
        tabBarShowLabel: true, // Afișăm textul (Feed, Profil, etc.)
        tabBarLabelStyle: { fontSize: 10, marginBottom: 5 },
      }}
    >
      <Tabs.Screen
        name="index" // Acesta este Feed-ul
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // Acesta va fi Profilul tău
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color }) => (
            <View style={styles.scanButton}>
              <Ionicons name="scan-outline" size={28} color="white" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "Echipă",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Setări",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#111", // Fundal închis ca în poză
    borderTopWidth: 0,
    elevation: 0,
    height: 70,
    borderRadius: 30, // Rotunjirea bării
    position: "absolute",
    bottom: 20, // O ridicăm puțin de jos
    left: 20,
    right: 20,
    paddingBottom: 10,
    paddingTop: 10,
  },
  scanButton: {
    backgroundColor: "#007AFF",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20, // Îl facem să sară puțin în sus (floating effect)
  },
});
