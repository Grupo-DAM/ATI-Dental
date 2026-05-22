const { execSync } = require('child_process');
const os = require('os');

console.log('Verificando entorno de desarrollo para Expo/Android...\n');
let hasErrors = false;

function checkCommand(command, name) {
  try {
    execSync(command, { stdio: ['pipe', 'pipe', 'ignore'] });
    console.log(`${name} detectado correctamente.`);
    return true;
  } catch (error) {
    console.log(`${name} NO detectado o no configurado en el PATH.`);
    hasErrors = true;
    return false;
  }
}

// 1. Validar Node.js (Debe ser idéntico al .nvmrc)
const nodeVersion = process.version;
if (nodeVersion.startsWith('v20')) {
  console.log(`Node.js versión correcta: ${nodeVersion}`);
} else {
  console.log(`Node.js incorrecto: Tienes ${nodeVersion}, se requiere v20.x`);
  hasErrors = true;
}

// 2. Validar Java JDK (Para desarrollo en Android se usa JDK 17 o superior)
checkCommand('java -version', 'Java JDK');

// 3. Validar variables de entorno de Android
const androidHome = process.env.ANDROID_HOME;
if (androidHome) {
  console.log(`ANDROID_HOME configurado en: ${androidHome}`);
} else {
  console.log('ANDROID_HOME no está configurado en las variables de entorno.');
  hasErrors = true;
}

// 4. Validar herramientas de comandos de Android (ADB)
const checkPathCmd = os.platform() === 'win32' ? 'where adb' : 'which adb';
checkCommand(checkPathCmd, 'Android ADB (Platform Tools)');

if (hasErrors) {
  console.log('\nSe encontraron problemas en el entorno. Revisa los puntos anteriores antes de continuar.');
  process.exit(1);
} else {
  console.log('\n¡Todo listo! Tu entorno es idéntico y correcto para empezar a programar.');
}
