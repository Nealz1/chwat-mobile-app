import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { ChatScreen } from '../screens/ChatScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SessionsScreen } from '../screens/SessionsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { CustomDrawer } from '../components/CustomDrawer';

export type RootStackParamList = {
    Main: undefined;
    Login: undefined;
};

export type DrawerParamList = {
    Chat: { sessionId?: number } | undefined;
    Sessions: undefined;
    Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

function MainDrawer() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawer {...props} />}
            screenOptions={{
                headerShown: true,
                drawerType: 'front',
                drawerStyle: {
                    width: 280,
                },
            }}
        >
            <Drawer.Screen
                name="Chat"
                component={ChatScreen}
                options={{ title: 'Chat' }}
            />
            <Drawer.Screen
                name="Sessions"
                component={SessionsScreen}
                options={{ title: 'Historia' }}
            />
            <Drawer.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Ustawienia' }}
            />
        </Drawer.Navigator>
    );
}

export function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main" component={MainDrawer} />
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ presentation: 'modal' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
