#!/bin/bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export ANDROID_HOME=/home/miguel-ciavato/Android/Sdk
export NVM_DIR=/home/miguel-ciavato/.nvm
export PATH="$JAVA_HOME/bin:$NVM_DIR/versions/node/v20.19.4/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

echo "JAVA_HOME=$JAVA_HOME"
echo "Node: $(node --version) -> $(which node)"
echo "NPM:  $(npm --version)"
echo ""

# Redirigir el puerto 8081 del celular a la PC (para conexión USB)
if [ -f "$ANDROID_HOME/platform-tools/adb" ]; then
  echo "Redirigiendo puerto 8081 al celular vía ADB..."
  $ANDROID_HOME/platform-tools/adb reverse tcp:8081 tcp:8081
fi

echo ""
echo "Iniciando Metro Bundler para dev-client..."
npx expo start --dev-client
