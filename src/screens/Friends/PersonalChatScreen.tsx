import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft, UserX } from 'lucide-react-native';
import { usePersonalChat } from './usePersonalChat';
import type { Message } from '../../types';

type RouteParams = {
  PersonalChat: {
    friendId: string;
    friendName: string;
    friendAddress?: string;
  };
};

const PersonalChatScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'PersonalChat'>>();
  const navigation = useNavigation();
  const { friendId, friendName, friendAddress } = route.params;

  const {
    messages,
    messageText,
    isConnected,
    messagesEndRef,
    setMessageText,
    handleSendMessage,
    handleUnfriend,
  } = usePersonalChat({ friendId, friendName, friendAddress });

  const [showUnfriendModal, setShowUnfriendModal] = useState(false);

  const confirmUnfriend = async () => {
    const success = await handleUnfriend();
    setShowUnfriendModal(false);

    if (success) {
      // Navigate back to Friends screen
      navigation.goBack();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageRow,
        item.isSent ? styles.sentRow : styles.receivedRow,
      ]}>
      <View
        style={[
          styles.messageBubble,
          item.isSent ? styles.sentBubble : styles.receivedBubble,
        ]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{friendName}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowUnfriendModal(true)}
          activeOpacity={0.7}
        >
          <UserX size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* CHAT MESSAGES */}
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <FlatList
          ref={messagesEndRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No messages yet. Start chatting with {friendName}!
              </Text>
            </View>
          }
          onContentSizeChange={() =>
            messagesEndRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* INPUT BAR */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter your message"
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
            activeOpacity={0.7}>
            <Send size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* UNFRIEND CONFIRMATION MODAL */}
      <Modal
        visible={showUnfriendModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnfriendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <UserX size={32} color="#FF3B30" />
              <Text style={styles.modalTitle}>Remove Friend</Text>
            </View>

            <Text style={styles.modalMessage}>
              Are you sure you want to remove {friendName} from your friend list?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUnfriendModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.unfriendButton]}
                onPress={confirmUnfriend}
                activeOpacity={0.7}
              >
                <Text style={styles.unfriendButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  headerButton: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  flexContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#E5E5E5',
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sentRow: {
    justifyContent: 'flex-end',
  },
  receivedRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    maxWidth: '75%',
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#FFF',
  },
  receivedBubble: {
    transform: [{ skewX: '-8deg' }],
  },
  sentBubble: {
    transform: [{ skewX: '8deg' }],
  },
  messageText: {
    color: '#000',
    fontSize: 15,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292929',
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    gap: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 50,
    fontSize: 15,
    color: '#000',
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#000',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  unfriendButton: {
    backgroundColor: '#FF3B30',
  },
  unfriendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default PersonalChatScreen;
