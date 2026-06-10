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

Hemos creado dos scripts de automatización locales en la raíz del proyecto para facilitar tu flujo de trabajo:

#### A. Compilar e Instalar el APK en tu dispositivo (`fix-and-build.sh`)
Este script detiene daemons previos de Gradle incompatibles, limpia la caché, y compila e instala la app en tu celular/emulador conectado por USB:
```bash
./fix-and-build.sh
```
*Si falla la instalación, desbloquea la pantalla de tu celular y asegúrate de tener activa la opción **"Instalar vía USB"** en los Ajustes de Desarrollador.*

#### B. Iniciar Metro con Redirección de Puertos (`start-metro.sh`)
Para que tu celular físico conectado por USB pueda comunicarse con tu servidor Metro local, se requiere redirigir el puerto `8081`. Este script realiza la redirección vía `adb reverse` e inicia el servidor Metro en el entorno de Node correcto (`v20.19.4`):
```bash
./start-metro.sh
```

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
