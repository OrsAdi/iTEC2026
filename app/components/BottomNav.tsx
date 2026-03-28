import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BottomNav() {
    const router = useRouter();

    const tabs = [
        // Reordered per request: Feed first, Profil second, Scan center, Echipă fourth, Setări last
        { key: 'feed', icon: 'home-outline', label: 'Feed', route: '/feed' },
        { key: 'profile', icon: 'person-outline', label: 'Profil', route: '/profile' },
        { key: 'scan', icon: 'scan-outline', label: 'Scan', route: '/scan' },
        { key: 'team', icon: 'people-outline', label: 'Echipă', route: '/team' },
        { key: 'settings', icon: 'settings-outline', label: 'Setări', route: '/settings' },
    ];

    const nonScanTabs = tabs.filter((t) => t.key !== 'scan');
    const leftTabs = nonScanTabs.slice(0, 2);
    const rightTabs = nonScanTabs.slice(2);

    return (
        <View style={styles.container}>
            <View style={styles.sideContainer}>
                {leftTabs.map((t) => (
                    <TouchableOpacity
                        key={t.key}
                        style={styles.tab}
                        activeOpacity={0.7}
                        onPress={() => router.replace(t.route as any)}
                    >
                        <Ionicons name={t.icon as any} size={24} color="#050505" />
                        <Text style={styles.label}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Bump on the bar behind the scan button to create a small upward arc */}
            <View style={styles.bump} />

            {/* Scan button centered: half inside the bar, half above it, integrated with bar */}
            <TouchableOpacity
                style={styles.scanContainer}
                activeOpacity={0.85}
                onPress={() => router.replace('/scan' as any)}
            >
                <View style={styles.scanButton}>
                    <Ionicons name={'scan-outline' as any} size={34} color="#00F0FF" />
                </View>
                <Text style={styles.scanLabel}>Scan</Text>
            </TouchableOpacity>

            <View style={styles.sideContainer}>
                {rightTabs.map((t) => (
                    <TouchableOpacity
                        key={t.key}
                        style={styles.tab}
                        activeOpacity={0.7}
                        onPress={() => router.replace(t.route as any)}
                    >
                        <Ionicons name={t.icon as any} size={24} color="#050505" />
                        <Text style={styles.label}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 80,
        backgroundColor: '#ffffff',
        // remove top separator so navbar blends with page content
        borderTopWidth: 0,
        borderTopColor: 'transparent',
        // subtle shadow to lift the navbar above the page content
        // iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        // Android
        elevation: 8,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 10,
    },
    label: { color: '#333', fontSize: 11, marginTop: 2 },
    scanContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -15, // reduced so scan button sits slightly lower in the bar
        zIndex: 20,
    },
    scanButton: {
        width: 35,
        height: 35,
        borderRadius: 50,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        // shadow removed per request — button will appear flat
    },
    scanLabel: { color: '#333', fontSize: 11, marginTop: 6 },
    sideContainer: { flexDirection: 'row', width: '40%', justifyContent: 'space-around', alignItems: 'center' },

    tab: { alignItems: 'center', justifyContent: 'center', padding: 6 },
    bump: {
        position: 'absolute',
        top: -10,
        alignSelf: 'center',
        width: 90,
        height: 40,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 44,
        borderTopRightRadius: 44,
        zIndex: 15,
    },
});
