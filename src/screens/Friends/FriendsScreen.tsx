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

  const loadFriends = async () => {
    const loadedFriends = await StorageService.getFriends();
    setFriends(loadedFriends);
  };

  // Reload friends when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [])
  );

  // Listen for friend acceptance messages to auto-refresh
  useEffect(() => {
    const onMessageReceivedListener = MeshNetworkEvents.addListener(
      'onMessageReceived',
      async (data: { message: string; fromAddress: string; timestamp: number }) => {
        // If we receive a FRIEND_ACCEPT, reload friends list
        if (data.message.startsWith('FRIEND_ACCEPT:')) {
          console.log('FriendsScreen - Friend accepted, reloading list');
          await loadFriends();
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
          style={styles.messageIcon}
          onPress={() => handleOpenChat(item)}
        >
          <Ionicons name="chatbubble" size={20} color="#666" />
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

        <View style={styles.headerSection}>
          <Text style={styles.title}>Your Friends</Text>
          <Text style={styles.subtitle}>
            Total: <Text style={styles.subtitleCount}>{friends.length}</Text>
          </Text>
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
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>
                Go to the Chats tab and tap "Add Friend" on nearby devices to add them to your friends list.
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
  headerSection: {
    paddingTop: 16,
    paddingBottom: 8,
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
  messageIcon: {
    padding: 8,
  },
  removeButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
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