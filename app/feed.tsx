import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
            <View style={[styles.container, { paddingBottom: 70 }]}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>OVERRIDE FEED</Text>
                </View>

                <FlatList
                    data={posts}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                />
            </View>
            <BottomNav />
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505' },
    header: {
        paddingTop: 50,
        paddingBottom: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
        alignItems: 'center',
    },
    headerTitle: { color: '#00F0FF', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
    postContainer: { marginBottom: 20 },
    postHeader: { flexDirection: 'row', alignItems: 'center', padding: 10 },
    avatarPlaceholder: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#333', marginRight: 10 },
    username: { color: 'white', fontWeight: 'bold' },
    postImage: { width: Dimensions.get('window').width, height: 400 },
    actionRow: { flexDirection: 'row', padding: 10 },
    captionContainer: { paddingHorizontal: 10 },
    captionText: { color: '#ccc', lineHeight: 18 },
});