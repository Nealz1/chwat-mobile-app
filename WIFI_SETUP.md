# 📱 Mobile App WiFi Setup Guide

Quick guide for running the mobile app on a new WiFi network.

## Steps

### 1. Get your PC's local IP
```bash
hostname -I | awk '{print $1}'
```
Note the IP (e.g., `192.168.X.X`)

### 2. Update the mobile app config
Edit: `master-thesis-HELPDESK-mobile-frontend/src/config/constants.ts`
```typescript
export const API_BASE_URL = 'http://YOUR_NEW_IP:8000';
```

### 3. Rebuild the APK
```bash
cd master-thesis-HELPDESK-mobile-frontend/android
./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

### 4. Open firewall port
```bash
sudo ufw allow 8000
```

### 5. Start backend (bind to all interfaces)
```bash
cd master-thesis-HELPDESK/src/backend
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 6. Verify on phone browser
Visit: `http://YOUR_IP:8000/` - should show API status JSON

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Błąd serwera" | Rebuild APK after IP change |
| Connection refused | `sudo ufw allow 8000` |
| Still not working | Phone & PC must be on same WiFi |
