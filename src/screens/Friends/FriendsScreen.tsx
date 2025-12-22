import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeModules, NativeEventEmitter } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StorageService, Friend } from '../../utils/storage';

const { MeshNetwork } = NativeModules;
const MeshNetworkEvents = new NativeEventEmitter(MeshNetwork);

type RootStackParamList = {
  PersonalChat: {
    friendId: string;
    friendName: string;
    friendAddress?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PersonalChat'>;

const FriendsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [myPersistentId, setMyPersistentId] = useState<string>('');

  const loadFriends = async () => {
    const loadedFriends = await StorageService.getFriends();
    setFriends(loadedFriends);
  };

  // Load persistent ID on mount
  useEffect(() => {
    const loadPersistentId = async () => {
      const id = await StorageService.getPersistentId();
      setMyPersistentId(id);
    };
    loadPersistentId();
  }, []);

  // Reload friends when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [])
  );

  // Listen for friend acceptance and removal messages
  useEffect(() => {
    const onMessageReceivedListener = MeshNetworkEvents.addListener(
      'onMessageReceived',
      async (data: { message: string; fromAddress: string; timestamp: number }) => {
        // If we receive a FRIEND_ACCEPT, reload friends list
        if (data.message.startsWith('FRIEND_ACCEPT:')) {
          console.log('FriendsScreen - Friend accepted, reloading list');
          await loadFriends();
        }
        // If we receive a FRIEND_REMOVE, remove that friend from our list
        if (data.message.startsWith('FRIEND_REMOVE:')) {
          const parts = data.message.split(':');
          if (parts.length === 2) {
            const removedByPersistentId = parts[1];
            console.log('FriendsScreen - Friend removed by:', removedByPersistentId);
            await StorageService.removeFriend(removedByPersistentId);
            await loadFriends();
          }
        }
      }
    );

    return () => {
      onMessageReceivedListener.remove();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.displayName} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Send removal notification to the other device
            const removeMessage = `FRIEND_REMOVE:${myPersistentId}`;
            if (friend.deviceAddress) {
              MeshNetwork.sendMessage(removeMessage, '', friend.deviceAddress);
            }
            // Also broadcast to ensure delivery
            MeshNetwork.sendMessage(removeMessage, '', null);

            // Remove from local storage
            await StorageService.removeFriend(friend.persistentId);
            await loadFriends();
          },
        },
      ]
    );
  };

  const handleOpenChat = (friend: Friend) => {
    navigation.navigate('PersonalChat', {
      friendId: friend.persistentId,
      friendName: friend.displayName,
      friendAddress: friend.deviceAddress,
    });
  };

  // Filter friends by search query
  const filteredFriends = friends.filter(friend =>
    friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <TouchableOpacity
        style={styles.friendInfo}
        onPress={() => handleOpenChat(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color="#666" />
        </View>
        <Text style={styles.friendName}>{item.displayName}</Text>
      </TouchableOpacity>
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.messageIconContainer}
          onPress={() => handleOpenChat(item)}
        >
          <Ionicons name="chatbubble" size={18} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFriend(item)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

        {/* MESHAGE Header */}
        <View style={styles.meshageHeader}>
          <Text style={styles.meshageTitle}>MESHAGE</Text>
        </View>

        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Your Friends</Text>
              <Text style={styles.subtitle}>
                Available : <Text style={styles.subtitleCount}>{friends.length}</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.searchContainer,
            isSearchFocused && styles.searchContainerFocused,
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={isSearchFocused ? '#F59E0B' : '#666'}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by names"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </View>

        <FlatList
          data={filteredFriends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.persistentId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={72} color="#999" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>
                Add friends from the Broadcast screen to start chatting!
              </Text>
            </View>
          }
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 16,
  },
  meshageHeader: {
    backgroundColor: '#000',
    paddingVertical: 12,
    alignItems: 'flex-start',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  meshageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d4af37',
    letterSpacing: 2,
  },
  headerSection: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  subtitleCount: {
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchContainerFocused: {
    backgroundColor: '#FFF',
    borderColor: '#F59E0B',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  listContent: {
    paddingBottom: 100,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
    borderWidth: 0.3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    lineHeight: 22,
  },
});

export default FriendsScreen;