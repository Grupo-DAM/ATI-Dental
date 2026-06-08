# 📋 Definition of Ready (DoR) - Estándar del Proyecto

El **Definition of Ready (DoR)** constituye el acuerdo oficial del equipo de ingeniería que establece los requisitos mínimos de calidad, claridad y viabilidad que una Historia de Usuario (US) debe cumplir obligatoriamente antes de ser admitida dentro de un Sprint y pasar a la fase de desarrollo.

Este filtro garantiza un flujo de trabajo continuo, previene bloqueos técnicos y optimiza las sesiones de planificación.

---

## 🔍 Criterios de Aceptación del DoR

Para que una Historia de Usuario se considere formalmente **"Ready"**, debe cumplir con los siguientes 8 pilares fundamentales:

| #     | Criterio                    | Descripción Técnica / Restricción                                                                                                                                 |
|-------|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1** | **Identificación**          | Debe contar obligatoriamente con un **título conciso** y un **identificador único** correlativo (ej. `US-023`).                                                   |
| **2** | **Formato Estándar**        | Debe estar redactada estrictamente en lenguaje ágil: <br> *"Como **[usuario]**, quiero **[funcionalidad]** para **[beneficio/valor]**."*                          |
| **3** | **Criterios de Aceptación** | Debe incluir de **3 a 5 puntos claros y explícitos** (escenarios *Given-When-Then*) que delimiten el alcance funcional y técnico para dar la tarea por terminada. |
| **4** | **Sin Bloqueos**            | La tarea es completamente autónoma. **No depende** de arquitecturas, WebAPIs externas, diseños o definiciones de terceros que no estén consolidados.              |
| **5** | **Refinada**                | Cumple con el principio INVEST. La historia es lo suficientemente atómica y acotada como para ser completada y probada al 100% dentro de un **único sprint**.     |
| **6** | **Estimada**                | El equipo completo ha debatido la complejidad arquitectónica y ha acordado un puntaje en **Estimate**.                                                            |
| **7** | **Planificación Temporal**  | Cuenta con campos explícitos asignados tanto para la **fecha de inicio estimada** como para la **fecha límite** del entregable.                                   |
| **8** | **Trazabilidad**            | No se permiten tareas huérfanas en el backlog. Cada historia de usuario debe estar vinculada de manera obligatoria a una **Épica asociada**.                      |

---

## 🛠️ Lista de Chequeo Interactiva

*Copia y pega este bloque en el cuerpo de cada nuevo US para validar de forma procedimental su estado de preparación:*

```markdown
## Lista de Verificación Definition of Ready (DoR)
[Ir a la Definición de Ready oficial del proyecto](/docs/DoR.md)
*Esta sección valida si la Historia de Usuario está lista para entrar al Sprint. El Issue debe cumplir con todo lo siguiente:*
- [ ] **Título e Identificador:** Identificador único visible y título alineado al módulo.
- [ ] **Formato de la US:** Estructura formal de rol, acción y valor de negocio redactada.
- [ ] **Criterios de Aceptación (3-5 puntos):** Escenarios declarativos integrados (Mínimo 3, Máximo 5).
- [ ] **Mitigación de Bloqueos:** Confirmado que no existen dependencias externas sin definir.
- [ ] **Alcance del Sprint (Refinamiento):** El tamaño es óptimo para el ciclo actual.
- [ ] **Estimación Completada:** Posee asignados sus respectivos puntos de historia (Story Points).
- [ ] **Fechas de Control:** Fechas estimadas de inicio y entrega cargadas en los metadatos del issue.
- [ ] **Alineación del Backlog:** Vinculada correctamente a la Épica madre del módulo.