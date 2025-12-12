import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/ChatScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SessionsScreen } from '../screens/SessionsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { CustomDrawer } from '../components/CustomDrawer';

export type RootStackParamList = {
    Main: undefined;
    Chat: { sessionId?: number } | undefined;
    Sessions: undefined;
    Settings: undefined;
    Login: undefined;
    Groups: undefined;
    Help: undefined;
};

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#a51d22',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{ title: 'Asystent WAT' }}
            />
            <Stack.Screen
                name="Sessions"
                component={SessionsScreen}
                options={{ title: 'Historia' }}
            />
            <Stack.Screen
                name="Groups"
                component={GroupsScreen}
                options={{ title: 'Grupy' }}
            />
            <Stack.Screen
                name="Help"
                component={HelpScreen}
                options={{ title: 'Pomoc' }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Ustawienia' }}
            />
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                    title: 'Logowanie',
                    presentation: 'modal',
                }}
            />
        </Stack.Navigator>
    );
}

export function AppNavigator() {
    return (
        <NavigationContainer>
            <Drawer.Navigator
                drawerContent={(props) => <CustomDrawer {...props} />}
                screenOptions={{
                    headerShown: false,
                    drawerType: 'front',
                    drawerStyle: {
                        width: 280,
                    },
                }}
            >
                <Drawer.Screen name="Main" component={MainStack} />
            </Drawer.Navigator>
        </NavigationContainer>
    );
}
