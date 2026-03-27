import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Index este Login-ul */}
      <Stack.Screen name="index" />
      {/* Feed este pagina ta principală de după login */}
      <Stack.Screen name="feed" />
    </Stack>
  );
}