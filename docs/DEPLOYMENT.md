# Deployment Guide

This guide covers deploying the OroCommerce Mobile App using Expo Application Services (EAS).

## Prerequisites

1. **Create an Expo account** at https://expo.dev

2. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

3. **Login to your Expo account:**
   ```bash
   eas login
   ```

4. **Configure your project:**
   
   Run the configuration command to set up EAS Build for your project:
   ```bash
   eas build:configure
   ```
   
   This command will:
   - Create an EAS project and generate a unique **Project ID**
   - Automatically add the Project ID to your `app.json` under `extra.eas.projectId`
   - Create `eas.json` if it doesn't exist
   
   **Important:** After running this command, your `app.json` will be updated with the Project ID. Make sure to copy this ID to `app.json.example` if you're sharing your code, or keep it in your local `app.json` only.

## Build Profiles

The app includes the following build profiles in `eas.json`:

- **development** - Development builds with dev client
- **preview** - Internal testing builds (APK for Android)
- **internal** - Internal distribution (App Bundle for Android)
- **production** - Production builds for app stores
- **production-apk** - Production APK for direct distribution

## Building the App

### Android Production Build

```bash
eas build --profile production --platform android
```

This creates an Android App Bundle (`.aab`) ready for Google Play Store.

### Android APK Build

```bash
eas build --profile production-apk --platform android
```

This creates an APK (`.apk`) file for direct installation.

### iOS Production Build

```bash
eas build --profile production --platform ios
```

This creates an iOS build (`.ipa`) ready for App Store.

### Build Both Platforms

```bash
eas build --profile production --platform all
```

### Clear Cache

Add `--clear-cache` to clear build cache for a fresh build:

```bash
eas build --profile production --platform android --clear-cache
```

## Environment Variables

The app uses a dynamic `app.config.js` that loads configuration at build time:

- **Locally** → reads `app.json` (gitignored, contains your real credentials)
- **EAS CI** → reads `app.json.example` (committed, has placeholders) + **EAS Secrets** override the placeholders via env vars

### Setting Up EAS Secrets (Required for CI Builds)

Store your credentials and project ID as EAS secrets:

```bash
eas secret:create --scope project --name EAS_PROJECT_ID --value "your-eas-project-id"
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://your-orocommerce.com/"
eas secret:create --scope project --name EXPO_PUBLIC_OAUTH_CLIENT_ID --value "your_client_id"
eas secret:create --scope project --name EXPO_PUBLIC_OAUTH_CLIENT_SECRET --value "your_client_secret"
```

Verify secrets are set:

```bash
eas secret:list
```

### Local Development

Copy the example and fill in your real values:

```bash
cp app.json.example app.json
```

Edit `app.json` with your credentials. This file is gitignored — your secrets stay local.

**⚠️ Important:** Never commit `app.json` with real credentials. Only `app.json.example` (with placeholders) belongs in the repo.

## Monitoring Builds

### View Build Progress

The build process will show real-time logs in your terminal.

### List All Builds

```bash
eas build:list
```

### View Specific Build

```bash
eas build:view <BUILD_ID>
```

### Download Build Artifacts

After the build completes, you'll receive a download link for:
- `.aab` or `.apk` file (Android)
- `.ipa` file (iOS)

## Submitting to App Stores

### Google Play Store

1. Build the app:
   ```bash
   eas build --profile production --platform android
   ```

2. Submit to Google Play:
   ```bash
   eas submit --platform android --latest
   ```

### Apple App Store

1. Build the app:
   ```bash
   eas build --profile production --platform ios
   ```

2. Submit to App Store:
   ```bash
   eas submit --platform ios --latest
   ```

## Version Management

### Update Version Number

Update the version in **both** `app.json` and `package.json` — they must stay in sync. If they differ, EAS CLI may read the wrong config and fail with errors like `extra.eas.projectId missing`.

**`app.json`:**

```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    },
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

**`package.json`:**

```json
{
  "version": "1.0.1"
}
```

**Important:**
- `version` - User-visible version — must match in both `app.json` and `package.json`
- `android.versionCode` - Must increment with each Android build
- `ios.buildNumber` - Must increment with each iOS build

## Troubleshooting

### Build Fails with Credential Errors

Ensure environment variables are correctly set:
- Check EAS secrets: `eas secret:list`
- Verify values in `app.json` (for development builds)

### "Module not found" Errors

1. Clear build cache:
   ```bash
   eas build --platform android --clear-cache
   ```
2. Ensure all dependencies are in `package.json`
3. Run `npm install` locally to verify

### Build Takes Too Long

- Check build logs: `eas build:view <BUILD_ID>`
- Use `--clear-cache` only when necessary
- Remove unused dependencies from `package.json`

### Android Build Fails

Common issues:
- Ensure `android.package` is unique in `app.json`
- Verify `android.versionCode` is incremented
- Check if signing credentials are configured

### iOS Build Fails

Common issues:
- Ensure `ios.bundleIdentifier` is unique in `app.json`
- Verify Apple Developer credentials
- Check if provisioning profiles are configured

## Testing Builds

### Install on Android Device

1. Download the APK from the build
2. Transfer to your device
3. Enable "Install from Unknown Sources" in device settings
4. Install the APK

### Install on iOS Device (TestFlight)

1. Submit build to TestFlight:
   ```bash
   eas submit --platform ios --latest
   ```
2. Add testers in App Store Connect
3. Testers receive TestFlight invitation
4. Install via TestFlight app

## Best Practices

1. **Use EAS Secrets** for production credentials
2. **Test builds** before submitting to stores
3. **Increment version numbers** for each release
4. **Tag releases** in git:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
5. **Keep build logs** for debugging
6. **Document changes** in release notes

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Guidelines](https://play.google.com/about/developer-content-policy/)

