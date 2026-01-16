import { StyleSheet, Dimensions } from 'react-native';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.85;

export const sideMenuStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    drawer: {
        width: DRAWER_WIDTH,
        height: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    drawerContent: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 12,
    },
    headerIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 12,
    },
    outlinedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 8,
    },
    buttonIcon: {
        fontSize: 16,
        marginRight: 12,
    },
    outlinedButtonText: {
        fontSize: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 8,
    },
    searchIcon: {
        fontSize: 14,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 15,
    },
    searchPlaceholder: {
        flex: 1,
        fontSize: 15,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    sessionIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    sessionTitle: {
        fontSize: 15,
        flex: 1,
        marginRight: 8,
    },
    chevron: {
        fontSize: 18,
        color: '#888',
    },
    bottomSection: {
        borderTopWidth: 1,
        padding: 12,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    userIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    userName: {
        fontSize: 15,
        flex: 1,
    },
    menuDots: {
        fontSize: 18,
        color: '#888',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    menuItemIcon: {
        fontSize: 16,
        marginRight: 10,
        color: '#888',
    },
    menuItemText: {
        fontSize: 14,
    },
    dropdownMenu: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
    },
    pinnedSession: {
        borderLeftWidth: 2,
        borderLeftColor: '#e67e22',
    },
    actionMenuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionMenuContent: {
        width: '80%',
        borderRadius: 12,
        padding: 16,
        maxWidth: 300,
    },
    actionMenuTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    actionMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    actionMenuIcon: {
        fontSize: 18,
        marginRight: 12,
        width: 24,
        textAlign: 'center',
    },
    actionMenuText: {
        fontSize: 16,
    },
});

export { DRAWER_WIDTH };
