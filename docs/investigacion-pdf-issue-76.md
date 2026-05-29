# Investigación sobre generación de reportes PDF (issue #76)

La generación de reportes PDF en el dispositivo se hace con **`expo-print`** (HTML → PDF) y **`expo-sharing`** (share sheet nativo).

> ⚠️ **Instalación:** `npx expo install expo-print expo-sharing` y plugin en `app.json`: `"expo-sharing"`

**PoC:** `src/lib/clinical-report-html.ts`, `src/lib/generate-and-share-clinical-pdf.ts`, `src/app/pdf-report-poc.tsx`, `src/app/index.tsx` (pantalla inicial).

Flujo: **Generar PDF** → `printToFileAsync` → `shareAsync` (Android/iOS). Compatible con **Expo Go**.

---

## Consideraciones

* HTML → PDF usa **WebView**: sin responsividad real; plantillas de impresión (tablas, 1 columna, CSS básico).
* **iOS:** imágenes del bundle → **base64** en el HTML.
* **Web:** impresión del navegador; no share de URI local.
* El share sheet lo define el **sistema** (no se pueden ocultar apps concretas).

---

## Conclusión

**Sí es viable y escalable de forma incremental** para Reportes MVP en Android/iOS. **No** como única estrategia a largo plazo ni con paridad web completa sin backend.
