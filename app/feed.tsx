import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import BottomNav from './components/BottomNav';

const MOCK_POSTS = [
    {
        id: '1',
        user: 'CyberGhost',
        image: 'https://picsum.photos/seed/67/400/400',
        caption: 'Am cucerit holul de la AC! ⚡ #iTECOVERRIDE',
        likes: 24,
    },
    {
        id: '2',
        user: 'NeonVandal',
        image: 'https://picsum.photos/seed/89/400/400',
        caption: 'Glitch art peste reclamele plictisitoare.',
        likes: 156,
    },
];

export default function FeedScreen() {
    const [posts, setPosts] = useState(MOCK_POSTS);

    const renderItem = ({ item }: { item: typeof MOCK_POSTS[0] }) => (
        <View style={styles.postContainer}>
            {/* Header Post (User) */}
            <View style={styles.postHeader}>
                <View style={styles.avatarPlaceholder} />
                <Text style={styles.username}>{item.user}</Text>
            </View>

            {/* Imaginea Posterului */}
            <Image source={{ uri: item.image }} style={styles.postImage} />

            {/* Actiuni (Like, Comment, etc) */}
            <View style={styles.actionRow}>
                <TouchableOpacity>
                    <Ionicons name="heart-outline" size={28} color="#FF0055" />
                </TouchableOpacity>
                <TouchableOpacity style={{ marginLeft: 15 }}>
                    <Ionicons name="chatbubble-outline" size={26} color="white" />
                </TouchableOpacity>
            </View>

            {/* Descriere */}
            <View style={styles.captionContainer}>
                <Text style={styles.captionText}>
                    <Text style={styles.username}>{item.user} </Text>
                    {item.caption}
                </Text>
            </View>
        </View>
    );

    return (
        <>
            <View style={styles.background}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        {Platform.OS === 'web' ? (
                            <View style={styles.headerGlass} />
                        ) : (
                            <BlurView intensity={80} tint="dark" style={styles.headerGlass} />
                        )}
                        <View style={styles.headerInner} pointerEvents="none">
                            <View style={styles.logoLeft}>
                                <Text style={styles.logoLeftText}>SYSTEM_OVERRIDE</Text>
                            </View>
                        </View>
                    </View>

                    <FlatList
                        data={posts}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
                    />
                </View>
            </View>
            <BottomNav />
        </>
    );
}

const styles = StyleSheet.create({
    // slightly lighter, deep blue tone inspired by the login theme
    background: { flex: 1, backgroundColor: '#1b3b6f' },
    container: { flex: 1 },
    header: {
        paddingTop: 40,
        paddingBottom: 6,
        alignItems: 'center',
        marginBottom: 6,
    },
    headerGlass: {
        position: 'absolute',
        left: 8,
        right: 8,
        top: 6,
        bottom: 0,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        zIndex: 1,
    },
    headerInner: { zIndex: 5, width: '100%', alignItems: 'flex-start', paddingHorizontal: 8 },
    headerTitle: { color: '#00F0FF', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
    logoLeft: {
        position: 'absolute',
        left: 12,
        top: 20,
        paddingHorizontal: 10,
        paddingTop: 12,
        paddingBottom: 6,
        borderRadius: 12,
        borderWidth: 1,
        // borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'transparent',
        zIndex: 20,
    },
    logoLeftText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
    postContainer: {
        marginHorizontal: 14,
        marginBottom: 18,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        backgroundColor: 'rgba(0,0,0,0.35)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
    },
    postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    avatarPlaceholder: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#222', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    username: { color: '#fff', fontWeight: '700' },
    postImage: { width: '100%', height: 220, backgroundColor: '#111' },
    actionRow: { flexDirection: 'row', padding: 12, alignItems: 'center' },
    captionContainer: { paddingHorizontal: 12, paddingBottom: 12 },
    captionText: { color: '#ccc', lineHeight: 18 },
});