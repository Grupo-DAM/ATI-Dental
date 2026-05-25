# Resumen: Simulación de Voz en las Pruebas (Mocking de Hardware)

## ¿De qué trata este spike?

Necesitamos probar funcionalidades que dependen del **micrófono y reconocimiento de voz** (por ejemplo, el comando *"Diente 14 caries"*), pero **sin depender de un micrófono real**. Este spike investigó cómo lograrlo usando las dos herramientas de prueba del proyecto: **Jest** y **Maestro**.

---

## Las dos estrategias comparadas

### 1. Jest — Simulación por código (pruebas unitarias)

**¿Cómo funciona?**  
Se reemplaza ("mockea") el módulo de voz directamente en el código. Jest nunca toca el micrófono; simplemente le decimos: *"cuando alguien pida la transcripción de voz, devuelve este texto fijo"*.

```typescript
// Ejemplo simplificado: el mock le dice a Jest qué "escuchó" el micrófono
jest.mock('@/hooks/use-voice-recognition', () => ({
  useVoiceRecognition: () => ({
    transcript: 'Diente 14 caries', // Texto fijo, sin micrófono real
    isListening: false,
    startListening: jest.fn(),
    stopListening: jest.fn(),
  }),
}));
```

**Ventajas:** Rapidísimo (~200ms por test), 100% predecible, no necesita emulador.  
**Limitación:** No comprueba cómo se ve la app en pantalla.

---

### 2. Maestro — Simulación por interfaz (pruebas E2E)

**¿Cómo funciona?**  
La app incluye un **panel de inyección** (solo visible en modo desarrollo) donde Maestro escribe texto simulado como si fuera lo que "escuchó" el micrófono, y luego verifica que la pantalla muestre la respuesta correcta.

```yaml
# Maestro escribe un comando de voz simulado y verifica la pantalla
- tapOn: "Comando de voz simulado"
- inputText: "Diente 46 extracción"
- tapOn: "Inyectar"
- assertVisible: "Diente: 46"
- assertVisible: "Diagnóstico: extracción"
```

**Ventajas:** Prueba la app real en un emulador, valida la interfaz visual completa.  
**Limitación:** Más lento (~10-30s por flujo), requiere un emulador encendido.

---

## ¿Qué se decidió?

**Usar ambas herramientas en conjunto**, cada una para lo que mejor hace:

| Qué se prueba | Herramienta | ¿Cuándo se ejecuta? |
| :--- | :--- | :--- |
| Lógica del parser de comandos y estados del hook | **Jest** | En cada commit y en el CI/CD |
| Flujo visual completo (pantalla, navegación, permisos) | **Maestro** | Antes de cada release |

> **En resumen:** Jest cubre el ~80% de las pruebas de forma rápida y fiable; Maestro complementa con el ~20% restante verificando que todo se vea y funcione bien en un dispositivo real.

---

## Archivos creados en el spike

| Archivo | ¿Qué es? |
| :--- | :--- |
| `src/hooks/use-voice-recognition.ts` | Hook que encapsula el servicio de reconocimiento de voz |
| `src/components/voice-command-demo.tsx` | Componente de demostración con el parser de comandos y panel de inyección |
| `src/components/__tests__/voice-command-demo.test.tsx` | Tests unitarios del parser + tests de integración con mock |
| `.maestro/voice-mock-flow.yaml` | Flujo E2E que simula un comando de voz desde el panel de inyección |

---

## Cómo ejecutar las pruebas

```bash
# Pruebas unitarias (Jest) — no necesita emulador
npm run test

# Pruebas E2E (Maestro) — necesita emulador encendido
npm run test:e2e
```

---

## Limitaciones importantes

1. **Ninguna de las dos herramientas prueba el micrófono real.** Ambas simulan lo que el micrófono "escucharía". Para probar audio real se necesitaría inyectar archivos de audio al emulador, lo cual queda fuera del alcance actual.
2. **El panel de inyección solo aparece en modo desarrollo (`__DEV__`).** Nunca se muestra en builds de producción.

---

> 📄 Para el análisis técnico completo, consulta [spike-mocking-hardware.md](./spike-mocking-hardware.md).
