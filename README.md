# AI Software Architect Framework (ASAF) 🤖📐

**ASAF** es un estándar y framework independiente del modelo de IA que ayuda a diseñar, crear, mantener y evolucionar proyectos de software mediante arquitectos virtuales, gobernanza de código estática y un motor de contexto inteligente basado en Grafos Semánticos. 

Su propósito principal es guiar a desarrolladores e Inteligencias Artificiales en la toma de decisiones arquitectónicas y la automatización de la infraestructura, minimizando el consumo de tokens mediante slicing sintáctico y previniendo la degradación del código mediante auditorías automatizadas.

> [!IMPORTANT]
> **Estado del Proyecto:** `Alfa Cerrada / Developer Preview`. 
> El analizador AST semántico y el linter de gobernanza están optimizados para el ecosistema **TypeScript, JavaScript y Python** en esta iteración.

---

## 🎯 Objetivos y Características Core

* **Inicialización Automatizada (Zero-Config):** Configura, analiza, indexa, audita brechas y genera reglas de asistentes en un solo paso usando `asaf init`.
* **Reducción de Tokens mediante Slicing e Indexación Incremental (TokenSaver):** Utiliza hashing SHA-256 para evitar re-procesar código sin cambios y calcula el impacto en cascada utilizando dependencias de importación directas e indirectas.
* **Catálogo de Especificaciones Autogenerado:** Mapea cada módulo a especificaciones funcionales y análisis estático de seguridad continuo (`docs/specs/*.spec.md`) con un índice global (`docs/specs/README.md`).
* **Auditoría de Brechas e Informe Ejecutivo:** Identifica vulnerabilidades de seguridad (ej. inyecciones SQL, credenciales expuestas), ineficiencias de rendimiento DB (ej. N+1 y `SELECT *`) y SEO web, consolidando un reporte ejecutivo en `docs/audit-report.md`.
* **Soporte Multi-Lenguaje:** Mapeo sintáctico nativo de dependencias y extracción de firmas para el ecosistema de TypeScript, JavaScript y Python.
* **Architecture Governance (Linter de Capas):** Valida de forma estática que las dependencias de importación cumplan estrictamente con las capas de *Clean Architecture* o *DDD*.
* **Puente de Agentes Universal (IDE Rules):** Auto-genera directivas de contexto (`.cursorrules`, `.clinerules`) que le enseñan a cualquier IA cómo interactuar con el proyecto y respetar las decisiones aprobadas.

---

## 📂 Estructura del Proyecto

```
ASAF/
├── advisor/         # Motor de recomendaciones enriquecidas (ADRs, riesgos, evolución).
├── agents/          # Pool de agentes de IA especializados con checklists (BA, Arch, Dev, QA, Security, DevOps).
├── blueprints/      # Plantillas de arquitectura de referencia (ej. NestJS Clean Architecture).
├── cli/             # Interfaz de línea de comandos (CLI) principal de ASAF.
├── context/         # Motor de slicing sintáctico y vinculación de ADRs en prompts.
├── core/            # Núcleo de gobernanza, linter de capas, especificaciones (specs), tokenSaver y auditoría.
├── discovery/       # Analizador AST nativo (TS compiler) y regex para Python, grafos semánticos y de conocimiento.
├── docs/            # Documentación y especificación de exposición (MCP, REST, SDKs).
└── generators/      # Generadores de infraestructura (Docker, Terraform, CI/CD).
```

---

## 💻 Comandos del CLI

### 1. `asaf init`
Inicializa y configura de forma completa y automática el framework. Realiza el análisis del grafo semántico, inicializa la caché incremental de tokens, genera las especificaciones funcionales e índice de cada módulo, ejecuta la auditoría de brechas en el código existente y genera las directivas `.cursorrules` / `.clinerules`.
```bash
npx asaf init
```

### 2. `asaf audit`
Ejecuta la auditoría avanzada de seguridad (inyecciones SQL, secrets), optimizaciones de base de datos (problema N+1, SELECT *), SEO y escalabilidad, actualizando el informe de brechas en `docs/audit-report.md`.
```bash
npx asaf audit
```

### 3. `asaf specs`
Genera o actualiza individualmente o de forma masiva las especificaciones funcionales e índice maestro.
```bash
npx asaf specs --all
```

### 4. `asaf check`
Audita el linter de gobernanza de capas arquitectónicas. Si detecta violaciones (ej. el Dominio importando infraestructura), imprime los errores y sale con código `exit 1` (ideal para pipelines de CI/CD).
```bash
npx asaf check
```

### 5. `asaf context`
Muestra el impacto de los cambios de Git.
* Usa el flag `--prompt` para exportar un prompt en Markdown listo para copiar/pegar en tu IA, conteniendo las decisiones de arquitectura (ADRs) a respetar y el código fuente con slicing estructural.
```bash
npx asaf context --prompt
```

### 6. `asaf rules`
Genera directivas y reglas automatizadas para que tu asistente de IA (Cursor o Cline) siga los lineamientos de ASAF.
```bash
npx asaf rules --type all
```

### 7. `asaf advise`
Genera recomendaciones de arquitectura basadas en las variables de negocio de la entrevista y el stack real detectado en el código.
```bash
npx asaf advise --apply
```

---

## 📖 Guía de Uso Avanzado: Adopción y Flujo Continuo

### Scenario A: Refactorizar y sanear un proyecto existente
1. Ejecuta el comando unificado:
   ```bash
   npx asaf init
   ```
2. Revisa el informe ejecutivo de brechas generado en [audit-report.md](file:///docs/audit-report.md) y el índice en [README.md](file:///docs/specs/README.md).
3. Delega a tu asistente de IA de forma segura la corrección de brechas respetando las reglas de post-ejecución (recalcular hashes y actualizar especificaciones en cada cambio).

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**.I/CD para bloquear los pull requests de forma automatizada cuando la arquitectura se vea degradada.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**.
