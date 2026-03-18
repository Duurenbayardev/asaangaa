const fs = require("fs");
const path = require("path");

/** Load root .env / .env.local into process.env so file wins over stale shell (e.g. old .103). */
function applyRootEnv() {
  const root = __dirname;
  for (const name of [".env", ".env.local"]) {
    const p = path.join(root, name);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key.startsWith("EXPO_PUBLIC_")) {
        process.env[key] = val;
      }
    }
  }
}

applyRootEnv();

const DEFAULT_API = "http://192.168.0.102:3000";
const appJson = require("./app.json");

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    updates: {
      url: "https://u.expo.dev/e5c5fabf-6d8c-47e9-80b5-c8eaaa762714",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    extra: {
      ...appJson.expo?.extra,
      eas: {
        projectId: "e5c5fabf-6d8c-47e9-80b5-c8eaaa762714",
      },
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API,
      EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY:
        process.env.EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY ?? "",
    },
  },
};
