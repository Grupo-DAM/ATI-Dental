#!/bin/bash
# Limpiar variables de entorno que causan problemas en la configuración de CMake
unset MAKEFLAGS
unset CMAKE_BUILD_PARALLEL_LEVEL

export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export ANDROID_HOME=/home/miguel-ciavato/Android/Sdk
export NVM_DIR=/home/miguel-ciavato/.nvm
export PATH="$JAVA_HOME/bin:$NVM_DIR/versions/node/v20.19.4/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

echo "JAVA_HOME=$JAVA_HOME"
java --version
echo ""
echo "Node: $(node --version) -> $(which node)"
echo "NPM:  $(npm --version)"
echo ""

cd /home/miguel-ciavato/Documents/github-repos/ati-dental-mobile/android

echo "Deteniendo daemons de Gradle..."
./gradlew --stop 2>/dev/null
echo ""

echo "Limpiando caché de CMake (.cxx) y builds anteriores para evitar GLOB mismatch..."
rm -rf app/.cxx app/build build .gradle

# Limitar a 1 núcleo y compilar únicamente para arm64-v8a (Redmi Note 11 Pro).
# Esto evita que Ninja/Clang saturen la memoria RAM y disparen el OOM Killer.
echo "Compilando para arm64-v8a (1 núcleo para evitar crash de RAM)..."
./gradlew clean app:assembleDebug -x lint -x test --no-daemon \
  -Dorg.gradle.parallel=false \
  -Pandroid.overrideNumberOfProcessors=1 \
  -PreactNativeDevServerPort=8081 \
  -PreactNativeArchitectures=arm64-v8a

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [[ -f "$APK_PATH" ]]; then
  echo ""
  echo "========================================="
  echo " ¡Compilación completada exitosamente!"
  echo " APK generado en: android/$APK_PATH"
  echo "========================================="
  
  if command -v adb >/dev/null 2>&1 && [[ $(adb devices | grep -v "List of" | grep -c "device$") -gt 0 ]]; then
    echo "Dispositivo detectado por ADB. ¿Instalar automáticamente? (s/n)"
    read -r -t 10 respuesta
    if [[ "$respuesta" =~ ^[sS]$ ]]; then
      adb install -r "$APK_PATH"
    fi
  else
    echo "Para instalar en tu teléfono (con depuración USB activa):"
    echo "  adb install -r android/$APK_PATH"
  fi
fi

