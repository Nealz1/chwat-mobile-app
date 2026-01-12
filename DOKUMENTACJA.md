# WAT Helpdesk Mobile - Dokumentacja Projektu

Aplikacja mobilna React Native (Expo) dla asystenta studenckiego WAT.

**Wersja:** 1.0.0  
**Framework:** React Native 0.81.5 + Expo SDK 54  
**Język:** TypeScript 5.9  
**Backend API:** FastAPI (Python)  
**Łączna liczba linii kodu:** ~7400

---

## Instalacja i uruchomienie

### Wymagania
- Node.js 18+
- npm lub yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go na telefonie (Android/iOS)

### Instalacja
```bash
cd frontend-mobile
npm install
```

### Uruchomienie (Development)
```bash
# Standardowe uruchomienie
npm start
# lub
npx expo start

# Z tunelem (dla połączenia przez internet)
npx expo start --tunnel

# Wyczyść cache i uruchom
npx expo start --clear

# Na konkretnej platformie
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

### Konfiguracja API
Przed uruchomieniem ustaw adres backendu w `src/config/constants.ts`:
```typescript
export const API_BASE_URL = 'http://TWOJ_ADRES_IP:8000';
```

---

## Plik główny: `App.tsx` (32 linie)

Główny punkt wejścia aplikacji - konfiguruje providery i nawigację.

**Struktura:**
```tsx
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
    <ThemeProvider>           {/* Provider motywu (ciemny/jasny) */}
      <LanguageProvider>      {/* Provider języka (PL/EN) */}
        <AppContent />        {/* Główna zawartość z nawigacją */}
      </LanguageProvider>
    </ThemeProvider>
  );
}
```

**Hierarchia providerów:**
1. `ThemeProvider` - zarządza motywem (ciemny/jasny), persystuje do AsyncStorage
2. `LanguageProvider` - zarządza językiem (PL/EN), persystuje do AsyncStorage
3. `AppNavigator` - React Navigation ze wszystkimi ekranami

---

## Zależności (package.json)

### Główne biblioteki
| Pakiet | Wersja | Opis |
|--------|--------|------|
| `expo` | 54.0.31 | Framework React Native |
| `react-native` | 0.81.5 | Silnik mobilny |
| `@react-navigation/native` | 7.1.25 | Nawigacja między ekranami |
| `@react-navigation/native-stack` | 7.8.6 | Stack navigator |

### Expo SDK
| Pakiet | Opis |
|--------|------|
| `expo-av` | Nagrywanie i odtwarzanie audio |
| `expo-image-picker` | Wybór zdjęć z galerii/kamery |
| `expo-document-picker` | Wybór plików |
| `expo-haptics` | Wibracje dotykowe |
| `expo-clipboard` | Kopiowanie do schowka |
| `expo-speech` | Text-to-Speech |
| `expo-file-system` | Operacje na plikach |
| `expo-sharing` | Udostępnianie plików |
| `expo-web-browser` | OAuth w przeglądarce |
| `expo-linking` | Deep linking |

### UI i Storage
| Pakiet | Opis |
|--------|------|
| `@expo/vector-icons` | Ionicons, FontAwesome, etc. |
| `@react-native-async-storage/async-storage` | Lokalne przechowywanie danych |
| `react-native-markdown-display` | Renderowanie Markdown |
| `react-native-gesture-handler` | Obsługa gestów |
| `react-native-reanimated` | Animacje |

---

## Struktura projektu

```
frontend-mobile/
├── App.tsx                    # Główny punkt wejścia
├── index.ts                   # Rejestracja Expo
├── package.json               # Zależności
├── app.json                   # Konfiguracja Expo
├── tsconfig.json              # Konfiguracja TypeScript
├── assets/                    # Obrazy, ikony, fonty
│   ├── wat_logo_dark.png
│   └── wat_logo_light.png
└── src/
    ├── components/            # Komponenty UI (5 plików)
    ├── screens/               # Ekrany aplikacji (8 plików)
    ├── services/              # Serwisy API (5 plików)
    ├── contexts/              # Providery React (2 pliki)
    ├── hooks/                 # Custom hooks (3 pliki)
    ├── navigation/            # React Navigation (1 plik)
    ├── types/                 # Typy TypeScript (1 plik)
    ├── utils/                 # Funkcje pomocnicze (3 pliki)
    └── config/                # Konfiguracja (5 plików)
