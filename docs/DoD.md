# 📋 Definition of Done (DoD) - Estándar de Calidad del Proyecto

El **Definition of Done (DoD)** constituye el conjunto de criterios técnicos, métricas de calidad y requisitos de automatización obligatorios que toda Historia de Usuario (US) debe validar con éxito antes de ser considerada formalmente como **Finalizada (Done)** por el equipo y el pipeline de Integración Continua (CI/CD).

Esto garantiza que cada funcionalidad integrada en el repositorio se encuentre libre de deuda técnica, con un empaquetado seguro y respaldada por capas completas de software de pruebas.

---

## Matriz Global de Control del DoD

| Capa de Control               | Criterio de Aceptación Técnico Obligatorio                                                                                                                                                                                                                                                     | Herramienta de Validación                                                             |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| **Calidad Estática**          | El código fuente modificado debe someterse a un análisis estático exhaustivo (SAST) que certifique un índice de 0 bugs críticos, 0 vulnerabilidades de seguridad abiertas y un porcentaje de duplicación aceptable (*Quality Gate* aprobado).                                                  | **SonarQube**                                                                         |
| **Pruebas Unitarias**         | Toda lógica de negocio, manejo de estados mutables y hooks personalizados deben poseer pruebas automatizadas rápidas ejecutadas sobre un entorno aislado basado en Node.js.                                                                                                                    | **Jest**                                                                              |
| **Pruebas Estructurales**     | Los componentes visuales modificados o nuevos deben validar la consistencia de su jerarquía de renderizado de elementos de la interfaz en frío para prevenir alteraciones no deseadas.                                                                                                         | **react-test-renderer** *(Snapshot Testing)*                                          |
| **Pruebas de Interfaz (E2E)** | Los flujos completos de usuario de la app deben ser validados mediante pruebas instrumentadas de caja negra operando sobre emuladores o terminales reales en la nube, simulando interacciones físicas reales.                                                                                  | **Maestro**                                                                           |
| **Seguridad de Datos**        | Prohibición absoluta de almacenar API Keys o secretos directamente en el código fuente cliente. Todo consumo externo debe delegarse a la capa de orquestación serverless. De usar *SSL Pinning*, la caducidad del certificado incrustado debe estar mapeada en el cronograma de mantenimiento. | **Capa de Orquestación Intermedia**                                                   |
| **Empaquetado Seguro**        | Generación exitosa de los archivos binarios compilados de forma nativa en entornos limpios del pipeline, aplicando firmas digitales válidas y preparadas para la distribución a tiendas oficiales.                                                                                             | **Nativo Android (`.aab` / `.apk` firmado)** <br> **Nativo iOS (`.ipa` certificado)** |


---

## 🛠️ Lista de Chequeo Interactiva

*Copia e integra esta lista interactiva en la sección final de la plantilla de los US para forzar procedimentalmente la revisión del DoD antes de mover el ticket a la columna de completado:*

```markdown
## Lista de Verificación de Calidad
[Ir a la Definición de Done oficial del proyecto](/docs/DoD.md)

*Para poder cerrar este Issue, el Pull Request asociado debe certificar el cumplimiento de los siguientes puntos:*
- [ ] **[SAST]** Escaneo de código en `SonarQube` completado con 0 bugs críticos y *Quality Gate* en estado PASSED.
- [ ] **[Unit Testing]** El 100% de las pruebas unitarias de lógica y comportamiento pasan exitosamente en el entorno de `Jest`.
- [ ] **[Snapshot Testing]** Archivos de instantáneas estructurales (`.snap`) generados o actualizados mediante `react-test-renderer` sin regresiones en la interfaz.
- [ ] **[E2E Testing]** Flujos funcionales verificados mediante scripts instrumentados de `Maestro` sobre emuladores o granjas de dispositivos.
- [ ] **[Security Audit]** Verificado que las credenciales de WebAPIs se consumen de manera indirecta a través de la capa intermedia serverless sin secretos expuestos en el código.
- [ ] **[Code Review]** Pull Request profesional revisado y aprobado formalmente por al menos un miembro del equipo técnico, y fusionado sin conflictos a la rama base.
- [ ] **[Native Compilation]** Compilación nativa limpia completada con éxito y generación del binario firmado digitalmente (`.aab` / `.ipa`) listo para distribución.