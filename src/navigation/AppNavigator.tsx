import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StorageService } from '../utils/storage';

// Screens
import Onboarding from '../screens/Onboarding/Onboarding';
import PersonalChatScreen from '../screens/Friends/PersonalChatScreen';
import { MainTabNavigator } from './MainTabNavigator';
import MoreInfoPage from '../screens/Settings/MoreInfoPage';
// Type Definitions
export type RootStackParamList = {
    Onboarding: undefined;
    Main: undefined;
    PersonalChat: {
        friendId: string;
        friendName: string;
        friendAddress?: string;
    };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Main' | null>(null);

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            try {
                const isComplete = await StorageService.isOnboardingComplete();
                setInitialRoute(isComplete ? 'Main' : 'Onboarding');
            } catch (error) {
                console.error('Error checking onboarding:', error);
                setInitialRoute('Onboarding');
            }
        };

        checkOnboardingStatus();
    }, []);

    // Loading State (Dark Theme)
    if (initialRoute === null) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#1c1c1e" />
                <ActivityIndicator size="large" color="#ffa500" />
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#000' } // Global dark background
                }}
            >
                <Stack.Screen name="Onboarding" component={Onboarding} />

                <Stack.Screen name="Main" component={MainTabNavigator} />

                {/* Chat Detail Screen with Slide Animation */}
                <Stack.Screen
                    name="PersonalChat"
                    component={PersonalChatScreen}
                    options={{
                        animation: 'slide_from_right',
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="MoreInfoPage"
                    component={MoreInfoPage}
                    options={{ title: 'More Info' }} // Optional styling
                />
            </Stack.Navigator>
        </>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
});

export default AppNavigator;