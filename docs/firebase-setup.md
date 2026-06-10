# ⚙️ Guía de Configuración y Uso de Firebase para Desarrolladores

Esta guía explica cómo configurar tu entorno de desarrollo local para compilar y ejecutar el cliente móvil de **ATI-Dental** conectado a los servicios de Firebase de forma nativa.

---

## 🔑 1. Configuración de Credenciales de Firebase

Por motivos de seguridad, los archivos de credenciales nativas de Firebase (`google-services.json` e `GoogleService-Info.plist`) **no se suben al repositorio** (están ignorados en `.gitignore`).

Para configurar tu copia local:
1. Pídele al administrador del proyecto el archivo `google-services.json` (o descárgalo de la Consola de Firebase -> Ajustes del Proyecto -> Aplicaciones Android).
2. Coloca el archivo `google-services.json` en la **raíz de tu proyecto** (directorio donde se encuentra `package.json`).
3. *Nota:* La configuración de iOS (`GoogleService-Info.plist`) no es obligatoria para este sprint ya que solo estamos compilando para Android.

---

## 🛠️ 2. Ejecutar la Aplicación en Desarrollo

Dado que utilizamos librerías de Firebase nativas (`@react-native-firebase/*`), **no se puede utilizar la aplicación estándar de Expo Go de la App Store**. Debes compilar una *Development Build* local.

### Requisitos locales:
* Tener instalado el SDK de Android y configurada la variable `$ANDROID_HOME` en tu terminal.
* Tener instalado JDK 21 (se recomienda OpenJDK 21).

### Comandos de ejecución rápida:

#### 🐧 Para usuarios de Linux / macOS:
Hemos creado dos scripts de automatización en la raíz del proyecto para facilitar tu flujo de trabajo local (diseñados para resolver incompatibilidades de entorno específicas de Linux):

##### A. Compilar e Instalar el APK en tu dispositivo (`fix-and-build.sh`)
```bash
./fix-and-build.sh
```

##### B. Iniciar Metro con Redirección de Puertos (`start-metro.sh`)
```bash
./start-metro.sh
```

#### 🪟 Para usuarios de Windows (PowerShell / CMD):
Dado que los archivos `.sh` no corren nativamente en Windows, y asumiendo que ya tienes instalada la versión compatible de Node (`v20.x`), Java 21 y Android SDK configurados globalmente en tus variables de entorno, debes ejecutar:

##### A. Limpiar caché y Compilar/Instalar APK:
```powershell
# En la raíz del proyecto, limpia compilaciones viejas e instala
cd android
./gradlew clean
cd ..
npx expo run:android
```
*(Asegúrate de tener el celular conectado por USB con Depuración USB e Instalar vía USB activos).*

##### B. Redirigir puertos e Iniciar Metro:
```powershell
# Redirige el puerto de depuración
adb reverse tcp:8081 tcp:8081

# Inicia el servidor Metro en modo dev-client
npx expo start --dev-client
```

### 📲 2.3. Instalación manual del APK (mediante ADB)
Si compilas la aplicación utilizando Gradle directamente (`./gradlew app:assembleDebug`) o si necesitas reinstalar el APK ya compilado, ejecuta el siguiente comando con tu dispositivo conectado por USB:

*   **Linux / macOS:**
    ```bash
    $ANDROID_HOME/platform-tools/adb install android/app/build/outputs/apk/debug/app-debug.apk
    ```
*   **Windows (PowerShell / CMD):**
    ```powershell
    # Si tienes ANDROID_HOME configurada en tu entorno de Windows:
    & "$env:ANDROID_HOME\platform-tools\adb.exe" install android\app\build\outputs\apk\debug\app-debug.apk
    
    # O si adb ya está agregado en tu PATH global de Windows:
    adb install android\app\build\outputs\apk\debug\app-debug.apk
    ```

> 💡 **Nota Importante:** Recuerda desbloquear la pantalla de tu celular y presionar **"Permitir"** o **"Instalar"** en la ventana emergente de confirmación de Android al enviar el comando.



---

## 📝 3. Buenas Prácticas al Importar Firebase

Para garantizar que la persistencia offline de datos, el rendimiento nativo y las compilaciones nativas funcionen correctamente, sigue estrictamente estas reglas:

### ❌ Lo que NO debes hacer:
**No importes** el SDK de Firebase Web en ningún archivo de tu código:
```typescript
// MAL - Esto causará fallos en producción y tamaño excesivo
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
```

###  Lo que SÍ debes hacer:
Importa las referencias de Firebase directamente de nuestro archivo de configuración centralizado `src/config/firebase.ts`:
```typescript
// BIEN - Utiliza las instancias centralizadas y nativas
import { auth, firestore, storage } from '@/config/firebase';
```
O bien del hook de sesión global si estás manejando datos del usuario autenticado:
```typescript
import { useAuth } from '@/hooks/use-auth';

const { user, login, logout } = useAuth();
```

---

## 🔒 4. Manejo de Sesión Segura y Tokens

El token de sesión seguro (JWT) emitido por Firebase se guarda y recupera automáticamente de forma encriptada en el hardware del celular mediante `expo-secure-store`. 
*   **No guardes** tokens ni datos confidenciales en texto plano (como en `AsyncStorage`).
*   Si necesitas verificar la existencia de una sesión iniciada al arrancar la app, utiliza el helper `src/utils/secure-storage.ts`:
```typescript
import { getSessionToken } from '@/utils/secure-storage';

const token = await getSessionToken();
if (token) {
  // Redirigir a Home...
}
```
