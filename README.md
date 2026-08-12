# AI Software Architect & Engineering Intelligence Platform (ASAF) 🤖📐

**ASAF** es un estándar y plataforma de inteligencia de ingeniería independiente del modelo de IA que ayuda a diseñar, crear, mantener y evolucionar proyectos de software mediante la orquestación de agentes virtuales, gobernanza de código dinámica configurable y un motor de contexto inteligente basado en Grafos Semánticos y compiladores de AST.

Su propósito principal es actuar como la **capa de inteligencia, contexto, memoria y gobernanza** que coordina a los agentes de desarrollo (a través de MCP, SDK o CLI), minimizando el consumo de tokens mediante slicing sintáctico y previniendo la degradación del código mediante auditorías y linters automatizados.

> [!IMPORTANT]
> **Estado del Proyecto:** `Developer Preview / Alpha`.
> El motor cuenta con un parser AST modular extensible (`LanguageAdapter`) optimizado inicialmente para **TypeScript, JavaScript y Python** en esta iteración.

---

## 🎯 Objetivos y Características Core

* **Inicialización Interactiva con Diagnóstico:** Configura, analiza e indexa tu proyecto detectando y aconsejando la mejor arquitectura (Clean, DDD o Capas) según la estructura física de tus carpetas mediante `asaf init`.
* **Language Adapters (AST Modulado):** El motor de descubrimiento (`DiscoveryEngine`) analiza de forma agnóstica el árbol de sintaxis abstracta (AST) de múltiples lenguajes mediante adaptadores modulares.
* **Architecture Governance Dinámico (Linter de Capas):** Linter de arquitectura configurable a través de `asaf.json` que valida dependencias de importación en Clean Architecture o DDD, vinculándose directamente a Decisiones de Arquitectura (ADRs).
* **Task & Impact Intelligence:** Evalúa tareas en lenguaje natural (`asaf task`) mapeando archivos impactados, dependencias en cascada y estimando el riesgo y presupuesto de tokens (`Context Budget`).
* **ADR Intelligence Engine (v0.2.6):** Los ADRs dejan de ser documentación pasiva y se convierten en entidades semánticas del grafo. ASAF indexa, traza y audita automáticamente la consistencia entre decisiones de arquitectura y el código fuente real, detectando ciclos y relaciones rotas de forma determinista.
* **Context Intelligence Engine (v0.2.7):** Motor unificado que clasifica, recorta y empaqueta de forma óptima el contexto mínimo necesario para los modelos de IA. Incluye slicing AST de cuatro niveles (`FULL`, `STRUCTURAL`, `SIGNATURE`, `MINIMAL`, `EXCLUDE`), ranking explicable por distancia BFS del grafo, y un planificador de presupuesto de tokens sobre el objeto `AIContext` serializado completo.
* **Architectural Reasoning (v0.2.8):** Motor de inferencia y razonamiento que deduce la intención técnica (CREATE, MODIFY, DELETE), conceptos clave y objetivos conceptuales a partir de solicitudes en lenguaje natural.
* **Change Simulation & Planning (v0.2.9):** Simulación de deltas e impacto arquitectónico antes de realizar escrituras físicas, generando un plan de ejecución secuencial y estimando la probabilidad de riesgos.
* **Safe Physical Execution (v0.3.0):** Escritura física transaccional y atómica en disco con exclusión mutua de archivos (Locks), validaciones automáticas post-cambio (Build, Tests Jest, linter DDD de gobernanza y control de alcance) y Rollback automático LIFO verificado byte-for-byte con hashes SHA-256.
* **Quality & Security SAST Integrations:** Orquesta herramientas de análisis estático externas de seguridad y linter líderes (como `ESLint` para JS/TS y `Bandit` para Python), consolidando los hallazgos en un reporte ejecutivo.
* **Deterministic AST Indexer & Incremental Updates:** Motor de indexación quirúrgica incremental basado en hashes SHA-256 y Git change tracking que analiza el AST nativo del repositorio sin expresiones regulares ni dependencia de LLMs, poblando el `ProjectModel` de manera rápida e idempotente.
* **Graph Core & Semantic Query Engine:** Motor relacional matemático que expone dependencias e importaciones transitivas a nivel File y Symbol, calcula caminos más cortos (`shortest path`), detecta dependencias circulares complejas (mediante Strongly Connected Components - Tarjan) y computa métricas de acoplamiento (Fan-in / Fan-out).
* **CLI Project Status & Technical Debt Dashboard:** Mapea la salud de tu repositorio en un Dashboard de consola visual (`asaf status`) con barras de progreso coloreadas, estado de Git y de la indexación incremental, y estimación de horas de Deuda Técnica.
* **Agent Runtime & Multi-agent Orchestration:** Secuencia interactiva de agentes virtuales (Solution Architect, Backend, DBA, QA) con verificación post-ejecución para evitar regresiones de calidad en cada tarea (`asaf run`).
* **Universal Agent Bridge (MCP Server):** Servidor native MCP (Model Context Protocol) sobre stdio para inyectar contexto y gobernanza directamente en asistentes de IA líderes como Cursor, Cline o Claude Code.
* **Closed-Loop In-Memory Autocorrection (v0.4.0):** Genera propuestas estructuradas de parches con LLMs desacoplados, implementa una doble barrera de seguridad logic/physical (Normalización Windows/POSIX, escape de traversal Unicode, symlinks), simula en memoria los imports reales de TypeScript resolviéndolos contra el tsconfig y el lote actual de cambios (No-Touch Disk), y autocorrige secuencialmente con inyección de feedback estructurado (hasta 3 reintentos) de forma 100% lógica.

