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
* **Quality & Security SAST Integrations:** Orquesta herramientas de análisis estático externas de seguridad y linter líderes (como `ESLint` para JS/TS y `Bandit` para Python), consolidando los hallazgos en un reporte ejecutivo.
* **CLI Project Status & Technical Debt Dashboard:** Mapea la salud de tu repositorio en un Dashboard de consola visual (`asaf status`) con barras de progreso coloreadas y estimación de horas de Deuda Técnica.
* **Agent Runtime & Multi-agent Orchestration:** Secuencia interactiva de agentes virtuales (Solution Architect, Backend, DBA, QA) con verificación post-ejecución para evitar regresiones de calidad en cada tarea (`asaf run`).
* **Universal Agent Bridge (MCP Server):** Servidor native MCP (Model Context Protocol) sobre stdio para inyectar contexto y gobernanza directamente en asistentes de IA líderes como Cursor, Cline o Claude Code.

---

## 📂 Estructura del Proyecto

```
ASAF/
├── advisor/         # Motor de recomendaciones enriquecidas (ADRs, riesgos, evolución).
├── agents/          # Pool de agentes y Agent Orchestrator (Solution Architect, Backend, QA, etc.).
├── blueprints/      # Plantillas de arquitectura de referencia (Clean Architecture, DDD).
├── cli/             # Interfaz de línea de comandos (CLI) principal de ASAF.
├── context/         # Motor de slicing sintáctico y vinculación de ADRs en prompts.
├── core/            # Núcleo de gobernanza, linter dinámico, specs, status y auditoría SAST.
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
Muestra el Dashboard de salud consolidado de forma visual con barras de progreso, estimación de Deuda Técnica (horas de corrección) y findings abiertos.
```bash
npx asaf status
```

### 3. `asaf task "<desc>"`
Analiza una tarea de desarrollo prediciendo el impacto, dependencias afectadas, ADRs relacionados y entregando un plan paso a paso.
```bash
npx asaf task "Implementar autenticación JWT en controladores de usuarios"
```

### 4. `asaf run "<desc>"`
Inicia la orquestación interactiva del Agent Runtime, secuenciando los turnos de los agentes requeridos con flujos de aprobación y validación final de deuda técnica.
```bash
npx asaf run "Refactorizar y probar el linter de governance"
```

### 5. `asaf mcp`
Inicia el servidor Model Context Protocol (MCP) de ASAF sobre transporte `stdio` para integrarse con asistentes IA externos.
```bash
npx asaf mcp
```

### 6. `asaf audit`
Ejecuta la auditoría general, orquestando herramientas SAST locales (ESLint y Bandit) y generando un informe en `docs/audit-report.md`.
```bash
npx asaf audit
```

### 7. `asaf check`
Audita el linter de capas arquitectónicas leyendo las reglas de `asaf.json`. Retorna código `exit 1` en caso de fallos (ideal para CI/CD).
```bash
npx asaf check
```

---

## 📖 Guía de Adopción e Integración de Agentes (Cursor / Cline / Claude Code)

1. **Inicializar y Configurar:**
   Corre `npx asaf init` y configura tu arquitectura en `asaf.json`.
2. **Levantar el Servidor MCP:**
   Registra el comando `node <path-to-asaf>/dist/cli/index.js mcp` en tu configuración de MCP de Cursor o Cline.
3. **Consumir Herramientas:**
   Los asistentes llamarán de forma automática a `asaf_get_semantic_context`, `asaf_check_governance` y `asaf_analyze_task` para auto-limitarse al contexto mínimo de tokens y asegurar la calidad estructural del proyecto.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**.
