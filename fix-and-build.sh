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

# -Pandroid.overrideNumberOfProcessors=2 limita el número de núcleos que Gradle y Ninja 
# usarán para compilar. Esto evita que tu Ubuntu se congele o se quede sin RAM (OOM),
# pero sin romper la configuración de CMake.
echo "Limpiando y compilando (limitado a 2 núcleos para evitar crash de RAM)..."
./gradlew clean app:assembleDebug -x lint -x test --no-daemon \
  -Pandroid.overrideNumberOfProcessors=2 \
  -PreactNativeDevServerPort=8081 \
  -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
