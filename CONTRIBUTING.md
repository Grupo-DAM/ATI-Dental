# Guía de contribución — ATI-Dental

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