```

---



## Katalog: `components/`

Komponenty wielokrotnego użytku interfejsu użytkownika.

### `BackgroundLogo.tsx` (41 linii)
Wyświetla przezroczyste logo WAT jako watermark w tle ekranu czatu.

**Funkcjonalność:**
- Automatyczne przełączanie między `wat_logo_dark.png` i `wat_logo_light.png` w zależności od motywu
- Responsywny rozmiar (70% mniejszego wymiaru ekranu)
- Opacity 7% dla subtelnego efektu

**Kod:**
```tsx
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
```

---

### `ChatInput.tsx` (264 linie)
Kompleksowy komponent pola wprowadzania wiadomości.

**Funkcjonalność:**
- Pole tekstowe z dynamiczną wysokością
- Przycisk wysyłania / anulowania (podczas ładowania)
- Przycisk nagrywania głosu z wizualnym wskaźnikiem
- Przycisk załączników (+)
- Podgląd miniaturki obrazu dla załączonych zdjęć
- Ikona dokumentu dla innych typów plików
- Dropdown autouzupełniania grup (WCY)

**Kod - podgląd załącznika:**
```tsx
{attachedFile && (
    <View style={[styles.attachedFileRow, { backgroundColor: colors.background }]}>
        {/* Miniaturka dla obrazów, ikona dla innych plików */}
        {attachedFile.mimeType?.startsWith('image/') ? (
            <Image
                source={{ uri: attachedFile.uri }}
                style={styles.attachedThumbnail}
            />
        ) : (
            <Ionicons name="document-attach-outline" size={20} color={colors.textSecondary} />
        )}
        <Text numberOfLines={1}>{attachedFile.name}</Text>
        <TouchableOpacity onPress={onRemoveAttachment}>
            <Ionicons name="close-circle" size={22} color={colors.error} />
        </TouchableOpacity>
    </View>
)}
```

---

### `CustomDrawer.tsx` (400 linii)
Alternatywna zawartość szuflady nawigacyjnej (legacy).

**Funkcjonalność:**
- Lista sesji z pull-to-refresh
- Przycisk nowego czatu
- Nawigacja do ekranów
- Obsługa użytkownika zalogowanego i gościa

---

### `MessageItem.tsx` (236 linii)
Renderuje pojedynczą wiadomość w czacie.

**Funkcjonalność:**
- Rozróżnienie stylu user/bot
- Renderowanie Markdown (linki, bold, listy, kod)
- Wskaźnik ładowania (skeleton)
- Pasek akcji dla wiadomości bota:
  - 📋 Kopiuj | ✏️ Edytuj | 🔄 Regeneruj | 🔊 TTS | 💡 Wyjaśnij | 👍👎 Feedback
- Nawigacja wersji wiadomości (< 1/3 >)

**Kod - pasek akcji:**
```tsx
{item.sender === 'bot' && !item.isLoading && (
    <View style={styles.messageActions}>
        <TouchableOpacity onPress={() => onCopy(item.text)}>
            <Ionicons name="copy-outline" size={18} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onRegenerate(index)}>
            <Ionicons name="refresh-outline" size={18} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSpeak(item.text)}>
            <Ionicons name="volume-medium-outline" size={18} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onExplain(index)}>
            <Ionicons name="bulb-outline" size={18} />
        </TouchableOpacity>
        {item.nodeId && (
            <>
                <TouchableOpacity onPress={() => onFeedback(item.nodeId!, 'positive')}>
                    <Ionicons name="thumbs-up-outline" size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onFeedback(item.nodeId!, 'negative')}>
                    <Ionicons name="thumbs-down-outline" size={18} />
                </TouchableOpacity>
            </>
        )}
    </View>
)}
```

---

### `SideMenu.tsx` (749 linii)
Główne menu boczne aplikacji - najbardziej rozbudowany komponent UI.

**Funkcjonalność:**
- Animowane wysuwanie (Animated API)
- Lista sesji pogrupowana według daty (Dziś, Wczoraj, Starsze)
- Oznaczenie przypiętych sesji ⭐
- Wyszukiwanie sesji
- Pull-to-refresh
- Long-press menu akcji: Zmień nazwę, Przypnij, Archiwizuj, Przenieś do grupy, Eksportuj, Usuń
- Nawigacja: Nowy czat, Szukaj, Historia, Grupy, Archiwa, Ustawienia

**Kod - animowane wysuwanie:**
```tsx
const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