---

## 📂 Estructura del Proyecto

```
ASAF/
├── advisor/         # Motor de recomendaciones enriquecidas (ADRs, riesgos, evolución).
├── agents/          # Pool de agentes y Agent Orchestrator (Solution Architect, Backend, QA, etc.).
├── blueprints/      # Plantillas de arquitectura de referencia (Clean Architecture, DDD).
├── cli/             # Interfaz de línea de comandos (CLI) principal de ASAF.
├── context/         # Motor de slicing sintáctico y vinculación de ADRs en prompts.
├── core/            # Núcleo de gobernanza, linter dinámico, specs, status, indexación incremental y grafo.
│   └── context/     # Context Intelligence Engine: CodeSlicer, ContextRanker, ContextBudget, UnifiedContextEngine.
├── discovery/       # Analizador AST con adaptadores modulares y grafos semánticos.
├── docs/            # Documentación de interfaces de comunicación y especificaciones de APIs.
├── generators/      # Generadores de infraestructura (Docker, Terraform, CI/CD).
├── mcp/             # Servidor Model Context Protocol (MCP) y herramientas de exposición.
└── templates/       # Plantillas internas.
```

---

## 💻 Comandos del CLI

### 1. `asaf init`
Inicializa el framework. Realiza preguntas de negocio e interactúa para aconsejar y configurar las políticas de arquitectura y capas en `asaf.json`.
```bash
npx asaf init
```

### 2. `asaf status`
Muestra el Dashboard de salud consolidado de forma visual con barras de progreso, estado de consistencia del índice Git, estimación de Deuda Técnica (horas de corrección) y findings abiertos.
```bash
npx asaf status
```

### 3. `asaf index`
Ejecuta la indexación determinista completa del AST del proyecto. Soporta la bandera `--incremental` para analizar únicamente archivos modificados en Git y el flag `--json` para agentes IA.
```bash
# Indexación completa
npx asaf index

# Indexación incremental rápida
npx asaf index --incremental
```

### 4. `asaf graph`
Grupo de comandos para consultar y analizar la topología relacional del proyecto sin LLM:
```bash
# Consultar dependencias directas/transitivas de un símbolo o archivo
npx asaf graph dependencies <nodeId> --depth <number|all>

# Consultar dependientes directos/transitivos de un símbolo o archivo
npx asaf graph dependents <nodeId> --depth <number|all>

# Buscar el camino de dependencias (shortest path) entre dos componentes
npx asaf graph path <from> <to>

# Visualizar métricas generales, Fan-in/out y dependencias circulares (Tarjan SCC)
npx asaf graph metrics
```

