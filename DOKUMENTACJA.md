# Dokumentacja Aplikacji Mobilnej WAT HELPDesk

## Spis treści
1. [Przegląd architektury](#przegląd-architektury)
2. [Ekrany aplikacji](#ekrany-aplikacji)
3. [Serwisy API](#serwisy-api)
4. [Hooki niestandardowe](#hooki-niestandardowe)
5. [Kluczowe funkcje](#kluczowe-funkcje)

---

## Przegląd architektury

Aplikacja mobilna zbudowana jest w **React Native** z użyciem **Expo**.

### Struktura katalogów
```
src/
├── components/    # Komponenty wielokrotnego użytku
├── config/        # Konfiguracja (stałe, URL API)
├── contexts/      # Konteksty React (Theme, Language)
├── hooks/         # Hooki niestandardowe
├── navigation/    # Konfiguracja nawigacji
├── screens/       # Ekrany aplikacji
├── services/      # Serwisy API
└── types/         # Definicje TypeScript
```

---

## Ekrany aplikacji

### ChatScreen.tsx (Główny ekran czatu)

**Lokalizacja:** `src/screens/ChatScreen.tsx`

#### Główne funkcje:

| Funkcja | Opis |
|---------|------|
| `handleSend()` | Wysyła wiadomość do API i odbiera odpowiedź bota |
| `handleCopyMessage(text)` | Kopiuje tekst wiadomości do schowka z haptic feedback |
| `handleRegenerateResponse(index)` | Wysyła ponownie zapytanie do API (regeneracja odpowiedzi) |
| `handleFeedback(index, type)` | Wysyła feedback do API (like/dislike) |
| `handleExplain(index)` | Wywołuje API `/explain` do wyjaśnienia decyzji bota |
| `handleSpeak(text)` | Odczytuje tekst na głos (TTS) |
| `handleStartEdit(index, text)` | Rozpoczyna edycję wiadomości |
| `handleSaveEdit(index)` | Zapisuje edytowaną wiadomość i regeneruje odpowiedź |
| `handleNavigateVersion(index, direction)` | Nawiguje między wersjami odpowiedzi |

#### Obsługa klawiatury:
```typescript
// Śledzenie wysokości klawiatury dla pozycjonowania pola input
const [keyboardHeight, setKeyboardHeight] = useState(0);

useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', 
        (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', 
        () => setKeyboardHeight(0)
    );
}, []);

// Pozycjonowanie: bottom: keyboardHeight + offset
```

---

### SideMenu.tsx (Menu boczne)

**Lokalizacja:** `src/components/SideMenu.tsx`

#### Główne funkcje:

| Funkcja | Opis |
|---------|------|
| `handleNewChat()` | Tworzy nową rozmowę i nawiguje do ChatScreen |
| `handleOpenChat(session)` | Otwiera istniejącą sesję czatu |
| `navigateTo(screen)` | Nawiguje do wybranego ekranu |
| `handleSessionLongPress(session)` | Pokazuje modal z opcjami sesji |
| `handleDeleteSession(sessionId)` | Usuwa sesję czatu |
| `handleRenameSession(id, name)` | Zmienia nazwę sesji |
| `onRefresh()` | Pull-to-refresh - odświeża listę sesji z haptic feedback |
| `handleClose()` | **Animowane** zamykanie menu (slide-out) |

#### Animacja menu:
```typescript
// Otwarcie - slide in
Animated.timing(slideAnim, {
    toValue: 0,
    duration: 250,
    useNativeDriver: true,
}).start();

// Zamknięcie - slide out, potem onClose()
Animated.timing(slideAnim, {
    toValue: -DRAWER_WIDTH,
    duration: 200,
}).start(() => onClose());
```

---

### LoginScreen.tsx (Ekran logowania)

**Lokalizacja:** `src/screens/LoginScreen.tsx`

#### Funkcje:

| Funkcja | Opis |
|---------|------|
| `handleOAuthLogin()` | Inicjuje logowanie OAuth przez USOS |

#### Proces logowania OAuth:
1. Pobiera URL autoryzacji z API
2. Otwiera przeglądarkę OAuth (`WebBrowser.openAuthSessionAsync`)
3. Odbiera token z redirect URL
4. Zapisuje token w AsyncStorage

---

### SettingsScreen.tsx (Ustawienia)

**Lokalizacja:** `src/screens/SettingsScreen.tsx`

Zawiera:
- Przełącznik trybu ciemnego/jasnego
- Wybór języka (PL/EN)
- Ustawienia powiadomień
- Informacje o koncie

---

## Serwisy API

### authService.ts

**Lokalizacja:** `src/services/authService.ts`

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `getToken()` | - | Pobiera token z AsyncStorage |
| `setToken(token)` | - | Zapisuje token w AsyncStorage |
| `loginWithOAuth()` | `GET /usos/login` | Inicjuje logowanie OAuth |
| `getCurrentUser()` | `GET /auth/me` | Pobiera dane zalogowanego użytkownika |
| `logout()` | `POST /auth/logout` | Wylogowuje użytkownika |
| `submitFeedback(nodeId, feedback)` | `POST /feedback` | Wysyła feedback (like/dislike) |
| `explainMessage(text)` | `POST /explain` | Pobiera wyjaśnienie odpowiedzi bota |
| `getAccountPreferences()` | `GET /account/preferences` | Pobiera preferencje konta |
| `updateAccountPreferences(prefs)` | `PUT /account/preferences` | Aktualizuje preferencje |

---

### chatService.ts

**Lokalizacja:** `src/services/chatService.ts`

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `sendMessage(message, sessionId?)` | `POST /chat` | Wysyła wiadomość i odbiera odpowiedź |
| `getSessions()` | `GET /sessions` | Pobiera listę sesji użytkownika |
| `getSession(id)` | `GET /sessions/{id}` | Pobiera szczegóły sesji |
| `deleteSession(id)` | `DELETE /sessions/{id}` | Usuwa sesję |
| `renameSession(id, name)` | `PUT /sessions/{id}` | Zmienia nazwę sesji |

---

### groupsService.ts

**Lokalizacja:** `src/services/groupsService.ts`

| Metoda | Opis |
|--------|------|
| `getGroups()` | Pobiera listę grup Usos użytkownika |
| `searchGroups(query, groups)` | Wyszukuje grupy lokalnie według nazwy |

---

## Hooki niestandardowe

### useGroupAutocomplete.ts

**Lokalizacja:** `src/hooks/useGroupAutocomplete.ts`

**Cel:** Autouzupełnianie nazw grup w polu tekstowym po wpisaniu `@`

```typescript
const {
    groupSuggestions,        // Lista pasujących grup
    showGroupAutocomplete,   // Czy pokazać dropdown
    handleInputChange,       // Handler zmiany tekstu
    insertGroupSuggestion,   // Wstawia wybraną grupę do tekstu
} = useGroupAutocomplete();
```

---

## Kluczowe funkcjonalności

### 1. Haptic Feedback

Aplikacja używa `expo-haptics` dla wibracji przy interakcjach:

```typescript
import * as Haptics from 'expo-haptics';

// Przy wysłaniu wiadomości
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Przy kopiowaniu
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Przy pull-to-refresh
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

### 2. Pull-to-Refresh

Menu boczne obsługuje pull-to-refresh dla listy sesji:

```typescript
<ScrollView
    refreshControl={
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
        />
    }
>
```

### 3. Pozycjonowanie input nad klawiaturą

```typescript
// Dynamiczne pozycjonowanie based on keyboard height
bottom: keyboardHeight > 0 ? keyboardHeight : 0,
paddingBottom: keyboardHeight > 0 ? 50 : 35,
```

- `bottom: keyboardHeight` - podnosi input nad klawiaturę
- `paddingBottom: 50` - zapewnia przestrzeń na pasek podpowiedzi klawiatury
- `paddingBottom: 35` - gdy klawiatura zamknięta, wypełnia lukę nad przyciskami nawigacji telefonu

### 4. Wyjaśnienie decyzji (Explain)

```typescript
const handleExplain = async (botMsgIndex) => {
    const botMessage = messages[botMsgIndex];
    const result = await authService.explainMessage(botMessage.text);
    setExplainText(result.explanation);
};
```

Wywołuje endpoint `/explain` z treścią wiadomości bota i wyświetla wyjaśnienie w modalnym oknie.

### 5. Wersjonowanie odpowiedzi

Każda wiadomość może mieć wiele wersji (po regeneracji):

```typescript
interface Message {
    sender: 'user' | 'bot';
    text: string;
    versions?: string[];        // Tablica wszystkich wersji
    currentVersion?: number;    // Indeks aktualnej wersji
}
```

### 6. Tryb ciemny/jasny

Zarządzany przez `ThemeContext`:

```typescript
const { colors, isDark, toggleTheme } = useTheme();

// Kolory dostępne:
colors.background   // Tło główne
colors.surface     // Tło elementów
colors.text        // Tekst główny
colors.textSecondary  // Tekst drugorzędny
colors.primary     // Kolor akcentu (pomarańczowy)
```

### 7. Wielojęzyczność

Zarządzana przez `LanguageContext`:

```typescript
const { t, language, setLanguage } = useLanguage();

// language = 'pl' | 'en'
// t.chat.welcomeMessage - tłumaczenia
```

---

## Konfiguracja

### Stałe (config/constants.ts)

```typescript
export const API_BASE_URL = 'https://your-api.com';

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    CURRENT_SESSION: 'current_session',
    GUEST_MESSAGES: 'guest_messages',
};
```

---

## Typowanie TypeScript

### Główne typy (types/index.ts)

```typescript
interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface ChatSession {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface Message {
    sender: 'user' | 'bot';
    text: string;
    versions?: string[];
    currentVersion?: number;
}
```
