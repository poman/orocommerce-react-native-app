const fs = require('fs');
const path = require('path');

/**
 * Dynamic Expo config.
 *
 * Locally  → reads app.json  (real credentials, gitignored)
 * EAS CI   → reads app.json.example (committed) + EAS Secrets via env vars
 */
function getBaseConfig() {
  const localPath = path.resolve(__dirname, 'app.json');
  const examplePath = path.resolve(__dirname, 'app.json.example');

  if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, 'utf-8')).expo;
  }
  if (fs.existsSync(examplePath)) {
    return JSON.parse(fs.readFileSync(examplePath, 'utf-8')).expo;
  }
  throw new Error('Neither app.json nor app.json.example found');
}

module.exports = () => {
  const config = getBaseConfig();

  config.extra = config.extra || {};

  // EAS Secrets override placeholder values
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    config.extra.EXPO_PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID) {
    config.extra.EXPO_PUBLIC_OAUTH_CLIENT_ID = process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID;
  }
  if (process.env.EXPO_PUBLIC_OAUTH_CLIENT_SECRET) {
    config.extra.EXPO_PUBLIC_OAUTH_CLIENT_SECRET = process.env.EXPO_PUBLIC_OAUTH_CLIENT_SECRET;
  }
  if (process.env.EAS_PROJECT_ID) {
    config.extra.eas = config.extra.eas || {};
    config.extra.eas.projectId = process.env.EAS_PROJECT_ID;
  }

  return config;
};
