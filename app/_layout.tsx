import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="feed" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="editor" />
      <Stack.Screen name="draw/[id]" />
    </Stack>
  );
}