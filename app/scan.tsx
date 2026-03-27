import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNav from './components/BottomNav';

export default function ScanScreen() {
    return (
        <>
            <View style={styles.container}>
                <Text style={styles.title}>Scanare</Text>
                <Text style={styles.subtitle}>Pagina de scanare QR / coduri.</Text>
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
