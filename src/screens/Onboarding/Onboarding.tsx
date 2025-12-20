import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
// Updated imports to include StyleSheet and TouchableOpacity for the new UI
import { TextInput, TouchableOpacity, Text, View, Alert, StyleSheet } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList, RootStackParamList } from "../../navigation/AppNavigator";
import { StorageService } from "../../utils/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Auth">;

const Onboarding = () => {
    // --- Logic Preserved ---
    const [name, setName] = useState('');
    const navigation = useNavigation<NavigationProp>();
    
    const handleConnect = async () => {
        if (!name.trim()) {
            Alert.alert('Name Required', 'Please enter your name to continue');
            return;
        }
        
        // Save username and set onboarding completed or not
        await StorageService.saveUsername(name.trim());
        
        // Navigate to main screen
        navigation.replace("Main");
    };
    
    // --- UI Updated ---
    return (
        <View style={styles.container}>
            <Text style={styles.title}>ENTER YOUR NAME</Text>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>FULL NAME</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                    style={[
                        styles.button,
                        !name.trim() && styles.buttonDisabled,
                    ]}
                    onPress={handleConnect}
                    disabled={!name.trim()}
                >
                    <Text style={styles.buttonText}>CONNECT</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// --- Styles Added ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: 3,
        color: '#737373',
        marginBottom: 40,
    },
    inputContainer: {
        width: '100%',
        maxWidth: 320,
    },
    label: {
        fontSize: 12,
        color: '#737373',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 48,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d4d4d8',
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#262626',
        marginBottom: 16,
    },
    button: {
        width: '100%',
        height: 48,
        borderRadius: 8,
        backgroundColor: '#f59e0b',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 2,
        color: '#000000',
    },
});

export default Onboarding;