### 5. `asaf task "<desc>"`
Analiza una tarea de desarrollo prediciendo el impacto, dependencias afectadas, ADRs relacionados y entregando un plan paso a paso.
```bash
npx asaf task "Implementar autenticación JWT en controladores de usuarios"
```

### 6. `asaf context [task]`
Construye el contexto óptimo para modelos de IA usando el **Context Intelligence Engine**. Resuelve targets desde archivos explícitos, cambios Git o palabras clave de la tarea, aplica ranking por BFS y recorta el código al presupuesto de tokens especificado.
```bash
# Contexto por tarea semántica
npx asaf context "Implementar autenticación JWT"

# Contexto de archivos específicos con explicación del ranking
npx asaf context --file src/auth/auth.service.ts --explain

# Limitar el contexto a un presupuesto estricto de tokens
npx asaf context --file src/auth/auth.controller.ts --budget 8000 --json
```

### 7. `asaf run "<desc>"`
Inicia la orquestación interactiva del Agent Runtime, secuenciando los turnos de los agentes requeridos con flujos de aprobación y validación final de deuda técnica.
```bash
npx asaf run "Refactorizar y probar el linter de governance"
```

### 8. `asaf mcp`
Inicia el servidor Model Context Protocol (MCP) de ASAF sobre transporte `stdio` para integrarse con asistentes IA externos.
```bash
npx asaf mcp
```

### 9. `asaf audit`
Ejecuta la auditoría general, orquestando herramientas SAST locales (ESLint y Bandit) y generando un informe en `docs/audit-report.md`.
```bash
npx asaf audit
```

### 10. `asaf check`
Audita el linter de capas arquitectónicas leyendo las reglas de `asaf.json`. Retorna código `exit 1` en caso de fallos (ideal para CI/CD).
```bash
npx asaf check
```

### 11. `asaf adr`
Grupo de comandos para la gobernanza e inteligencia de Decisiones de Arquitectura (ADRs) vinculadas al grafo semántico:
```bash
# Listar todas las decisiones de arquitectura indexadas
npx asaf adr list [--json]

# Mostrar detalles estructurados y contexto de un ADR específico
npx asaf adr show <adrId> [--json]

# Auditar la consistencia bidireccional y detectar ciclos o relaciones rotas en los ADRs
npx asaf adr check [--json]

# Consultar qué partes del código están gobernadas directa o transitivamente por un ADR
npx asaf adr impact <adrId> [--json]
```

### 12. `asaf config llm`
Configura y guarda los parámetros del proveedor de LLM en el archivo `asaf.json`:
```bash
npx asaf config llm --provider ollama --model codegemma --host http://localhost:11434 --timeout 60000
```

### 13. `asaf generate "<task>"`
Orquesta la generación y validación de una propuesta estructurada mediante IA de forma 100% lógica y en memoria (No-Touch Disk). Ejecuta el bucle cerrado de verificación/autocorrección y guarda la propuesta en `.asaf/proposals/proposal-[id].json` calculando el hash pre-flights de los archivos.
```bash
npx asaf generate "Implementar autenticación JWT en controladores de usuarios" --budget 30000
```

### 14. `asaf execute "<task>"`
Genera un plan de cambio arquitectónico y lo ejecuta de forma segura en el disco. Por defecto corre en modo `DRY-RUN` (simulado). Pasa la bandera `--no-dry-run` para aplicar físicamente.

Admite el flag `--proposal <id>` para ejecutar directamente una propuesta de IA validada de forma transaccional, detectando automáticamente conflictos si el hash del disco no coincide con el guardado en la generación:
```bash
# Simular ejecución de tarea (DRY-RUN)
npx asaf execute "Refactorizar core/execution/types.ts"

# Ejecutar físicamente en disco con validaciones y rollback automático
npx asaf execute "Refactorizar core/execution/types.ts" --no-dry-run

# Ejecutar físicamente una propuesta estructurada validada de la IA
npx asaf execute --proposal prop-123 --no-dry-run
```

