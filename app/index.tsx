import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// IMPORTĂM router
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // INIȚIALIZĂM router
  const router = useRouter();

  const handleAuth = () => {
    // O mică verificare să nu lăsăm câmpurile goale
    if (email.length > 0 && password.length >= 6) {
      // NAVIGĂM CĂTRE HOME
      router.replace('/home');
    } else {
      Alert.alert("Eroare", "Introdu un email valid și o parolă de minim 6 caractere.");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}><Text style={styles.logoText}>iT</Text></View>
        </View>

        <Text style={styles.title}>{isLogin ? 'Login' : 'Sign Up'}</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="Email" 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Parolă" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />

        <TouchableOpacity style={styles.mainButton} onPress={handleAuth}>
          <Text style={styles.buttonText}>{isLogin ? 'Intră în cont' : 'Creează cont'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
          <Text style={styles.switchText}>
            {isLogin ? "Nu ai cont? Înregistrează-te" : "Ai deja cont? Loghează-te"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 70, height: 70, backgroundColor: '#007AFF', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#f0f2f5', padding: 15, borderRadius: 10, marginBottom: 15 },
  mainButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#007AFF', fontWeight: '500' }
});