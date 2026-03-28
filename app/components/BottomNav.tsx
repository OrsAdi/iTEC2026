import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

export default function BottomNav() {
    const router = useRouter();

    const tabs = [
        // Reordered per request: Feed first, Profil second, Scan center, Echipă fourth, Setări last
        { key: 'feed', icon: 'home', label: 'Feed', route: '/feed' },
        { key: 'profile', icon: 'person', label: 'Profil', route: '/profile' },
        { key: 'scan', icon: 'scan', label: 'Scan', route: '/scan' },
        { key: 'team', icon: 'people', label: 'Echipă', route: '/team' },
        { key: 'settings', icon: 'settings', label: 'Setări', route: '/settings' },
    ];

    const nonScanTabs = tabs.filter((t) => t.key !== 'scan');
    const leftTabs = nonScanTabs.slice(0, 2);
    const rightTabs = nonScanTabs.slice(2);

    return (
        <View style={styles.container}>
            {/* blurred background for the navbar */}
            {/* Use the same blur pattern as the login screen (native only). On web fall back to a translucent View. */}
            {Platform.OS === 'web' ? (
                <View style={styles.blurBg} pointerEvents="none" />
            ) : (
                <BlurView intensity={90} tint="dark" style={styles.blurBg} pointerEvents="none" />
            )}
            {/* outline around the transparent navbar (includes bump area) */}
            <View style={styles.outline} pointerEvents="none" />
            <View style={styles.sideContainer}>
                {leftTabs.map((t) => (
                    <TouchableOpacity
                        key={t.key}
                        style={styles.tab}
                        activeOpacity={0.7}
                        onPress={() => router.replace(t.route as any)}
                    >
                        <View style={styles.iconWrapper}>
                            <Ionicons name={t.icon as any} size={20} color="#fff" />
                        </View>
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
                    <Ionicons name={'scan' as any} size={34} color="#fff" />
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
                        <View style={styles.iconWrapper}>
                            <Ionicons name={t.icon as any} size={20} color="#fff" />
                        </View>
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
        height: 64,
        backgroundColor: 'transparent',
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
        paddingBottom: 8,
    },
    label: { color: '#fff', fontSize: 11, marginTop: 2 },
    scanContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -12, // adjusted for smaller navbar height
        zIndex: 50,
        position: 'relative',
    },
    scanButton: {
        width: 40,
        height: 40,
        borderRadius: 22,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        // shadow removed per request — button will appear flat
    },
    scanLabel: { color: '#fff', fontSize: 11, marginTop: 6 },
    sideContainer: { flexDirection: 'row', width: '40%', justifyContent: 'space-around', alignItems: 'center', zIndex: 40, position: 'relative' },

    tab: { alignItems: 'center', justifyContent: 'center', padding: 6, zIndex: 40, position: 'relative' },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    outline: {
        position: 'absolute',
        left: 8,
        right: 8,
        top: -18,
        bottom: 6,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        zIndex: 5,
        backgroundColor: 'transparent',
    },
    bump: {
        position: 'absolute',
        top: -8,
        alignSelf: 'center',
        width: 90,
        height: 28,
        backgroundColor: 'transparent',
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        zIndex: 15,
    },
    blurBg: {
        position: 'absolute',
        // match the outline area so blur is only inside the bordered box
        left: 8,
        right: 8,
        top: -18,
        bottom: 6,
        borderRadius: 30,
        overflow: 'hidden',
        // match login's glass panel tint
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 2,

    },
});
