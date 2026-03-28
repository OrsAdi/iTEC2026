import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNav from './components/BottomNav';

export default function TeamScreen() {
    return (
        <>
            <View style={styles.container}>
                <Text style={styles.title}>Echipă</Text>
                <Text style={styles.subtitle}>Membrii echipei și informații.</Text>
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
