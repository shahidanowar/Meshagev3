import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Animated,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    NativeModules,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Send } from 'lucide-react-native'; // Ensure you have lucide-react-native or use Ionicons

// Components and Hooks
import NearbyDevicesModal from './NearbyDevicesModal'; // Ensure this path is correct based on your file structure
import { useChatScreen } from './useChatScreen';
import { StorageService } from '../../utils/storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatScreen = ({ navigation }: any) => {
    // 1. Logic Hook
    const {
        status,
        peers,
        connectedPeers,
        messages,
        messageText,
        messagesEndRef,
        username,
        showPeerModal,
        friendRequests,
        setMessageText,
        setShowPeerModal,
        handleSendMessage,
        handleAddFriend,
        handleAcceptFriendRequest,
        handleRejectFriendRequest,
        isFriend,
    } = useChatScreen();

    // 2. Animation State for Friend Requests Sheet
    const [showRequests, setShowRequests] = useState(false);
    const [requestsVisible, setRequestsVisible] = useState(false);
    const requestsTranslateY = useRef(new Animated.Value(300)).current;
    const requestsBackdropOpacity = useRef(new Animated.Value(0)).current;

    // 3. Prepare Data for NearbyDevicesModal
    const devicesForModal = peers.map((peer: any) => ({
        id: peer.deviceAddress,
        name: peer.displayName || peer.deviceName || 'Unknown',
        isFriend: isFriend(peer.persistentId),
        isConnected: connectedPeers.includes(peer.deviceAddress),
        persistentId: peer.persistentId, // Passing this through for navigation
    }));

    const pendingRequestsCount = friendRequests.filter((r: any) => r.type === 'incoming').length;

    // Simple broadcast status - only show Discovering, CONNECTED, or DISCONNECTED
    const getBroadcastStatus = () => {
        if (connectedPeers.length > 0) {
            return 'CONNECTED';
        }
        if (status.toLowerCase().includes('discover') || status.toLowerCase().includes('initializ')) {
            return 'Discovering...';
        }
        return 'DISCONNECTED';
    };
    const broadcastStatus = getBroadcastStatus();
    const isDiscovering = broadcastStatus === 'Discovering...';

    // Auto-restart discovery when disconnected - ONLY if network is enabled by user
    useEffect(() => {
        const checkAndRestart = async () => {
            if (broadcastStatus === 'DISCONNECTED') {
                const isNetworkEnabled = await StorageService.getNetworkEnabled();

                if (isNetworkEnabled) {
                    console.log('Auto-restarting discovery (network enabled)');
                    const timer = setTimeout(() => {
                        const { MeshNetwork } = NativeModules;
                        MeshNetwork.discoverPeers();
                    }, 2000); // Wait 2 seconds before restarting
                    return () => clearTimeout(timer);
                } else {
                    console.log('Network disabled by user - NOT restarting discovery');
                }
            }
        };

        checkAndRestart();
    }, [broadcastStatus]);

    // 4. Friend Request Animation Logic
    useEffect(() => {
        if (showRequests) {
            setRequestsVisible(true);
            Animated.parallel([
                Animated.spring(requestsTranslateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
                Animated.timing(requestsBackdropOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(requestsTranslateY, {
                    toValue: 300,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(requestsBackdropOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setRequestsVisible(false);
            });
        }
    }, [showRequests]);

    // 5. Handlers
    const handleDevicesPress = () => {
        setShowPeerModal(true);
    };

    const handlePrivateChat = (deviceId: string) => {
        // Find the full peer object
        const peer = peers.find((p: any) => p.deviceAddress === deviceId);
        if (peer && peer.persistentId) {
            setShowPeerModal(false);
            // Navigate to the PersonalChat screen defined in AppNavigator
            navigation.navigate('PersonalChat', {
                friendId: peer.persistentId,
                friendName: peer.displayName || peer.deviceName,
                friendAddress: peer.deviceAddress
            });
        }
    };

    const handleAddFriendWrapper = (deviceId: string) => {
        const peer = peers.find((p: any) => p.deviceAddress === deviceId);
        if (peer) {
            handleAddFriend(peer);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

            {/* --- HEADER --- */}
            <View style={styles.statusBar}>
                <View style={styles.statusLeft}>
                    <Text style={styles.statusLabel}>Broadcast Status: <Text style={styles.statusValue}>{broadcastStatus}</Text></Text>
                    {isDiscovering && (
                        <ActivityIndicator
                            size="small"
                            color="#F59E0B"
                            style={styles.statusLoader}
                        />
                    )}
                </View>

                <View style={styles.statusRight}>
                    {/* Peers Button */}
                    <TouchableOpacity
                        onPress={handleDevicesPress}
                        activeOpacity={0.7}
                        style={styles.statusDotWrapper}
                    >
                        <View style={[
                            styles.statusDot,
                            connectedPeers.length > 0 && styles.statusDotConnected
                        ]} />
                        <Text style={[
                            styles.statusCount,
                            connectedPeers.length > 0 && styles.statusCountConnected
                        ]}>
                            {peers.length}
                        </Text>
                    </TouchableOpacity>

                    {/* Friend Requests Button with Human Icon */}
                    {pendingRequestsCount > 0 && (
                        <TouchableOpacity
                            onPress={() => setShowRequests(true)}
                            activeOpacity={0.7}
                            style={styles.friendRequestButton}
                        >
                            <View style={styles.friendRequestIconContainer}>
                                <Ionicons name="person-add" size={18} color="#000" />
                            </View>
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationText}>
                                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* --- CHAT AREA --- */}
            <KeyboardAvoidingView
                style={styles.flexContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    ref={messagesEndRef}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() =>
                        messagesEndRef.current?.scrollToEnd({ animated: true })
                    }
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {connectedPeers.length > 0
                                    ? 'No messages yet. Start the conversation!'
                                    : 'Waiting for peers to connect...\nDiscovering nearby devices...'}
                            </Text>
                        </View>
                    ) : (
                        messages.map((msg: any) => (
                            <View
                                key={msg.id}
                                style={[
                                    styles.messageRow,
                                    msg.isSent ? styles.sentRow : styles.receivedRow,
                                ]}
                            >
                                {!msg.isSent && <View style={styles.avatar} />}
                                <View style={styles.messageContainer}>
                                    {!msg.isSent && (
                                        <Text style={styles.senderName}>
                                            {msg.senderName || msg.fromAddress || 'Unknown'}
                                        </Text>
                                    )}
                                    <View
                                        style={[
                                            styles.messageBubble,
                                            msg.isSent
                                                ? styles.sentBubble
                                                : styles.receivedBubble,
                                        ]}
                                    >
                                        <Text style={styles.messageText}>{msg.text}</Text>
                                    </View>
                                    <Text style={styles.messageTime}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                {msg.isSent && <View style={styles.avatar} />}
                            </View>
                        ))
                    )}
                </ScrollView>

                {/* --- INPUT BAR --- */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#888"
                        value={messageText}
                        onChangeText={setMessageText}
                        onSubmitEditing={handleSendMessage}
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !messageText.trim() && styles.sendButtonDisabled
                        ]}
                        onPress={handleSendMessage}
                        disabled={!messageText.trim()}
                    >
                        <Send size={20} color="#000" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* --- NEARBY DEVICES MODAL --- */}
            <NearbyDevicesModal
                visible={showPeerModal}
                onClose={() => setShowPeerModal(false)}
                devices={devicesForModal}
                onMessage={handlePrivateChat} // Navigates to PersonalChat
                onAddFriend={handleAddFriendWrapper}
                friendRequests={friendRequests}
            />

            {/* --- FRIEND REQUESTS OVERLAY --- */}
            {requestsVisible && (
                <Animated.View style={[styles.requestsOverlay, { opacity: requestsBackdropOpacity }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        onPress={() => setShowRequests(false)}
                    />
                    <Animated.View style={[styles.requestsCard, { transform: [{ translateY: requestsTranslateY }] }]}>
                        <View style={styles.requestsDragHandleContainer}>
                            <View style={styles.requestsDragHandle} />
                        </View>
                        <View style={styles.requestsHeader}>
                            <View style={styles.requestsHeaderTextContainer}>
                                <Text style={styles.requestsTitle}>
                                    Friend Requests{pendingRequestsCount > 0 ? ` (${pendingRequestsCount})` : ''}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.requestsCloseIcon}
                                onPress={() => setShowRequests(false)}
                            >
                                <Ionicons name="close" size={24} color="#F59E0B" />
                            </TouchableOpacity>
                        </View>

                        {/* List of Requests */}
                        {friendRequests.filter((r: any) => r.type === 'incoming').length === 0 ? (
                            <Text style={styles.requestsEmpty}>No pending requests</Text>
                        ) : (
                            friendRequests
                                .filter((r: any) => r.type === 'incoming')
                                .map((request: any) => (
                                    <View key={request.persistentId} style={styles.requestItem}>
                                        <View style={styles.requestInfo}>
                                            <Text style={styles.requestName}>{request.displayName}</Text>
                                            <Text style={styles.requestId}>
                                                ID · {(request.persistentId || '').substring(0, 8)}...
                                            </Text>
                                        </View>
                                        <View style={styles.requestActions}>
                                            <TouchableOpacity
                                                style={styles.requestAccept}
                                                onPress={() => handleAcceptFriendRequest(request)}
                                            >
                                                <Text style={styles.requestAcceptText}>Accept</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.requestReject}
                                                onPress={() => handleRejectFriendRequest(request)}
                                            >
                                                <Ionicons name="trash" size={16} color="#000" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                        )}
                    </Animated.View>
                </Animated.View>
            )}
        </View>
    );
};

// --- STYLES (Matched to v1.0 BroadcastScreen) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E5E5E5',
    },
    flexContainer: {
        flex: 1,
    },
    // Header - v1.0 style
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    statusLabel: {
        fontSize: 12,
        color: '#000',
        fontWeight: '600',
    },
    statusValue: {
        fontSize: 12,
        color: '#000',
        fontWeight: '700',
        marginLeft: 4,
    },
    statusRight: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    statusLoader: {
        marginLeft: 4,
    },
    statusDotWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#000',
    },
    statusDotConnected: {
        backgroundColor: '#22C55E',
    },
    statusCount: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '700',
    },
    statusCountConnected: {
        color: '#22C55E',
    },
    friendRequestButton: {
        position: 'relative',
        padding: 2,
    },
    friendRequestIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#000',
    },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 1,
        borderColor: '#000',
    },
    notificationText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#000',
    },

    // Chat List
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    sentRow: {
        justifyContent: 'flex-end',
    },
    receivedRow: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#000',
    },
    messageContainer: {
        marginHorizontal: 10,
        maxWidth: '70%',
    },
    senderName: {
        fontSize: 11,
        color: '#666',
        marginBottom: 4,
        marginLeft: 4,
    },
    messageBubble: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#FFF',
    },
    receivedBubble: {
        transform: [{ skewX: '-10deg' }],
    },
    sentBubble: {
        transform: [{ skewX: '10deg' }],
    },
    messageText: {
        color: '#000',
        fontSize: 14,
        transform: [{ skewX: '0deg' }],
    },
    messageTime: {
        fontSize: 10,
        color: '#888',
        marginTop: 4,
        marginLeft: 4,
    },

    // Input
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        backgroundColor: '#E5E5E5',
    },
    input: {
        flex: 1,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 44,
        fontSize: 14,
        color: '#000',
    },
    sendButton: {
        width: 44,
        height: 44,
        marginLeft: 8,
        borderRadius: 22,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#000',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },

    // Friend Requests Bottom Sheet - v1.0 style
    requestsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    requestsCard: {
        width: '100%',
        maxHeight: '45%',
        backgroundColor: '#292929',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderColor: '#000',
    },
    requestsDragHandleContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    requestsDragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
        opacity: 0.9,
    },
    requestsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 8,
    },
    requestsHeaderTextContainer: {
        flex: 1,
    },
    requestsCloseIcon: {
        padding: 4,
        marginLeft: 12,
    },
    requestsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#E5E1DE',
        marginBottom: 4,
    },
    requestsEmpty: {
        fontSize: 13,
        color: '#AAA',
        marginBottom: 12,
    },
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 8,
    },
    requestInfo: {
        flexShrink: 1,
        paddingRight: 8,
    },
    requestName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    requestId: {
        fontSize: 11,
        color: '#666',
    },
    requestActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    requestAccept: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#F59E0B',
        borderWidth: 1,
        borderColor: '#000',
    },
    requestAcceptText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#000',
    },
    requestReject: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#000',
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

export default ChatScreen;