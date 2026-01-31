import React, { useState, memo, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
    Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ThinkingStep {
    type: string;
    title: string;
    detail: string;
    duration_ms: number;
    agent: string | null;
    status: string;
}

interface ThinkingStepsData {
    type: string;
    steps: ThinkingStep[];
    total_duration_ms: number;
}

const STEP_TRANSLATIONS: Record<string, string> = {
    'thinking': 'Analizuję zapytanie...',
    'routing': 'Wybieram odpowiedniego agenta...',
    'tool_use': 'Pobieram niezbędne dane...',
    'formatting': 'Przygotowuję odpowiedź...',
};

const getLocalizedStep = (step: string): string => {
    const lower = step.toLowerCase();
    for (const key in STEP_TRANSLATIONS) {
        if (lower.includes(key)) return STEP_TRANSLATIONS[key];
    }
    if (lower.includes('schedule')) return 'Sprawdzam plan zajęć...';
    if (lower.includes('usos')) return 'Łączę się z USOS...';
    if (lower.includes('weather')) return 'Pobieram prognozę pogody...';
    if (lower.includes('canteen')) return 'Sprawdzam menu stołówki...';
    if (lower.includes('navigation')) return 'Szukam lokalizacji...';

    return step;
};

interface ThinkingStepsProps {
    data?: ThinkingStepsData;
    isLoading?: boolean;
    currentStep?: string;
    colors: {
        text: string;
        textSecondary: string;
        primary: string;
        border: string;
    };
    isDark: boolean;
}

export const ThinkingSteps = memo(({ data, isLoading = false, currentStep, colors, isDark }: ThinkingStepsProps) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const spinValue = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isLoading) {
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinValue.setValue(0);
        }
    }, [isLoading]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const toggleExpanded = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const spinnerColor = isDark ? '#4285f4' : '#4285f4';
    const iconColor = '#4285f4';
    const textColor = colors.textSecondary;
    const secondaryTextColor = colors.textSecondary;

    if (isLoading && (!data?.steps || data.steps.length === 0)) {
        const stepText = currentStep ? getLocalizedStep(currentStep) : 'Myślę...';
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.header}
                    onPress={toggleExpanded}
                    activeOpacity={0.7}
                >
                    <Animated.View style={[
                        styles.spinner,
                        {
                            transform: [{ rotate: spin }],
                            borderColor: 'rgba(66, 133, 244, 0.3)',
                            borderTopColor: spinnerColor
                        }
                    ]} />
                    <Text style={[styles.statusText, { color: textColor }]}>{stepText}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!data?.steps || data.steps.length === 0) {
        return null;
    }

    const steps = data.steps;
    const totalDuration = data.total_duration_ms
        ? (data.total_duration_ms / 1000).toFixed(1) + 's'
        : isLoading ? '...' : '';

    const headerText = isLoading ? 'Myślę...' : `Myślałem przez ${totalDuration}`;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleExpanded}
                activeOpacity={0.7}
            >
                {isLoading ? (
                    <Animated.View style={[
                        styles.spinner,
                        {
                            transform: [{ rotate: spin }],
                            borderColor: 'rgba(66, 133, 244, 0.3)',
                            borderTopColor: spinnerColor
                        }
                    ]} />
                ) : (
                    <MaterialCommunityIcons name="robot" size={18} color={iconColor} />
                )}
                <Text style={[styles.statusText, { color: textColor }]}>{headerText}</Text>
                <Text style={[styles.chevron, { color: secondaryTextColor }, isExpanded && styles.chevronExpanded]}>▼</Text>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.content}>
                    {steps.map((step, index) => {
                        const isLast = index === steps.length - 1;
                        const isActive = isLast && isLoading;

                        return (
                            <View key={index} style={styles.stepItem}>
                                <View style={[
                                    styles.stepDot,
                                    isActive ? styles.stepDotActive : styles.stepDotDone,
                                    isActive && { borderColor: 'rgba(66, 133, 244, 0.5)' }
                                ]}>
                                    {isActive && <View style={[styles.stepDotInner, { backgroundColor: spinnerColor }]} />}
                                </View>
                                <Text style={[
                                    styles.stepText,
                                    { color: secondaryTextColor },
                                    isActive && { color: colors.text, fontWeight: '500' }
                                ]}>
                                    {getLocalizedStep(step.title)}
                                </Text>
                                {step.duration_ms > 0 && !isActive && (
                                    <Text style={[styles.stepTime, { color: secondaryTextColor }]}>
                                        {Math.round(step.duration_ms)}ms
                                    </Text>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    spinner: {
        width: 16,
        height: 16,
        borderWidth: 2,
        borderRadius: 8,
    },
    statusText: {
        fontWeight: '400',
        fontSize: 14,
    },
    chevron: {
        fontSize: 10,
        opacity: 0.6,
        marginLeft: 4,
    },
    chevronExpanded: {
        transform: [{ rotate: '180deg' }],
    },
    content: {
        marginTop: 4,
        paddingLeft: 20,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.1)',
        marginLeft: 20,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    stepDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#d1d5db',
    },
    stepDotActive: {
        backgroundColor: 'transparent',
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 2,
    },
    stepDotDone: {
        backgroundColor: '#34a853',
    },
    stepDotInner: {
        flex: 1,
        borderRadius: 2,
        margin: 1,
    },
    stepText: {
        flex: 1,
        fontSize: 13,
    },
    stepTime: {
        fontSize: 11,
        opacity: 0.6,
    },
});
