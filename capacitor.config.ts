import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rtmalikian.rhymepad",
  appName: "RhymePad",
  webDir: "dist",
  server: {
    androidScheme: "https"
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false
    }
  }
};

export default config;
