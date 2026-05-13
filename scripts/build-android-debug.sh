#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_SDK="${ANDROID_HOME:-$ROOT_DIR/.android-sdk}"
GRADLE_HOME="${GRADLE_USER_HOME:-$ROOT_DIR/.gradle-cache}"
JDK21_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"

if [[ -d "$JDK21_HOME" ]]; then
  export JAVA_HOME="$JDK21_HOME"
fi

export ANDROID_HOME="$ANDROID_SDK"
export ANDROID_SDK_ROOT="$ANDROID_SDK"
export GRADLE_USER_HOME="$GRADLE_HOME"

if [[ ! -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]]; then
  echo "Android SDK not found at $ANDROID_HOME." >&2
  echo "Install command-line tools first, then rerun npm run android:debug." >&2
  exit 1
fi

cd "$ROOT_DIR"
npm run build
npx cap sync android

cd "$ROOT_DIR/android"
./gradlew assembleDebug

cd "$ROOT_DIR"
mkdir -p artifacts
cp android/app/build/outputs/apk/debug/app-debug.apk artifacts/rhymepad-debug.apk
ls -lh artifacts/rhymepad-debug.apk
