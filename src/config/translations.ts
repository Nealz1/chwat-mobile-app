interface Translations {
    sidebar: {
        newChat: string;
        searchChats: string;
        today: string;
        archive: string;
        archives: string;
        rename: string;
        delete: string;
        pin: string;
        unpin: string;
        settings: string;
        login: string;
        logout: string;
        cancel: string;
    };
    chat: {
        welcomeMessage: string;
        placeholder: string;
        serverError: string;
        newChat: string;
        copied: string;
        regenerate: string;
    };
    settings: {
        title: string;
        account: string;
        theme: string;
        darkMode: string;
        language: string;
        version: string;
        appName: string;
        logout: string;
        login: string;
        notLoggedIn: string;
    };
    sessions: {
        title: string;
        noSessions: string;
        today: string;
        yesterday: string;
        daysAgo: string;
        pinned: string;
        archived: string;
        active: string;
        search: string;
        deleteConfirm: string;
        archiveConfirm: string;
    };
    common: {
        cancel: string;
        confirm: string;
        delete: string;
        archive: string;
        unarchive: string;
        pin: string;
        unpin: string;
    };
}

export const translations: Record<'en' | 'pl', Translations> = {
    en: {
        sidebar: {
            newChat: "New chat",
            searchChats: "Search chats",
            today: "Today",
            archive: "Archive",
            archives: "Archives",
            rename: "Rename",
            delete: "Delete",
            pin: "Pin",
            unpin: "Unpin",
            settings: "Settings",
            login: "Log in",
            logout: "Log out",
            cancel: "Cancel",
        },
        chat: {
            welcomeMessage: "Hi! I'm the WAT student assistant. How can I help you today?",
            placeholder: "Message WAT Assistant...",
            serverError: "❌ Server error!",
            newChat: "New chat",
            copied: "Copied to clipboard",
            regenerate: "Regenerate response",
        },
        settings: {
            title: "Settings",
            account: "Account",
            theme: "Theme",
            darkMode: "Dark mode",
            language: "Language",
            version: "Version",
            appName: "WAT Helpdesk Mobile",
            logout: "Log out",
            login: "Log in",
            notLoggedIn: "Not logged in",
        },
        sessions: {
            title: "Chat History",
            noSessions: "No saved conversations",
            today: "Today",
            yesterday: "Yesterday",
            daysAgo: "days ago",
            pinned: "Pinned",
            archived: "Archived",
            active: "Active",
            search: "Search conversations...",
            deleteConfirm: "Delete conversation?",
            archiveConfirm: "Archive conversation?",
        },
        login: {
            title: "Login",
            subtitle: "Enter the authorization token from the web app to sync your account.",
            tokenPlaceholder: "Paste token here...",
            loginButton: "Log in",
            skipLogin: "Continue without login",
            tokenHint: "💡 To get a token, log in via USOS on the website and copy the token from account settings.",
            success: "Logged in as",
            error: "Invalid token",
        },
        common: {
            cancel: "Cancel",
            confirm: "Confirm",
            delete: "Delete",
            archive: "Archive",
            unarchive: "Unarchive",
            pin: "Pin",
            unpin: "Unpin",
        },
    },
    pl: {
        sidebar: {
            newChat: "Nowa rozmowa",
            searchChats: "Szukaj rozmów",
            today: "Dziś",
            archive: "Archiwizuj",
            archives: "Archiwa",
            rename: "Zmień nazwę",
            delete: "Usuń",
            pin: "Przypnij",
            unpin: "Odepnij",
            settings: "Ustawienia",
            login: "Zaloguj się",
            logout: "Wyloguj się",
            cancel: "Anuluj",
        },
        chat: {
            welcomeMessage: "Cześć! Jestem asystentem studenckim WAT. Jak mogę Ci pomóc?",
            placeholder: "Wiadomość do Asystenta WAT...",
            serverError: "❌ Błąd serwera!",
            newChat: "Nowy czat",
            copied: "Skopiowano do schowka",
            regenerate: "Wygeneruj ponownie",
        },
        settings: {
            title: "Ustawienia",
            account: "Konto",
            theme: "Motyw",
            darkMode: "Tryb ciemny",
            language: "Język",
            version: "Wersja",
            appName: "WAT Helpdesk Mobile",
            logout: "Wyloguj się",
            login: "Zaloguj się",
            notLoggedIn: "Nie zalogowano",
        },
        sessions: {
            title: "Historia rozmów",
            noSessions: "Brak zapisanych rozmów",
            today: "Dzisiaj",
            yesterday: "Wczoraj",
            daysAgo: "dni temu",
            pinned: "Przypięte",
            archived: "Zarchiwizowane",
            active: "Aktywne",
            search: "Szukaj rozmów...",
            deleteConfirm: "Usunąć rozmowę?",
            archiveConfirm: "Zarchiwizować rozmowę?",
        },
        login: {
            title: "Logowanie",
            subtitle: "Wprowadź token autoryzacyjny z aplikacji webowej, aby zsynchronizować konto.",
            tokenPlaceholder: "Wklej token tutaj...",
            loginButton: "Zaloguj",
            skipLogin: "Kontynuuj bez logowania",
            tokenHint: "💡 Aby uzyskać token, zaloguj się przez USOS na stronie webowej i skopiuj token z ustawień konta.",
            success: "Zalogowano jako",
            error: "Nieprawidłowy token",
        },
        common: {
            cancel: "Anuluj",
            confirm: "Potwierdź",
            delete: "Usuń",
            archive: "Archiwizuj",
            unarchive: "Przywróć",
            pin: "Przypnij",
            unpin: "Odepnij",
        },
    },
};

export type Language = 'en' | 'pl';
export type TranslationsType = Translations;