### 15. `asaf verify <sessionId>`
Corre la suite completa de verificación post-cambio (compilación TypeScript, pruebas unitarias relacionadas, consistencia de ADRs, gobernanza de capas DDD y alcance de archivos) sobre una sesión de ejecución existente.
```bash
npx asaf verify exec_1786464936737_s2no7
```

---

## 🔌 Herramientas MCP Disponibles

| Herramienta | Descripción |
|---|---|
| `asaf_build_context` | Construye el `AIContext` optimizado para una tarea o conjunto de archivos con budget de tokens. |
| `asaf_get_semantic_context` | Retorna dependencias, símbolos y tests relacionados de un nodo del grafo. |
| `asaf_analyze_task` | Analiza el impacto de una tarea en lenguaje natural sobre el grafo del proyecto. |
| `asaf_check_governance` | Audita las violaciones de capas de arquitectura según las reglas de `asaf.json`. |
| `asaf_get_graph_metrics` | Expone métricas de acoplamiento, Fan-in/out y SCC del grafo. |
| `asaf_check_adrs` | Valida la consistencia de los ADRs indexados detectando relaciones rotas y ciclos. |
| `asaf_get_adr_impact` | Traza qué archivos están gobernados por un ADR a través del grafo determinista. |
| `asaf_generate_proposal` | Orquesta en memoria (No-Touch Disk) la generación y validación de una propuesta estructurada mediante IA. |
| `asaf_execute_change` | Ejecuta un plan de cambio en modo dry-run o físico en disco. Retorna los detalles de la sesión. |
| `asaf_validate_change` | Corre las validaciones de compilación, tests y gobernanza post-cambio en una sesión. |
| `asaf_rollback_change` | Revierte atómicamente a nivel físico el disco al estado inicial pre-cambio usando copias de seguridad. |

---

## 📖 Guía de Adopción e Integración de Agentes (Cursor / Cline / Claude Code)

1. **Inicializar y Configurar:**
   Corre `npx asaf init` y configura tu arquitectura en `asaf.json`.
2. **Levantar el Servidor MCP:**
   Registra el comando `node <path-to-asaf>/dist/cli/index.js mcp` en tu configuración de MCP de Cursor o Cline.
3. **Consumir Herramientas:**
   Los asistentes llamarán de forma automática a `asaf_build_context`, `asaf_check_governance` y `asaf_analyze_task` para auto-limitarse al contexto mínimo de tokens y asegurar la calidad estructural del proyecto.

---

## 🗺️ Roadmap de Versiones

| Versión | Descripción |
|---|---|
| `v0.2.1` | Core Graph Engine + Shortest Path + SCC |
| `v0.2.2` | Indexación incremental + Git tracking |
| `v0.2.3` | Impact Engine determinista |
| `v0.2.4` | Architecture Governance Engine |
| `v0.2.5` | Specs Engine |
| `v0.2.6` | **ADR Intelligence Engine** — ADRs como entidades semánticas del grafo |
| `v0.2.7` | **Context Intelligence Engine** — CodeSlicer AST, ranking BFS explicable, planificador de budget serializado |
| `v0.2.8` | **Architectural Reasoning** — Inferencia de intenciones técnicas y objetivos conceptuales |
| `v0.2.9` | **Change Simulation & Planning** — Simulación de deltas arquitectónicos, estimación de impacto relacional y secuenciación de planes de ejecución |
| `v0.3.0` | **Safe Physical Execution** — Escritura física en disco transaccional, Locks, validaciones y rollback atómico verificado por SHA-256 (Release Candidate) |
| `v0.3.1` | **Seguridad Operacional** — Detección estricta de TOCTOU, Journaling idempotente LIFO, Locks exclusivos por sesión y auto-recuperación de sesiones huérfanas |
| `v0.4.0` | **Agente Autocorrector en Memoria** — Generación estructurada de parches con LLM, doble barrera lógica/física (LogicalSanitizer + PhysicalSafetyValidator), simulación in-memory de imports reales de TS (sin tocar disco), bucle cerrado de autocorrección lógica de 3 intentos e integración desacoplada en CLI/MCP |

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**.
