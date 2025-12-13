import React from 'react';
import { Image, StyleSheet, View, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const watLogoDark = require('../../assets/wat_logo_dark.png');
const watLogoLight = require('../../assets/wat_logo_light.png');

export function BackgroundLogo() {
    const { isDark } = useTheme();

    return (
        <View style={styles.container} pointerEvents="none">
            <Image
                source={isDark ? watLogoDark : watLogoLight}
                style={styles.logo}
                resizeMode="contain"
            />
        </View>
    );
}

const { width, height } = Dimensions.get('window');
const logoSize = Math.min(width, height) * 0.7;

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    logo: {
        width: logoSize,
        height: logoSize,
        opacity: 0.07,
    },
});
