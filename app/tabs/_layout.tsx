import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#888",
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 10, marginBottom: 5 },
      }}
    >
      <Tabs.Screen
        name="feed" // app/(tabs)/feed.tsx
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // app/(tabs)/profile.tsx
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
    backgroundColor: "rgba(10, 10, 10, 0.95)",
    borderTopWidth: 0,
    height: 70,
    borderRadius: 30,
    position: "absolute",
    bottom: 20,
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
    marginTop: -20,
  },
});
