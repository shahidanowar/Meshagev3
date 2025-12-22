import React, { useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import {
    TextInput,
    TouchableOpacity,
    Text,
    View,
    Alert,
    StyleSheet,
    Image,
    Dimensions,
    Animated,
    FlatList
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { StorageService } from "../../utils/storage";
import Ionicons from 'react-native-vector-icons/Ionicons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Main">;
const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Welcome to Meshage',
        description: 'Connect with people nearby without internet.',
        image: require('../../../assets/logo.png'),
        icon: null
    },
    {
        id: '2',
        title: 'No Internet? No Problem!',
        description: 'Meshage uses WiFi Direct to create a local mesh network. Chat freely even when the grid is down.',
        image: null,
        icon: 'wifi-outline'
    },
    {
        id: '3',
        title: 'Secure & Private',
        description: 'Your personal chats are end-to-end encrypted. What happens in the mesh, stays in the mesh.',
        image: null,
        icon: 'shield-checkmark-outline'
    },
    {
        id: '4',
        title: 'Get Started',
        description: 'Enter your name to join the network.',
        image: null,
        icon: 'person-add-outline'
    }
];

const Onboarding = () => {
    const [name, setName] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigation = useNavigation<NavigationProp>();
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleConnect = async () => {
        if (!name.trim()) {
            Alert.alert('Name Required', 'Please enter your name to continue');
            return;
        }

        // Save username and set onboarding completed
        await StorageService.saveUsername(name.trim());

        // Navigate to main screen
        navigation.replace("Main");
    };

    const scrollToNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const isInputSlide = index === SLIDES.length - 1;

        return (
            <View style={[styles.slide, { width }]}>
                <View style={styles.imageContainer}>
                    {item.image ? (
                        <Image source={item.image} style={styles.logoImage} resizeMode="contain" />
                    ) : (
                        <View style={styles.iconCircle}>
                            <Ionicons name={item.icon} size={80} color="#f59e0b" />
                        </View>
                    )}
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>

                    {isInputSlide && (
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>DISPLAY NAME</Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                style={styles.input}
                                placeholder="Your Name"
                                placeholderTextColor="#666"
                                maxLength={20}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.connectButton,
                                    !name.trim() && styles.buttonDisabled,
                                ]}
                                onPress={handleConnect}
                                disabled={!name.trim()}
                            >
                                <Text style={styles.connectButtonText}>JOIN NETWORK</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                bounces={false}
                keyExtractor={(item) => item.id}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                })}
                scrollEventThrottle={32}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
                ref={slidesRef}
            />

            {/* Paginator Dots */}
            <View style={styles.paginatorContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [10, 20, 10],
                            extrapolate: 'clamp',
                        });

                        const opacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={i.toString()}
                                style={[styles.dot, { width: dotWidth, opacity }]}
                            />
                        );
                    })}
                </View>

                {currentIndex < SLIDES.length - 1 && (
                    <TouchableOpacity style={styles.nextButton} onPress={scrollToNext}>
                        <Ionicons name="arrow-forward" size={24} color="#000" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    imageContainer: {
        flex: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    logoImage: {
        width: '70%',
        height: '70%',
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    textContainer: {
        flex: 0.5,
        alignItems: 'center',
        width: '100%',
        paddingTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#f59e0b',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 16,
        color: '#a1a1aa',
        textAlign: 'center',
        paddingHorizontal: 30,
        lineHeight: 24,
        marginBottom: 30,
    },
    inputWrapper: {
        width: '100%',
        maxWidth: 320,
        marginTop: 10,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#71717a',
        marginBottom: 8,
        letterSpacing: 1,
    },
    input: {
        width: '100%',
        height: 52,
        borderRadius: 12,
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: '#27272a',
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#fff',
        marginBottom: 20,
    },
    connectButton: {
        width: '100%',
        height: 52,
        borderRadius: 12,
        backgroundColor: '#f59e0b',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#524a3a', // Dimmed amber/brown
        shadowOpacity: 0,
        elevation: 0,
    },
    connectButtonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        color: '#000',
    },
    paginatorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 40,
        paddingBottom: 40,
        position: 'absolute',
        bottom: 0,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#f59e0b',
        marginHorizontal: 4,
    },
    nextButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Onboarding;