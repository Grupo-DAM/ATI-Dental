# Guía de Pruebas de Rendimiento (Performance Testing)

Esta guía explica cómo ejecutar, interpretar y mantener la suite de pruebas de rendimiento del proyecto ATI-Dental, basada en [Reassure](https://callstack.github.io/reassure/).

---

## ¿Qué es Reassure?

Reassure es una herramienta de benchmarking para React Native que mide cuánto tarda un componente en renderizarse y cuántas veces se re-renderiza. Funciona comparando las métricas actuales contra una **línea base** (baseline) previamente almacenada para detectar regresiones de rendimiento.

---

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run test:perf` | Ejecuta la suite de rendimiento y compara contra el baseline |
| `npx reassure --baseline` | Genera una nueva línea base de rendimiento |

---

## ¿Cuándo usar cada comando?

### `npx reassure --baseline`

Ejecuta este comando para **establecer o actualizar la línea base** de rendimiento. Debe ejecutarse:

- **Después de un merge a `main`**, para que el baseline refleje el estado estable del proyecto.
- **Cuando se agreguen nuevos escenarios** de prueba, para que Reassure tenga un punto de referencia.
- **Después de optimizaciones intencionales**, para actualizar los umbrales esperados.

```bash
npx reassure --baseline
```

El baseline se guarda en `.reassure/baseline.perf`.

### `npm run test:perf`

Ejecuta este comando para **medir y comparar** el rendimiento actual contra el baseline. Úsalo:

- **Antes de abrir un Pull Request**, para verificar que tus cambios no introdujeron regresiones.
- **Durante el desarrollo**, si estás modificando componentes con impacto visual o de estado complejo.

```bash
npm run test:perf
```

Los resultados se guardan en:
- `.reassure/current.perf` — Métricas crudas de la ejecución actual
- `.reassure/output.json` — Comparación en formato JSON
- `.reassure/output.md` — Reporte legible con tablas comparativas

---

## ¿Cómo interpretar los resultados?

Al ejecutar `npm run test:perf`, Reassure imprime un reporte en consola con las siguientes secciones:

### Significant Changes (Cambios Significativos)
Componentes cuyo rendimiento cambió de forma estadísticamente relevante. Aparecen con un 🔴 si hubo degradación.

```
ModalOptionList - Modal con 200 opciones [render]: 147.4 ms → 210.3 ms (+62.9 ms, +42.7%) 🔴
```
> ⚠️ **Si ves esto en tu PR**, investiga qué cambio causó la regresión antes de hacer merge.

### Meaningless Changes (Cambios Insignificantes)
Variaciones pequeñas que entran dentro del margen de error estadístico. Puedes ignorarlas.

### Render Count Changes
Indica si un componente aumentó o disminuyó su número de renders. Un aumento inesperado puede indicar re-renderizados innecesarios.

### Render Issues
Lista problemas detectados como `initial updates` (actualizaciones durante el montaje inicial) o `redundant updates` (re-renders innecesarios).

---

## Escenarios Cubiertos

La suite actualmente mide los siguientes componentes:

| Archivo | Componente | Qué mide |
|---------|-----------|----------|
| `src/__tests__/perf.perf-test.tsx` | `HomeScreen`, `ProfileScreen` | Tiempo de montaje de pantallas principales |
| `src/components/users-list/__test__/admin-list.perf-test.tsx` | `AdminListLayout` | ScrollView con 50 y 100 tarjetas de usuario |
| `src/components/ui/__test__/modal-list.perf-test.tsx` | `ModalOptionList` | Modal con 50 y 200 opciones (selector de países) |
| `src/components/reports/__test__/charts.perf-test.tsx` | `CountryBarChart`, `RegionDonutChart`, `GenderDonutChart`, `AgeBarChart` | Renderizado de gráficos SVG vectoriales |

---

## ¿Cómo agregar un nuevo escenario?

1. Crea un archivo con el sufijo `.perf-test.tsx` dentro de la carpeta `__test__` del componente:

```tsx
import React from 'react';
import { measureRenders } from 'reassure';
import { MiComponente } from '../mi-componente';

// Mocks necesarios
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.setTimeout(120_000);

describe('MiComponente - Rendimiento', () => {
  it('se renderiza sin regresión', async () => {
    await measureRenders(
      <MiComponente prop1="valor" prop2={42} />,
      { runs: 10 },
    );
  });
});
```

2. Ejecuta el baseline para registrar las métricas iniciales:

```bash
npx reassure --baseline
```

3. Verifica que el escenario funciona:

```bash
npm run test:perf
```

---

## Configuración

La configuración de Reassure se encuentra en `.reassurerc.js`:

```js
module.exports = {
  runs: 10,          // Número de iteraciones por escenario
  warmupRuns: 1,     // Ejecución de calentamiento (descartada)
  outputFile: '.reassure/output.json',
  testMatch: '**/*.perf-test.{ts,tsx}',
};
```

> **Nota**: Los archivos `*.perf-test.tsx` están excluidos de la suite regular de Jest (`npm test`) para no impactar el tiempo de ejecución de las pruebas unitarias.

---

## Buenas Prácticas

1. **No modificar el baseline en ramas feature** — Solo debe actualizarse en `main` después de un merge.
2. **Investigar regresiones antes de hacer merge** — Si `npm run test:perf` muestra un 🔴 con más del 20% de incremento, revisa tus cambios.
3. **Mantener los mocks actualizados** — Si agregas nuevas dependencias a un componente, actualiza los mocks en su archivo `.perf-test.tsx`.
4. **No ignorar Render Issues** — Los `redundant updates` son señales de re-renderizados innecesarios que afectan la experiencia del usuario.
