import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/ChatScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SessionsScreen } from '../screens/SessionsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { GroupsScreen } from '../screens/GroupsScreen';

export type RootStackParamList = {
    Chat: { sessionId?: number } | undefined;
    Sessions: undefined;
    Settings: undefined;
    Login: undefined;
    Groups: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Chat"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#007AFF',
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
                    options={{ title: 'WAT Helpdesk' }}
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
                    name="Settings"
                    component={SettingsScreen}
                    options={{ title: 'Ustawienia' }}
                />
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{
                        title: 'Logowanie',
                        presentation: 'modal'
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
