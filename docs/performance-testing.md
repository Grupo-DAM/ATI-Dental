# Guía de Pruebas de Rendimiento y Carga (Performance & Load Testing)

Esta guía explica la arquitectura, ejecución, interpretación y mantenimiento de la suite completa de pruebas de rendimiento y carga en **ATI Dental**, dividida en dos dimensiones complementarias:
1. **Pruebas de Carga Heterogéneas en Endpoints y Servicios** (simulando tráfico real concurrente ponderado por rol de usuario).
2. **Pruebas de Rendimiento de Renderizado UI en React Native** (con [Reassure](https://callstack.github.io/reassure/)).

---

## 1. Pruebas de Carga Heterogéneas con Perfiles de Usuario

Las pruebas de carga modelan el comportamiento real del sistema, donde conviven múltiples roles con patrones de uso, volúmenes y consultas diferenciadas.

### 1.1 Perfiles de Usuario y Distribución Ponderada

El tráfico se distribuye de acuerdo con la proporción esperada en producción:

| Rol | Identificador en Sistema | Peso de Tráfico | Flujos y Endpoints Críticos Simulados |
|---|---|---|---|
| **Paciente** | `usuario_externo` | **70%** | Consulta de citas (`GET /appointments/mine`), notificaciones (`GET /notifications`), perfil personal (`GET /profile`). |
| **Odontólogo** | `odontologo` | **20%** | Búsqueda y listado de pacientes (`GET /patients`), agenda clínica (`GET /appointments`), registro y actualización de odontograma/historia clínica (`POST /clinical-records/odontogram`). |
| **Administrador** | `admin` | **10%** | Gestión de usuarios (`GET /users`), reportes demográficos y analíticos pesados (`GET /reports/demographics`, `GET /reports/retention`). |

### 1.2 Umbrales de Aceptación (SLA y Criterios de Aceptación)

Para garantizar la estabilidad del servicio y evitar cuellos de botella en endpoints de alta demanda, se establecen umbrales diferenciados por la complejidad computacional de cada rol:

| Perfil / Rol | Umbral p95 | Umbral p99 | Tasa Máxima de Error |
|---|---|---|---|
| **Paciente** | `< 500 ms` | `< 800 ms` | `< 1%` |
| **Odontólogo** | `< 1200 ms` | `< 2000 ms` | `< 1%` |
| **Administrador** | `< 2500 ms` | `< 3500 ms` | `< 1%` |
| **Global** | - | - | **`< 1.0%`** |

---

## 2. Generación y Aprovisionamiento de Usuarios de Prueba (`seed:users`)

Para garantizar credenciales independientes por cada rol sin depender de cuentas personales, se incluye un script automatizado de aprovisionamiento.

### 2.1 Uso del Seeder

```bash
# Modo desarrollo / offline (genera credenciales seguras y archivos locales sin tocar Firebase)
npm run seed:users -- --dry-run

# Modo aprovisionamiento en Firebase (utiliza google-services.json y Firebase REST API)
npm run seed:users
```

### 2.2 Archivos Generados y Parametrización
- `tests/performance/test-users.json`: Catálogo estructurado con tokens, credenciales y metadatos de los usuarios creados para cada rol.
- `.env.test`: Variables de entorno de prueba (`TEST_PATIENT_EMAIL`, `TEST_DENTIST_EMAIL`, `TEST_ADMIN_EMAIL`, etc.).

---

## 3. Ejecución de Pruebas de Carga

Disponemos de dos mecanismos de ejecución compatibles: el **Runner Autónomo de Node.js** (integrado directamente en CI/CD y scripts de npm) y **k6** (para entornos de infraestructura avanzada).

### 3.1 Runner Autónomo de Node.js (`npm run test:load`)

No requiere binarios externos ni dependencias de sistema adicionales. Si no se especifica un servidor destino, levanta automáticamente un servidor mock in-process optimizado.

```bash
# Ejecución estándar (arranca servidor mock local automáticamente)
npm run test:load

# Ejecución contra un entorno o servidor específico
node tests/performance/load-runner.js --server=https://api-staging.atidental.com --duration=30 --concurrency=10
```

#### Opciones configurables:
- `--server=<url>`: URL base del backend a evaluar (por defecto: servidor mock local).
- `--duration=<segundos>`: Duración total de la prueba de carga (por defecto: 10 segundos).
- `--concurrency=<N>`: Cantidad de usuarios virtuales concurrentes (por defecto: 10 VU).
- `--dry-run`: Valida la configuración sin enviar peticiones HTTP.

#### Salidas y Reportes Generados:
- `.reassure/load-report.md`: Reporte detallado en formato Markdown listo para adjuntar al Pull Request.
- `.reassure/load-report.json`: Datos métricos en formato JSON para trazabilidad en pipelines.

### 3.2 Runner con Grafana k6 (`tests/performance/k6-load-test.js`)

Si k6 está instalado en tu entorno o en GitHub Actions:

```bash
# Ejecutar suite con k6
k6 run tests/performance/k6-load-test.js

# Ejecutar k6 apuntando a un backend específico
k6 run -e BASE_URL=https://api-staging.atidental.com tests/performance/k6-load-test.js
```

---

## 4. Pruebas de Rendimiento de Renderizado UI (Reassure)

Reassure mide el rendimiento de los componentes React Native y detecta regresiones comparando contra una línea base (`baseline`).

### 4.1 Comandos Disponibles

| Comando | Descripción |
|---|---|
| `npm run test:perf` | Ejecuta la suite Reassure y compara contra el baseline |
| `npx reassure --baseline` | Genera una nueva línea base de rendimiento |

### 4.2 Escenarios de UI Cubiertos

| Archivo | Pantalla / Componente | Escenario Evaluado |
|---|---|---|
| `src/__tests__/perf.perf-test.tsx` | `HomeScreen`, `ProfileScreen` | Tiempo de montaje diferenciado bajo perfiles **Paciente**, **Odontólogo** y **Administrador** |
| `src/components/users-list/__test__/admin-list.perf-test.tsx` | `AdminListLayout` | ScrollView con 50 y 100 tarjetas de usuario |
| `src/components/ui/__test__/modal-list.perf-test.tsx` | `ModalOptionList` | Modal con 50 y 200 opciones (selector de países) |
| `src/components/reports/__test__/charts.perf-test.tsx` | `CountryBarChart`, `RegionDonutChart`, etc. | Renderizado de gráficos vectoriales SVG |

---

## 5. Buenas Prácticas y Criterios DoD

1. **Verificar umbrales antes de PR**: Ejecutar `npm run test:load` y adjuntar `.reassure/load-report.md` en la descripción del PR.
2. **Cero regresiones en UI**: Si `npm run test:perf` muestra un 🔴 superior al 20%, investigar las causas (evitar re-renders innecesarios mediante `useMemo` o `useCallback`).
3. **Mantener credenciales y mocks sincronizados**: Al agregar nuevos endpoints protegidos, actualizar tanto `tests/performance/mock-server.js` como `scripts/seed-test-users.js`.
4. **Respetar la suite unitaria**: La suite regular (`npm test`) valida la lógica de cálculo de percentiles y umbrales vía `src/__tests__/load-test-runner.test.ts`.
