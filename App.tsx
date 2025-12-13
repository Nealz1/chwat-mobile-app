import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

function AppContent() {
  const { isDark } = useTheme();
  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
