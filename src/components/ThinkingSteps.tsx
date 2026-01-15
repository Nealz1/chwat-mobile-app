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
} from 'react-native';

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

interface ThinkingStepsProps {
    data?: ThinkingStepsData;
    isLoading?: boolean;
    currentStep?: string;
}

export const ThinkingSteps = memo(({ data, isLoading = false, currentStep }: ThinkingStepsProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const spinValue = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isLoading) {
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [isLoading, spinValue]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const toggleExpanded = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    if (isLoading) {
        const stepText = currentStep || 'Przetwarzam zapytanie...';
        return (
            <View style={styles.container}>
                <TouchableOpacity style={styles.header} onPress={toggleExpanded} activeOpacity={0.7}>
                    <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
                    <Text style={styles.statusText}>{stepText}</Text>
                    <Text style={[styles.chevron, isExpanded && styles.chevronExpanded]}>▼</Text>
                </TouchableOpacity>
                {isExpanded && (
                    <View style={styles.content}>
                        <View style={styles.dots}>
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                        </View>
                    </View>
                )}
            </View>
        );
    }
    
    if (!data?.steps || data.steps.length <= 1) {
        return null;
    }

    const summaryText = `Myślałem przez ${(data.total_duration_ms / 1000).toFixed(1)}s`;

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={toggleExpanded} activeOpacity={0.7}>
                <View style={styles.doneIcon}>
                    <Text style={styles.doneCheckmark}>✓</Text>
                </View>
                <Text style={styles.statusText}>{summaryText}</Text>
                <Text style={[styles.chevron, isExpanded && styles.chevronExpanded]}>▼</Text>
            </TouchableOpacity>
            {isExpanded && (
                <View style={styles.content}>
                    {data.steps.map((step, index) => (
                        <View key={index} style={styles.stepItem}>
                            <Text style={styles.stepIcon}>{step.title.split(' ')[0]}</Text>
                            <Text style={styles.stepText}>{step.title.replace(/^[^\s]+\s/, '')}</Text>
                            {step.duration_ms > 100 && (
                                <Text style={styles.stepTime}>{Math.round(step.duration_ms)}ms</Text>
                            )}
                        </View>
                    ))}
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
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    spinner: {
        width: 16,
        height: 16,
        borderWidth: 2,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderTopColor: '#8b5cf6',
        borderRadius: 8,
    },
    doneIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneCheckmark: {
        fontSize: 10,
        color: '#10b981',
    },
    statusText: {
        fontWeight: '500',
        fontSize: 14,
        color: '#1f2937',
    },
    chevron: {
        fontSize: 10,
        opacity: 0.6,
        color: '#1f2937',
        marginLeft: 4,
    },
    chevronExpanded: {
        transform: [{ rotate: '180deg' }],
    },
    content: {
        marginTop: 8,
        paddingLeft: 16,
        borderLeftWidth: 2,
        borderLeftColor: 'rgba(139, 92, 246, 0.3)',
        marginLeft: 8,
    },
    dots: {
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 6,
        height: 6,
        backgroundColor: '#8b5cf6',
        borderRadius: 3,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    stepIcon: {
        fontSize: 14,
    },
    stepText: {
        flex: 1,
        fontSize: 13,
        color: '#6b7280',
    },
    stepTime: {
        fontSize: 11,
        color: '#6b7280',
        opacity: 0.7,
    },
});
