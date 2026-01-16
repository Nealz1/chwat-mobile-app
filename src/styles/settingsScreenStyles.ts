import { StyleSheet } from 'react-native';

export const settingsScreenStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '500',
    },
    content: {
        padding: 16,
        paddingTop: 0,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    userDetails: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 2,
    },
    userStatus: {
        fontSize: 14,
    },
    notLoggedIn: {
        fontSize: 16,
        marginBottom: 16,
    },
    logoutButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    loginButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    loginText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    settingLabel: {
        fontSize: 16,
    },
    settingValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    aboutRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    aboutLabel: {
        fontSize: 16,
    },
    aboutValue: {
        fontSize: 16,
    },
    inputRow: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 6,
        fontWeight: '500',
    },
    input: {
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    pickerContainer: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    emailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emailInput: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    emailDomain: {
        fontSize: 14,
        marginLeft: 4,
    },
    fullEmailText: {
        fontSize: 15,
        padding: 12,
    },
});
