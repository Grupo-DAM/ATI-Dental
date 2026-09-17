# Guía de contribución — ATI-Dental


## Versionamiento automatizado

Para simplificar el proceso y evitar errores manuales, el proyecto cuenta con un workflow de GitHub Actions llamado **`auto-versioning`**. Este flujo calcula automáticamente el siguiente número de versión, actualiza los archivos del proyecto, genera el bloque correspondiente en el Changelog y publica el Git Tag de forma segura.

#### Cómo usar la automatización:

1. Ve a la pestaña **Actions** en el repositorio de GitHub.
2. En la barra lateral izquierda, selecciona el workflow **"Automatización de Versionamiento y Tags"**.
3. Haz clic en el botón desplegable **Run workflow** a la derecha.
4. Configura las opciones del formulario:
   - **Branch:** Asegúrate de seleccionar la rama principal acordada (por ejemplo, `main`).
   - **Tipo de incremento:** Selecciona entre `patch`, `minor` o `major` según la naturaleza de tus cambios (Ver la sección Versionamiento Semántico para más información).
   - **Descripción breve de los cambios:** Escribe un resumen conciso de lo que incluye la versión. Este texto se inyectará automáticamente en el formato oficial de tu **`CHANGELOG.md`**. Si lo dejas vacío, el sistema usará una descripción genérica basada en el tipo de incremento.
5. Haz clic en el botón verde **Run workflow**.

El sistema se encargará de realizar los commits de actualización, sincronizar las ramas correspondientes (como el entorno de `qa`) y generar el Git Tag oficial para disparar el pipeline de CI/CD.

## Versionamiento semántico (SemVer)

Usamos el formato **`MAJOR.MINOR.PATCH`** (por ejemplo `1.2.3`), alineado con [semver.org](https://semver.org/lang/es/).

La versión debe mantenerse **sincronizada** en:

- `package.json` → campo `"version"`
- `app.json` → campo `expo.version`

Cada release publicada debe reflejarse en **`CHANGELOG.md`** y etiquetarse en Git como **`vX.Y.Z`** (por ejemplo `v1.0.1`).

### Cuándo incrementar cada número

| Tipo | Cuándo usarlo | Ejemplo |
|------|----------------|---------|
| **PATCH** (`1.0.0` → `1.0.1`) | Correcciones de bugs, ajustes de configuración, CI/CD, documentación interna o cambios que **no alteran** la API ni el comportamiento funcional visible para el usuario. | Fix de pipeline, actualización de `check-env.js`, corrección de typo en docs. |
| **MINOR** (`1.0.1` → `1.1.0`) | Nueva funcionalidad **compatible** con versiones anteriores. Reset de PATCH a `0`. | Nueva pantalla, nuevo módulo opcional, mejora UX sin romper flujos existentes. |
| **MAJOR** (`1.1.0` → `2.0.0`) | Cambio **incompatible** con versiones anteriores. Reset de MINOR y PATCH a `0`. | Refactor que elimina rutas/APIs, cambio de modelo de datos no migrable, rediseño que obliga a reconfigurar la app. |

### Flujo al publicar una versión

1. Actualizar `"version"` en **`package.json`** y **`app.json`** (mismo valor).
2. Añadir una entrada en **`CHANGELOG.md`** con la fecha y un resumen breve.
3. Hacer commit con mensaje claro, por ejemplo: `chore: release v1.0.1`.
4. Crear el tag anotado en Git:
   ```bash
   git tag -a v1.0.1 -m "v1.0.1"
   ```
5. Subir la rama y el tag al remoto:
   ```bash
   git push origin main
   git push origin v1.0.1
   ```

### Convenciones del equipo

- No mezclar varios tipos de release (PATCH + MINOR) en un solo número de versión sin consenso en el equipo.
- Los **spikes** y ramas experimentales **no** incrementan versión hasta merge a la rama principal acordada.
- Antes de taggear, verificar que `npm test` y el pipeline de CI pasen en la rama objetivo.
