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
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || "https://asaangaa.onrender.com",
      EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY ?? "",
    },
  },
};