useEffect(() => {
    Animated.timing(slideAnim, {
        toValue: visible ? 0 : -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
    }).start();
}, [visible]);
```

**Kod - long-press na sesji:**
```tsx
const handleSessionLongPress = (session: ChatSession) => {
    setSelectedSession(session);
    Alert.alert(session.title, 'Wybierz akcję', [
        { text: 'Zmień nazwę', onPress: handleRenameSession },
        { text: session.is_pinned ? 'Odepnij' : 'Przypnij', onPress: handlePinSession },
        { text: 'Archiwizuj', onPress: handleArchiveSession },
        { text: 'Przenieś do grupy', onPress: handleMoveToGroupOpen },
        { text: 'Eksportuj', onPress: handleExportSession },
        { text: 'Usuń', onPress: handleDeleteSession, style: 'destructive' },
        { text: 'Anuluj', style: 'cancel' },
    ]);
};
```

---

## Katalog: `screens/`

Ekrany aplikacji (widoki główne).

### `ChatScreen.tsx` (1060 linii)
**Główny i najważniejszy ekran aplikacji** - interfejs czatu.

**Funkcjonalność:**
- Wysyłanie i odbieranie wiadomości
- Nagrywanie głosu (expo-av) z transkrypcją
- Załączniki obrazów (Kamera/Galeria/Pliki)
- Zapisywanie wersji roboczej (draft)
- Drzewo wiadomości z wersjami
- Modal "Wyjaśnij decyzję" - metryki AI
- Autouzupełnianie grup studenckich (WCY...)

**Kod - wysyłanie wiadomości:**
```tsx
const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const messageText = inputText.trim();
    const currentAttachment = attachedFile;

    setMessages(prev => [...prev, { sender: 'user', text: messageText }]);
    setInputText('');
    setAttachedFile(null);
    setIsLoading(true);
    setMessages(prev => [...prev, { sender: 'bot', text: '', isLoading: true }]);

    try {
        let response;
        if (user) {
            if (currentAttachment?.mimeType?.startsWith('image/')) {
                response = await chatService.sendMessageWithImage(
                    messageText, currentAttachment.uri, currentAttachment.mimeType, currentSessionId
                );
            } else {
                response = await chatService.sendMessage(messageText, currentSessionId);
            }
            setCurrentSessionId(response.session_id);
        } else {
            response = await chatService.sendGuestMessage(messageText);
        }
        setMessages(prev => [...prev.slice(0, -1), { sender: 'bot', text: response.response }]);
    } catch (error) {
        setMessages(prev => [...prev.slice(0, -1), { sender: 'bot', text: '❌ Błąd serwera!' }]);
    } finally {
        setIsLoading(false);
    }
}, [inputText, isLoading, user, currentSessionId, attachedFile]);
```

**Kod - nagrywanie głosu:**
```tsx
const handleVoiceRecord = useCallback(async () => {
    if (isRecording) {
        setIsRecording(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await recordingRef.current?.stopAndUnloadAsync();
        const uri = recordingRef.current?.getURI();
        if (uri) {
            const transcribedText = await SpeechService.transcribe(uri);
            if (transcribedText) setInputText(prev => prev + transcribedText);
        }
    } else {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Brak uprawnień', 'Wymagany dostęp do mikrofonu');
            return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        recordingRef.current = recording;
        setIsRecording(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
}, [isRecording]);
```

---

### `LoginScreen.tsx` (159 linii)
Ekran logowania przez token JWT.

**Funkcjonalność:**
- Instrukcja uzyskania tokena
- Pole wprowadzania tokena
- Walidacja przez API `/auth/me`
- Przycisk "Kontynuuj bez logowania"

**Kod:**
```tsx
const handleLogin = async () => {
    if (!token.trim()) return;
    setIsLoading(true);
    try {
        await authService.setToken(token.trim());
        const user = await authService.getCurrentUser();
        if (user) {
            Alert.alert('Sukces', `Zalogowano jako ${user.first_name} ${user.last_name}`);
            navigation.navigate('Chat');
        } else {
            await authService.removeToken();
            Alert.alert('Błąd', 'Nieprawidłowy token');
        }
    } finally {
        setIsLoading(false);
    }
};
```

---

### `SettingsScreen.tsx` (677 linii)
Ekran ustawień użytkownika - rozbudowany.

**Funkcjonalność:**
- Sekcja konta (imię, email, status)
- Przełącznik trybu ciemnego/jasnego
- Wybór języka (PL/EN)
- Zarządzanie preferencjami
- Eksport ustawień na serwer
- Przycisk wylogowania
- Wersja aplikacji

**Kod - przełącznik motywu:**
```tsx
<View style={styles.settingRow}>
    <Text style={[styles.settingLabel, { color: colors.text }]}>Tryb ciemny</Text>
    <Switch
        value={isDark}
        onValueChange={toggleTheme}
        trackColor={{ false: colors.border, true: colors.primary }}
    />
</View>
```

---

### `SessionsScreen.tsx` (541 linii)
Lista historii rozmów.

**Funkcjonalność:**
- Wyświetlanie wszystkich aktywnych sesji
- Grupowanie według daty
- Wyszukiwanie i filtrowanie
- Akcje na sesjach (przypnij, archiwizuj, usuń)
- Pull-to-refresh

---

### `SearchScreen.tsx` (298 linii)
Wyszukiwanie w rozmowach.

**Funkcjonalność:**
- Pole wyszukiwania z debounce (500ms)
- Wyszukiwanie w tytułach i treści wiadomości
- Podświetlanie dopasowań
- Kliknięcie otwiera konkretną sesję

**Kod - debounced search:**
```tsx
useEffect(() => {
    const timer = setTimeout(() => performSearch(searchQuery), 500);
    return () => clearTimeout(timer);
}, [searchQuery]);

const performSearch = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
        const messageResults = await chatService.searchInMessages(sessions, query);
        const titleResults = sessions
            .filter(s => s.title.toLowerCase().includes(query.toLowerCase()))
            .filter(s => !messageResults.some(r => r.sessionId === s.id))
            .map(s => ({ sessionId: s.id, sessionTitle: s.title, matchedMessage: '', updatedAt: s.updated_at }));
        setSearchResults([...messageResults, ...titleResults]);
    } finally {
        setIsSearching(false);
    }
};
```

---

### `ArchivesScreen.tsx` (194 linie)
Zarządzanie zarchiwizowanymi rozmowami.

**Funkcjonalność:**
- Lista zarchiwizowanych sesji
- Przywracanie sesji (unarchive)
- Trwałe usuwanie
- Empty state

---

### `GroupsScreen.tsx` (402 linie)
Zarządzanie grupami rozmów.

**Funkcjonalność:**
- Lista grup z liczbą sesji
- Tworzenie nowej grupy
- Zmiana nazwy grupy
- Usuwanie grupy
- Przypisywanie sesji do grup

---

### `HelpScreen.tsx` (209 linii)
Ekran pomocy i możliwości asystenta.

**Funkcjonalność:**
- Lista kategorii pomocy
- Przykładowe pytania
- Opisy funkcji asystenta

---

## Katalog: `services/`

Serwisy komunikacji z API backendowym.

### `authService.ts` (176 linii)
Zarządzanie uwierzytelnianiem.

**Metody:**
- `getToken()` / `setToken()` / `removeToken()` - JWT w AsyncStorage
- `loginWithOAuth()` - OAuth przez USOS
- `getCurrentUser()` - pobiera `/auth/me`
- `logout()` - wylogowanie
- `getAuthHeaders()` - nagłówki Authorization
- `submitFeedback()` - feedback do `/feedback`
- `explainMessage()` - `/explain` dla AI

**Kod:**
```tsx
async getCurrentUser(): Promise<User | null> {
    const token = await this.getToken();
    if (!token) return null;
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) { await this.removeToken(); return null; }
        return (await response.json()).user;
    } catch { return null; }
}
```

---

### `chatService.ts` (422 linie)
Główny serwis obsługi czatu.

**Metody:**
- `getSessions()`, `getSessionMessages()`
- `sendMessage()` - wiadomość tekstowa (JSON)
- `sendMessageWithImage()` - z obrazem (FormData)
- `sendGuestMessage()` - streaming dla gościa
- `deleteSession()`, `updateSessionTitle()`
- `archiveSession()`, `unarchiveSession()`
- `pinSession()`, `moveToGroup()`
- `getConversationTree()`, `regenerateResponse()`, `editMessage()`
- `searchInMessages()`

**Kod - wysyłanie z obrazem:**
```tsx
async sendMessageWithImage(message: string, imageUri: string, mimeType: string, sessionId?: number) {
    const headers = await authService.getAuthHeaders();
    delete headers['Content-Type'];

    const formData = new FormData();
    formData.append('message', message);
    if (sessionId) formData.append('session_id', String(sessionId));
    formData.append('file', {
        uri: imageUri,
        type: mimeType,
        name: imageUri.split('/').pop() || `image_${Date.now()}.jpg`,
    } as any);

    const response = await fetch(`${API_BASE_URL}/chat`, { method: 'POST', headers, body: formData });
    return await response.json();
}
```

---

### `groupsService.ts` (141 linii)
CRUD dla grup rozmów.

**Metody:** `getGroups()`, `createGroup()`, `renameGroup()`, `deleteGroup()`, `searchGroups()`

---

### `speechService.ts` (62 linie)
Usługi głosowe (STT/TTS).

**Kod - transkrypcja:**
```tsx
static async transcribe(audioUri: string): Promise<string> {
    const extension = audioUri.split('.').pop()?.toLowerCase() || 'm4a';
    const mimeTypes = { 'm4a': 'audio/m4a', 'mp4': 'audio/mp4', 'wav': 'audio/wav' };
    
    const formData = new FormData();
    formData.append('file', {
        uri: audioUri,
        type: mimeTypes[extension] || 'audio/m4a',
        name: `recording.${extension}`,
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/speech/transcribe`, { method: 'POST', body: formData });
    const data = await response.json();
    return data.text || '';
}
```

---

### `streamingService.ts` (189 linii)
Obsługa Server-Sent Events dla streaming odpowiedzi.

---

## Katalog: `contexts/`

### `ThemeContext.tsx` (99 linii)
Provider motywu aplikacji.

**Kolory:**
- Light: białe tło, ciemny tekst
- Dark: `#242424` tło, biały tekst
- Akcent: `#e67e22` (pomarańczowy)

**Hook:** `useTheme()` → `{ isDark, colors, toggleTheme }`

---

### `LanguageContext.tsx` (67 linii)
Provider języka aplikacji.

**Języki:** Polski (pl), English (en)

**Hook:** `useLanguage()` → `{ language, setLanguage, t }`

---

## Katalog: `hooks/`

### `useGroupAutocomplete.ts` (84 linie)
Autouzupełnianie grup studenckich - wykrywa wzorzec "WCY".

### `useMessageTree.ts` (165 linii)
Nawigacja po drzewie wersji wiadomości.

### `useTheme.ts` (85 linii)
Alternatywny hook motywu.

---

## Katalog: `navigation/`

### `AppNavigator.tsx` (97 linii)
Konfiguracja React Navigation.

**Ekrany:** Chat, Settings, Sessions, Search, Login, Groups, Archives, Help

---

## Katalog: `types/`

### `index.ts` (47 linii)
```typescript
interface Message {
    sender: "user" | "bot";
    text: string;
    nodeId?: number;
    siblingCount?: number;
    currentIndex?: number;
    isLoading?: boolean;
    feedback?: string | null;
}

interface User {
    id: string;
    first_name: string;
    last_name: string;
    student_status: number;
    staff_status: number;
}

interface ChatSession {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
    is_pinned?: boolean;
}
```

---

## Katalog: `utils/`

### `dateUtils.ts` (44 linie)
`formatRelativeDate()`, `formatTime()`, `isToday()`, `isWithinDays()`

### `messageParser.ts` (125 linii)
Parsowanie Markdown, ekstrakcja linków.

### `sessionHelpers.ts` (84 linie)
Grupowanie i sortowanie sesji.

---

## Katalog: `config/`

### `constants.ts` (17 linii)
```typescript
export const API_BASE_URL = 'http://10.70.147.127:8000';
export const STORAGE_KEYS = { DARK_MODE, AUTH_TOKEN, LANGUAGE, CURRENT_SESSION, DRAFT_MESSAGE, GUEST_MESSAGES };
```

### `translations.ts` (143 linie)
Tłumaczenia PL/EN (sidebar, chat, settings, sessions, login, common)

### `errorCodes.ts` (13 linii)
Mapowanie błędów.

### `helpCapabilities.ts` (55 linii)
Lista możliwości asystenta.

### `messageConstants.ts` (24 linie)
Domyślne wiadomości.

---

## Pliki główne

### `App.tsx`
```tsx
export default function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <AppNavigator />
            </LanguageProvider>
        </ThemeProvider>
    );
}
```
