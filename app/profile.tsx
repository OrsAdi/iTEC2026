import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNav from './components/BottomNav';

export default function ProfileScreen() {
    return (
        <>
            <View style={styles.container}>
                <Text style={styles.title}>Profilul Meu</Text>
                <Text style={styles.subtitle}>Aici vor fi detaliile contului.</Text>
            </View>
            <BottomNav />
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center', paddingBottom: 90 },
    title: { color: '#00F0FF', fontSize: 22, fontWeight: 'bold' },
    subtitle: { color: '#ccc', marginTop: 10 },
});
