import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Ensure you have this installed

// Screens
import ChatScreen from '../screens/Chats/ChatScreen';
import FriendsScreen from '../screens/Friends/FriendsScreen'; // Used as a Tab here
import SettingsScreen from '../screens/Settings/SettingsScreen';
import Header from '../components/Header';

export type TabParamList = {
  Chats: undefined;
  Friends: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

/* ---------------------- CUSTOM BOTTOM NAV UI ---------------------- */
function CustomBottomNavigation({ state, navigation }: any) {
  const currentRouteName = state.routes[state.index].name;

  return (
    <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
      <View style={styles.bottomContainer}>
        {state.routes.map((route: any) => {
          const isFocused = route.name === currentRouteName;

          // Map your routes to Icons
          let iconName = 'home';
          if (route.name === 'Chats') iconName = 'chatbubble';
          else if (route.name === 'Friends') iconName = 'people';
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
      {/* If you have a custom Header component, place it here: <Header /> */}
      <Header/>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomBottomNavigation {...props} />}
      >
        <Tab.Screen name="Chats" component={ChatScreen} />
        <Tab.Screen name="Friends" component={FriendsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </View>
  );
};

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000', // Dark theme background
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