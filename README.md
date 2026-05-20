# ATI-Dental
Medical Records management software developed in React Native, DAM capstone project.

## Contributors
- Carlos Cao
- César Carios
- Miguel Ciavato
- Valeria Ciccolella
- Jesús Cova
- Sofía Marcano

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# ATI-Dental
Medical Records management software developed in React Native, DAM capstone project.

## Contributors
- Carlos Cao
- César Carios
- Miguel Ciavato
- Valeria Ciccolella
- Jesús Cova
- Sofía Marcano

---

## 🛠️ Configuración Unificada del Entorno (Obligatorio)

Para asegurar que los 6 desarrolladores usemos exactamente el mismo entorno de desarrollo (Node, NPM y dependencias) y evitar problemas al compilar en Android, sigue estos pasos:

### 1. Verificar tu versión de Node.js
Abre tu consola y ejecuta:
```bash
node -v
```
**Requisito:** Debemos usar la versión **`v20.12.2`** (Node LTS).

Si tu consola muestra una versión diferente (por ejemplo, v18 o v22), debes cambiarla antes de continuar:

*   **Si estás en Windows (5 desarrolladores):**
    *   **Opción A (Instalador rápido):** Descarga e instala la versión exacta v20.12.2 directamente desde el [sitio oficial de Node.js (v20.12.2)](https://nodejs.org/dist/v20.12.2/).
    *   **Opción B (Si usas NVM para Windows):** Ejecuta en tu terminal:
        ```powershell
        nvm install 20.12.2
        nvm use 20.12.2
        ```
*   **Si estás en Ubuntu / WSL (1 desarrollador):**
    *   Usa NVM en la raíz del proyecto para que lea nuestro archivo `.nvmrc` automáticamente:
        ```bash
        nvm install
        nvm use
        ```

---

### 2. Validar tu entorno local
Antes de instalar o correr nada, verifica si tienes configurado el SDK de Android, las variables de entorno y Java ejecutando en la raíz de este repositorio:

```bash
node check-env.js
```

*   Revisar si termina correctamente sin errores.

---

### 3. Instalar Dependencias
Una vez que tengas la versión de Node correcta y el entorno validado, ejecuta en la raíz:

```bash
npm install
```

> ⚠️ **Nota Importante:** Si intentas instalar dependencias usando una versión de Node incorrecta, la instalación fallará inmediatamente gracias a las políticas del proyecto en `.npmrc`.

---

### 4. Iniciar la Aplicación

Para iniciar el servidor de desarrollo de Expo localmente:

```bash
npx expo start
```

*   Presiona **`a`** para abrir el emulador de Android.
*   Presiona **`r`** si necesitas recargar la aplicación en el emulador.

---

## 📚 Estructura y Comandos Adicionales

### Limpieza de caché
Si en algún momento el compilador o Metro Bundler se quedan pegados o no detectan un cambio, ejecuta:
```bash
npm run reset-project
```

### Documentación de Apoyo
* [Documentación oficial de Expo](https://docs.expo.dev/)
* [Guía de emuladores Android en Expo](https://docs.expo.dev/workflow/android-studio-emulator/)