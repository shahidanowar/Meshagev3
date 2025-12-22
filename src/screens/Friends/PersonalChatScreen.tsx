import React from 'react';
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
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft, Ban } from 'lucide-react-native';
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
  } = usePersonalChat({ friendId, friendName, friendAddress });

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
          activeOpacity={0.7}
        >
          <Ban size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* CHAT MESSAGES */}
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
});

export default PersonalChatScreen;
