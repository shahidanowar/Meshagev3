import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    FlatList,
    PanResponder,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { FriendRequest } from '../../types';


const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.45;

interface Device {
    id: string;
    name: string;
    isFriend: boolean;
    isConnected: boolean;
}

interface NearbyDevicesModalProps {
    visible: boolean;
    onClose: () => void;
    devices: Device[];
    onMessage: (deviceId: string) => void;
    onAddFriend: (deviceId: string) => void;
    friendRequests?: FriendRequest[];
}

const NearbyDevicesModal: React.FC<NearbyDevicesModalProps> = ({
    visible,
    onClose,
    devices,
    onMessage,
    onAddFriend,
    friendRequests = [],
}) => {
    const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    // Local state for immediate visual feedback
    const [pendingClicks, setPendingClicks] = useState<Set<string>>(new Set());

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                    closeModal();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 65,
                        friction: 11,
                    }).start();
                }
            },
        })
    ).current;
    useEffect(() => {
        if (visible) {
            openModal();
        } else {
            translateY.setValue(MODAL_HEIGHT);
            backdropOpacity.setValue(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    // Clear local pending when friendRequests updates (request was saved)
    useEffect(() => {
        friendRequests.forEach(req => {
            if (req.type === 'outgoing' && pendingClicks.has(req.persistentId)) {
                setPendingClicks(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(req.persistentId);
                    return newSet;
                });
            }
        });
    }, [friendRequests, pendingClicks]);

    // Clear pending clicks ONLY when modal reopens (handles cancelled/removed requests)
    // Don't depend on friendRequests to avoid clearing during normal flow
    useEffect(() => {
        if (visible) {
            // Small delay to ensure friendRequests state has updated
            const timer = setTimeout(() => {
                setPendingClicks(prev => {
                    const newSet = new Set<string>();
                    prev.forEach(deviceId => {
                        // Keep in pending only if there's a matching outgoing request
                        const hasRequest = friendRequests.some(
                            req => req.persistentId === deviceId && req.type === 'outgoing'
                        );
                        if (hasRequest) {
                            newSet.add(deviceId);
                        }
                    });
                    return newSet;
                });
            }, 100); // Small delay to let state settle

            return () => clearTimeout(timer);
        }
    }, [visible]); // Only when modal opens, not on friendRequests changes

    const openModal = () => {
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: MODAL_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    const handleAddFriend = (deviceId: string) => {
        // Add to local pending for immediate feedback
        setPendingClicks(prev => new Set(prev).add(deviceId));

        // Call parent callback (will update friendRequests)
        onAddFriend(deviceId);
    };

    const renderDeviceItem = ({ item }: { item: Device }) => {
        // Check BOTH:
        // 1. Local pending clicks (immediate feedback)
        // 2. Actual friend requests from storage (persistent)
        const hasOutgoingRequest = friendRequests.some(
            req => req.persistentId === item.id && req.type === 'outgoing'
        );
        const hasLocalPending = pendingClicks.has(item.id);
        const isPending = hasOutgoingRequest || hasLocalPending;

        return (
            <View style={styles.deviceItem}>
                <View style={styles.deviceInfo}>
                    <View
                        style={[
                            styles.deviceStatusDot,
                            item.isConnected ? styles.deviceStatusDotConnected : styles.deviceStatusDotDisconnected,
                        ]}
                    />
                    <View style={styles.deviceTextContainer}>
                        <Text style={styles.deviceName}>{item.name}</Text>
                        <Text style={[styles.deviceStatus, isPending && styles.deviceStatusPending]}>
                            {item.isFriend ? 'Friend' : isPending ? 'Request Sent' : 'Not Friend'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        isPending && styles.actionButtonPending
                    ]}
                    onPress={() =>
                        item.isFriend ? onMessage(item.id) : handleAddFriend(item.id)
                    }
                    activeOpacity={0.7}
                    disabled={isPending}
                >
                    <Ionicons
                        name={item.isFriend ? 'chatbubble' : isPending ? 'checkmark-circle' : 'person-add'}
                        size={18}
                        color={isPending ? '#22C55E' : item.isFriend ? '#555151ff' : '#555151ff'}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    const friendsCount = devices.filter((d) => d.isFriend).length;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={closeModal}
        >
            <View style={styles.container}>
                <TouchableWithoutFeedback onPress={closeModal}>
                    <Animated.View
                        style={[
                            styles.backdrop,
                            {
                                opacity: backdropOpacity,
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.modalContent,
                        {
                            transform: [{ translateY }],
                        },
                    ]}
                >
                    <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
                        <View style={styles.dragHandle} />
                    </View>

                    <View style={styles.header}>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.title}>Nearby Devices</Text>
                            <Text style={styles.subtitle}>
                                Available: <Text style={styles.countText}>{friendsCount}</Text> /{' '}
                                {devices.length}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={closeModal}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close" size={28} color="#F59E0B" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={devices}
                        renderItem={renderDeviceItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        height: MODAL_HEIGHT,
        backgroundColor: '#292929',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    dragHandleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    dragHandle: {
        width: 50,
        height: 4,
        backgroundColor: '#ffffffff',
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingBottom: 16,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#E5E1DE',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
    },
    countText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#F59E0B',
    },
    closeButton: {
        padding: 4,
        marginLeft: 12,
    },
    listContent: {
        paddingBottom: 20,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 8,
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    deviceTextContainer: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    deviceStatus: {
        fontSize: 13,
        color: '#666',
    },
    deviceStatusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#000',
        marginRight: 8,
    },
    deviceStatusDotConnected: {
        backgroundColor: '#22C55E',
    },
    deviceStatusDotDisconnected: {
        backgroundColor: '#EF4444',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    },
    deviceStatusPending: {
        color: '#22C55E',
        fontWeight: '600',
    },
    actionButtonPending: {
        opacity: 0.6,
    },
});

export default NearbyDevicesModal;