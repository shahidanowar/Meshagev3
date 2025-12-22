import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
    Text,
    StyleSheet,
    FlatList,
    View,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeModules, NativeEventEmitter } from 'react-native';
import { StorageService } from '../../utils/storage';
import type { Friend } from '../../types';

const { MeshNetwork } = NativeModules;
const MeshNetworkEvents = new NativeEventEmitter(MeshNetwork);

type RootStackParamList = {
    Friends: undefined;
    PersonalChat: {
        friendId: string;
        friendName: string;
        friendAddress?: string;
    };
};

type ChatListNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ChatItem {
    friendId: string;
    name: string;
    friendAddress?: string;
    lastMessage?: {
        text: string;
        timestamp: number;
    };
    unreadCount: number;
}

const ChatListScreen: React.FC = () => {
    const navigation = useNavigation<ChatListNavigationProp>();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [chatPreviews, setChatPreviews] = useState<ChatItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadChats = useCallback(async () => {
        try {
            const loadedFriends = await StorageService.getFriends();
            setFriends(loadedFriends);

            // Build chat previews from friends and their chat history
            const previews: ChatItem[] = await Promise.all(
                loadedFriends.map(async (friend) => {
                    const history = await StorageService.getChatHistory(friend.persistentId);
                    const lastMsg = history.length > 0 ? history[history.length - 1] : undefined;
                    const unreadCount = await StorageService.getUnreadCount(friend.persistentId);

                    return {
                        friendId: friend.persistentId,
                        name: friend.displayName,
                        friendAddress: friend.deviceAddress,
                        lastMessage: lastMsg ? { text: lastMsg.text, timestamp: lastMsg.timestamp } : undefined,
                        unreadCount,
                    };
                })
            );

            // Sort by last message timestamp (most recent first)
            previews.sort((a, b) => {
                const timeA = a.lastMessage?.timestamp || 0;
                const timeB = b.lastMessage?.timestamp || 0;
                return timeB - timeA;
            });

            setChatPreviews(previews);
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Pull to refresh handler
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadChats();
    }, [loadChats]);

    // Reload when screen is focused
    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            loadChats();
        }, [loadChats])
    );

    // Listen for new messages to refresh
    useEffect(() => {
        const listener = MeshNetworkEvents.addListener('onMessageReceived', () => {
            loadChats();
        });
        return () => listener.remove();
    }, [loadChats]);

    // Count number of chats with unread messages
    const chatsWithUnread = useMemo(() => {
        return chatPreviews.filter(chat => chat.unreadCount > 0).length;
    }, [chatPreviews]);

    const handleChatItemPress = async (chat: ChatItem) => {
        // Mark messages as read when opening chat
        await StorageService.setLastReadTimestamp(chat.friendId);

        navigation.navigate('PersonalChat', {
            friendId: chat.friendId,
            friendName: chat.name,
            friendAddress: chat.friendAddress,
        });
    };

    const handleFriendsPageButton = () => {
        navigation.navigate('Friends');
    };

    const formatTime = (timestamp?: number) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (diff < oneDay && date.getDate() === now.getDate()) {
            // Today - show time
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diff < 2 * oneDay && date.getDate() === now.getDate() - 1) {
            // Yesterday
            return 'Yesterday';
        } else {
            // Show date
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const renderChatItem = ({ item }: { item: ChatItem }) => {
        const hasUnread = item.unreadCount > 0;

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => handleChatItemPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                </View>
                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.chatName, hasUnread && styles.chatNameUnread]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.chatTime, hasUnread && styles.chatTimeUnread]}>
                            {formatTime(item.lastMessage?.timestamp)}
                        </Text>
                    </View>
                    <Text
                        style={[styles.chatMessage, hasUnread && styles.chatMessageUnread]}
                        numberOfLines={1}
                    >
                        {item.lastMessage?.text || 'No messages yet'}
                    </Text>
                </View>
                {hasUnread && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                            {item.unreadCount > 9 ? '9+' : item.unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#E5E5E5" />

            <View style={styles.content}>
                <View style={styles.chatsHeader}>
                    <Text style={styles.chatsTitle}>Chats</Text>
                    <View style={styles.unreadContainer}>
                        <Text style={styles.unreadLabel}>New chats</Text>
                        <Text style={styles.unreadCount}>{chatsWithUnread}</Text>
                    </View>
                </View>

                <FlatList
                    data={chatPreviews}
                    renderItem={renderChatItem}
                    keyExtractor={item => item.friendId}
                    style={styles.chatList}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.chatListContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#F59E0B']}
                            tintColor="#F59E0B"
                        />
                    }
                    ListEmptyComponent={
                        isLoading ? (
                            <Text style={styles.emptyText}>Loading chats...</Text>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubbles-outline" size={72} color="#999" />
                                <Text style={styles.emptyTitle}>No conversations yet</Text>
                                <Text style={styles.emptyText}>
                                    Tap the button below to add friends and start chatting!
                                </Text>
                            </View>
                        )
                    }
                />
            </View>

            {/* FAB TO OPEN FRIENDS LIST (v1.0 style) */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleFriendsPageButton}
                activeOpacity={0.8}
            >
                <Ionicons name="people" size={28} color="#000" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E5E5E5',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    chatsHeader: {
        paddingTop: 16,
        paddingBottom: 8,
    },
    chatsTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    unreadContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    unreadLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    unreadCount: {
        fontSize: 10,
        fontWeight: '800',
        backgroundColor: '#F59E0B',
        color: '#000',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        overflow: 'hidden',
    },
    chatList: {
        flex: 1,
    },
    chatListContent: {
        paddingBottom: 100,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    chatInfo: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        flex: 1,
        marginRight: 8,
    },
    chatNameUnread: {
        fontWeight: '700',
    },
    chatTime: {
        fontSize: 12,
        color: '#888',
    },
    chatTimeUnread: {
        color: '#F59E0B',
        fontWeight: '600',
    },
    chatMessage: {
        fontSize: 14,
        color: '#666',
    },
    chatMessageUnread: {
        fontWeight: '600',
        color: '#333',
    },
    unreadBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    unreadBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#000',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 120,
        paddingHorizontal: 32,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
        marginTop: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
    },
    // FAB - v1.0 style
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 14,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
});

export default ChatListScreen;
