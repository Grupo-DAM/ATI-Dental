# Guía de Internacionalización (i18n) para Desarrolladores

Esta guía explica cómo funciona el sistema multilingüe en el cliente móvil de **ATI-Dental**, cómo añadir nuevas traducciones, y las reglas que debes seguir al construir nuevas pantallas para asegurar que la interfaz siempre responda a las preferencias del usuario.

El sistema de traducciones está construido sobre `i18next`, `react-i18next` y `expo-localization`, sincronizando la preferencia de idioma del usuario con **Firebase Firestore** y persistiendo de forma local con **AsyncStorage**.

---

## 1. ¿Cómo y dónde agregar textos nuevos?

Nunca debes escribir texto estático directamente en el código de tus componentes React. Todo texto visible por el usuario debe vivir en los diccionarios JSON.

### Estructura de los Diccionarios
Los diccionarios se encuentran en la ruta `src/i18n/locales/`. Actualmente soportamos dos idiomas base:
- `es.json`: Español (Idioma principal).
- `en.json`: Inglés (Fallback).

> [!IMPORTANT]
> **Regla de Oro:** Siempre que añadas una clave nueva en `es.json`, **debes** añadir exactamente la misma clave con su respectiva traducción en `en.json`. Si omites una clave en inglés, la aplicación crasheará o mostrará la variable cruda al cambiar de idioma.

### Ejemplo de cómo agregar una clave
Si vas a crear una pantalla de "Ajustes" (`settings`), abre ambos archivos y añade un nuevo bloque JSON raíz:

**`es.json`**
```json
{
  "settings": {
    "title": "Configuraciones",
    "logoutButton": "Cerrar sesión"
  }
}
```

**`en.json`**
```json
{
  "settings": {
    "title": "Settings",
    "logoutButton": "Log out"
  }
}
```

---

## 2. ¿Cómo inyectar el texto en los Componentes?

Para que tus componentes React escuchen los cambios de idioma en tiempo real (Optimistic UI), debes importar el *hook* `useTranslation` provisto por `react-i18next`.

### ❌ Lo que NO debes hacer:
```tsx
import { Text } from 'react-native';

export default function MiPantalla() {
    // MAL - El texto está quemado y no cambiará de idioma
    return <Text>Configuraciones</Text>;
}
```

### ✅ Lo que SÍ debes hacer:
```tsx
import { Text } from 'react-native';
// 1. Importa el hook de la librería correcta
import { useTranslation } from 'react-i18next';

export default function MiPantalla() {
    // 2. Extrae la función 't'
    const { t } = useTranslation();

    // 3. Usa la función pasándole la ruta de la clave (key) en formato string
    return <Text>{t('settings.title')}</Text>;
}
```

### ¿Y si el texto es una variable de estado o error?
El hook funciona en cualquier lugar dentro del renderizado del componente:
```tsx
const { t } = useTranslation();
const errorMessage = t('login.errors.networkMessage');
```

---

## 3. Pruebas Unitarias (Jest) con Idiomas

Si corres una prueba automatizada con Jest sobre un componente que usa `useTranslation`, **la prueba fallará** indicando que no puede leer el contexto de i18n, o no encontrará el texto porque buscará el texto original en español en vez de la clave técnica.

### ¿Cómo simular (mockear) i18next en tus tests?
Debes añadir el siguiente fragmento al principio de tu archivo `.test.tsx` (después de los `imports`):

```typescript
// Mock de i18next para evitar errores de renderizado de contexto
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // La función t devolverá el nombre de la clave
  }),
}));
```

### ¿Cómo hacer aserciones (expect) ahora?
Dado que la función mockeada `t` solo devuelve el nombre de la variable cruda, tus validaciones `findByText` deben buscar las llaves, no el texto en español:

```diff
// ❌ MAL: Esto fallará porque el mock devuelve "settings.title"
- const titulo = await findByText('Configuraciones');

// ✅ BIEN: Busca la llave exacta que escribiste en el componente
+ const titulo = await findByText('settings.title');
+ expect(titulo).toBeTruthy();
```
