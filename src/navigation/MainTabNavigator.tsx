import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import BroadcastScreen from '../screens/Chats/ChatScreen'; // ChatScreen is now used as Broadcast
import ChatListScreen from '../screens/Chats/ChatListScreen'; // New Chat List with FAB
import SettingsScreen from '../screens/Settings/SettingsScreen';
import Header from '../components/Header';

export type TabParamList = {
  Broadcast: undefined;
  Chat: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

/* ---------------------- CUSTOM BOTTOM NAV UI (v1.0 style) ---------------------- */
function CustomBottomNavigation({ state, navigation }: any) {
  const currentRouteName = state.routes[state.index].name;

  return (
    <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
      <View style={styles.bottomContainer}>
        {state.routes.map((route: any) => {
          const isFocused = route.name === currentRouteName;

          // Map routes to Icons (v1.0 style)
          let iconName = 'home';
          if (route.name === 'Broadcast') iconName = 'radio';
          else if (route.name === 'Chat') iconName = 'chatbubble';
          else if (route.name === 'Settings') iconName = 'settings';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              onPress={onPress}
              style={styles.navItem}
            >
              <View style={isFocused ? styles.activeIndicator : undefined}>
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isFocused ? '#ffa500' : '#666'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export const MainTabNavigator = () => {
  return (
    <View style={styles.mainContainer}>
      <Header />
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomBottomNavigation {...props} />}
      >
        {/* Tab 1: Broadcast - Group chat with all peers (no FAB) */}
        <Tab.Screen name="Broadcast" component={BroadcastScreen} />

        {/* Tab 2: Chat - List of conversations with FAB to open Friends */}
        <Tab.Screen name="Chat" component={ChatListScreen} />

        {/* Tab 3: Settings */}
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </View>
  );
};

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  bottomContainer: {
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 2,
    borderTopWidth: 0,
  },
  bottomSafeArea: {
    backgroundColor: '#1a1a1a',
  },
  navItem: {
    padding: 8,
  },
  activeIndicator: {
    backgroundColor: '#333',
    borderRadius: 20,
    padding: 8,
  },
});
