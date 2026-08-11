#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const program = new Command();

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

program
  .name('asaf')
  .description('AI Software Architect Framework (ASAF) - CLI')
  .version('0.1.0');

// Comando: init
program
  .command('init')
  .description('Inicializa la configuración de ASAF en el repositorio actual, realiza la auditoría y configura las reglas automáticamente')
  .action(async () => {
    console.log(chalk.blue('Inicializando ASAF de forma automática...'));
    const projectDir = process.cwd();
    const configPath = path.join(projectDir, 'asaf.json');

    // Preguntar sobre la arquitectura
    console.log(chalk.cyan('\n¿Qué arquitectura deseas utilizar o tienes actualmente en el proyecto?'));
    console.log('  A) Clean Architecture (Recomendado para proyectos grandes, separación estricta de capas)');
    console.log('  B) DDD (Domain-Driven Design - Enfoque centrado en el dominio y lenguajes ubicuos)');
    console.log('  C) Otro / No sé (ASAF analizará tu proyecto y te sugerirá la mejor opción)');
    const archAns = (await askQuestion(chalk.yellow('Selecciona una opción (A/B/C) [A]: ')) || 'A').toUpperCase();

    let selectedArch = 'clean';
    let layersConfig: any = {};

    if (archAns === 'C') {
      console.log(chalk.yellow('\nAnalizando la estructura del proyecto para recomendar una arquitectura...'));
      // Escanear el directorio de manera básica para buscar pistas
      const rootFiles = fs.existsSync(projectDir) ? fs.readdirSync(projectDir) : [];
      let hasDomain = false;
      let hasControllers = false;
      let hasModels = false;

      const checkFolders = (dir: string, depth = 0) => {
        if (depth > 2) return;
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
              if (['node_modules', 'dist', '.git'].includes(file)) continue;
              const name = file.toLowerCase();
              if (name === 'domain' || name === 'use-cases') hasDomain = true;
              if (name === 'controllers' || name === 'routes' || name === 'views') hasControllers = true;
              if (name === 'models' || name === 'entities' || name === 'repositories') hasModels = true;
              checkFolders(fullPath, depth + 1);
            }
          }
        } catch (e) { }
      };
      checkFolders(projectDir);

      console.log(chalk.blue('\n--- Diagnóstico de ASAF ---'));
      if (hasDomain) {
        console.log(chalk.green('-> Se detectó una estructura compatible con Clean Architecture o DDD (carpetas "domain" o "use-cases").'));
        console.log(chalk.bold('Consejo:'));
        console.log('   Te recomendamos usar "Clean Architecture" para mantener las dependencias limpias e independientes de frameworks.');
        selectedArch = 'clean';
      } else if (hasControllers || hasModels) {
        console.log(chalk.green('-> Se detectó una estructura típica de arquitectura clásica por Capas o MVC (carpetas "controllers", "models").'));
        console.log(chalk.bold('Consejo:'));
        console.log('   Te recomendamos usar "Layered Architecture" (Capas) o "MVC". No es necesario migrar a Clean Architecture a menos que busques modularidad extrema.');
        selectedArch = 'layered';
      } else {
        console.log(chalk.green('-> No se detectaron carpetas de arquitectura claras (proyecto plano o nuevo).'));
        console.log(chalk.bold('Consejo:'));
        console.log('   Si es un proyecto nuevo o simple, Clean Architecture mantendrá tu lógica robusta desde el principio.');
        selectedArch = 'clean';
      }

      console.log(`\nASAF recomienda la arquitectura: ${chalk.bold(selectedArch.toUpperCase())}`);
      const confirmAns = (await askQuestion(chalk.yellow(`¿Deseas aplicar la recomendación de ASAF (${selectedArch.toUpperCase()})? (S/N) [S]: `)) || 'S').toUpperCase();
      if (confirmAns !== 'S' && confirmAns !== 'SI') {
        console.log('\nSelecciona de forma manual:');
        console.log('  A) Clean Architecture');
        console.log('  B) DDD (Domain-Driven Design)');
        console.log('  C) Layered Architecture (MVC / Capas tradicionales)');
        const manualAns = (await askQuestion('Selecciona una opción (A/B/C): ')).toUpperCase();
        selectedArch = manualAns === 'B' ? 'ddd' : manualAns === 'C' ? 'layered' : 'clean';
      }
    } else if (archAns === 'B') {
      selectedArch = 'ddd';
    } else {
      selectedArch = 'clean';
    }

    // Configurar las capas basadas en la selección
    if (selectedArch === 'clean') {
      layersConfig = {
        "domain": {
          "path": "domain/",
          "forbidden": ["use-cases", "infrastructure"],
          "severity": "error"
        },
        "use-cases": {
          "path": "use-cases/",
          "forbidden": ["infrastructure"],
          "severity": "error"
        }
      };
    } else if (selectedArch === 'ddd') {
      layersConfig = {
        "domain": {
          "path": "domain/model/",
          "forbidden": ["domain/services", "infrastructure"],
          "severity": "error"
        },
        "application": {
          "path": "application/",
          "forbidden": ["infrastructure"],
          "severity": "error"
        }
      };
    } else { // layered
      layersConfig = {
        "models": {
          "path": "models/",
          "forbidden": ["controllers"],
          "severity": "warning"
        }
      };
    }

    console.log(chalk.green(`\nAplicando configuración para la arquitectura: ${chalk.bold(selectedArch.toUpperCase())}`));

    // 1. Crear asaf.json si no existe o actualizarlo con la arquitectura seleccionada
    let config: any = {
      name: path.basename(projectDir),
      version: '0.1.0',
      description: 'Proyecto administrado por ASAF',
      discovery: {
        exclude: ['node_modules', 'dist', '.git']
      },
      architecture: {
        style: selectedArch,
        layers: layersConfig
      },
      decisions: {
        adrDir: 'docs/adr'
      }
    };

    if (fs.existsSync(configPath)) {
      try {
        const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        config = {
          ...existingConfig,
          architecture: {
            style: selectedArch,
            layers: layersConfig
          }
        };
      } catch (e) { }
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(chalk.green('✓ Archivo asaf.json configurado con la arquitectura elegida.'));

    try {
      // 2. Ejecutar análisis del grafo de dependencias
      console.log(chalk.yellow('Analizando dependencias del proyecto...'));
      const { DiscoveryEngine } = require('../discovery/index');

      let exclude = ['node_modules', 'dist', '.git'];
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.discovery && config.discovery.exclude) {
        exclude = config.discovery.exclude;
      }

      const discoveryEngine = new DiscoveryEngine(projectDir, exclude);
      const graph = discoveryEngine.analyze();

      const graphPath = path.join(projectDir, 'asaf-graph.json');
      fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), 'utf-8');

      // Generar grafo semántico
      const { SemanticAnalyzer } = require('../discovery/semantic');
      const semanticAnalyzer = new SemanticAnalyzer(graph);
      const semanticGraph = semanticAnalyzer.analyzeRelations();
      fs.writeFileSync(path.join(projectDir, 'asaf-semantic-graph.json'), JSON.stringify(semanticGraph, null, 2), 'utf-8');

      // Generar Knowledge Graph (Memoria de Proyecto)
      const { KnowledgeGraphBuilder } = require('../discovery/knowledge');
      const knowledgeBuilder = new KnowledgeGraphBuilder(projectDir, graph, semanticGraph);
      const knowledgeGraph = knowledgeBuilder.build();
      fs.writeFileSync(path.join(projectDir, 'asaf-knowledge-graph.json'), JSON.stringify(knowledgeGraph, null, 2), 'utf-8');

      console.log(chalk.green('✓ Grafo de dependencias y memoria semántica construidos.'));

      // 3. Generar especificaciones (Specs) e inicializar hashes incrementales
      console.log(chalk.yellow('Indexando módulos y configurando caché de tokens...'));
      const { SpecsEngine } = require('../core/specs');
      const { TokenSaverEngine } = require('../core/tokenSaver');

      const specsEngine = new SpecsEngine(projectDir);
      const tokenSaver = new TokenSaverEngine(projectDir);

      const files = Object.keys(graph.nodes);
      files.forEach((file: string) => {
        const fullFilePath = path.join(projectDir, file);
        if (fs.existsSync(fullFilePath)) {
          const content = fs.readFileSync(fullFilePath, 'utf-8');
          // Forzar primer análisis e indexación
          tokenSaver.checkNeedsAnalysis(file, content);
          specsEngine.analyzeAndGenerateSpec(file);
        }
      });

      tokenSaver.pruneMissingFiles(files);
      tokenSaver.saveHashes();
      specsEngine.updateSpecsIndex();

      console.log(chalk.green('✓ Especificaciones de módulos y catálogo indexados con éxito.'));

      // 4. Ejecutar Auditoría inicial de brechas
      console.log(chalk.yellow('Ejecutando auditoría de seguridad, SEO y base de datos...'));
      const { AuditEngine } = require('../core/audit');
      const auditEngine = new AuditEngine(projectDir);
      const breaches = auditEngine.runAudit(files);

      console.log(chalk.green(`✓ Auditoría de adopción finalizada. Brechas encontradas: ${breaches.length}`));

      // 5. Generar directivas para asistentes de IA (.cursorrules / .clinerules)
      console.log(chalk.yellow('Configurando directivas para asistentes de desarrollo (.cursorrules, .clinerules)...'));
      const { RulesGenerator } = require('./rules');
      const rulesGenerator = new RulesGenerator(projectDir);
      rulesGenerator.generate({ type: 'all' });

      console.log(chalk.green.bold('\n✓ ¡ASAF se ha inicializado y configurado de forma completa y automática!'));
      console.log(`Reporte ejecutivo de brechas disponible en: ${chalk.bold('docs/audit-report.md')}`);
      console.log(`Catálogo maestro de especificaciones en: ${chalk.bold('docs/specs/README.md')}`);
    } catch (error: any) {
      console.error(chalk.red(`Error durante la inicialización automática de ASAF: ${error.message}`));
    }
  });

// Comando: analyze
program
  .command('analyze')
  .argument('[taskDescription]', 'Descripción de la tarea de desarrollo')
  .description('Analiza el proyecto actual y genera un grafo de dependencias local, o produce un diagnóstico descriptivo sobre el grafo y la arquitectura para una tarea')
  .option('-d, --dir <path>', 'Directorio a analizar', '.')
  .option('--file <filePath>', 'Analiza tomando un archivo como target explícito')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (taskDescription, options) => {
    const projectDir = path.resolve(options.dir);

    // Lógica v0.2.8: Diagnóstico descriptivo para una tarea o archivo explícito
    if (taskDescription || options.file) {
      try {
        const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
        const { ArchitecturalReasoner } = require('../core/reasoning/architectural-reasoner');

        const store = new FileProjectIndexStore(projectDir);
        const model = await store.load();
        if (!model) {
          console.error(chalk.red('Proyecto no indexado. Ejecute primero "asaf index".'));
          process.exit(1);
        }

        const task = taskDescription || `Análisis para archivo ${options.file}`;
        const reasoner = new ArchitecturalReasoner(model);
        const plan = await reasoner.plan(task, {
          explicitFiles: options.file ? [options.file] : [],
          expandGraph: true
        });

        if (options.json) {
          console.log(JSON.stringify(plan, null, 2));
        } else {
          console.log(chalk.blue.bold('\nASAF Architectural Analysis - Diagnóstico descriptivo\n'));
          console.log(`Tarea:             ${chalk.bold(plan.task)}`);
          console.log(`Intención:         ${chalk.cyan(plan.intent.action)} (Confianza: ${plan.intent.confidence})`);
          console.log(`Áreas Técnicas:    ${plan.intent.technicalAreas.join(', ') || 'Ninguna detectada'}`);
          console.log(`Conceptos:         ${plan.intent.concepts.join(', ') || 'Ninguno'}`);
          console.log(`Targets:           ${plan.targets.join(', ') || 'Ninguno'}`);
          console.log(chalk.gray('────────────────────────────────────────'));

          console.log(chalk.bold('\nImpacto Estimado en el Grafo:'));
          console.log(`  Nodos Afectados:   ${plan.impact.affectedNodes.length}`);
          console.log(`  APIs Afectadas:    ${plan.changes.filter((c: any) => c.path.startsWith('api:')).length}`);
          console.log(`  BD Afectadas:      ${plan.changes.filter((c: any) => c.path.startsWith('db:')).length}`);
          console.log(`  Tests Afectados:   ${plan.tests.affected.length}`);

          console.log(chalk.bold('\nRiesgo y Severidad:'));
          console.log(`  Score de Riesgo:   ${plan.summary.riskScore} / 100`);
          console.log(`  Severidad:         ${chalk.bold(plan.summary.complexity)}`);
          if (plan.risks.length > 0) {
            console.log(chalk.gray('  Factores de Riesgo:'));
            plan.risks.forEach((r: any) => {
              const sign = r.contribution > 0 ? '+' : '';
              console.log(`    ${sign}${r.contribution} ${chalk.yellow(r.category)}: ${r.reason}`);
            });
          }

          if (plan.architecture.violations.length > 0) {
            console.log(chalk.red.bold('\nViolaciones de Gobernanza Activas:'));
            plan.architecture.violations.forEach((v: any) => {
              console.log(`  ✗ [${chalk.red(v.severity)}] ${v.ruleId}: ${v.description}`);
            });
          }

          if (plan.architecture.affectedADRs.length > 0) {
            console.log(chalk.bold('\nDecisiones de Arquitectura (ADRs) Mapeadas:'));
            plan.architecture.affectedADRs.forEach((a: any) => {
              console.log(`  ✓ ${chalk.yellow(a.adrId)}: ${a.title} [Status: ${a.status}] (${a.impactType})`);
            });
          }
          console.log();
        }
      } catch (e: any) {
        console.error(chalk.red(`Error al analizar la tarea: ${e.message}`));
        process.exit(1);
      }
      return;
    }

    // Lógica v0.2.7 original: Descubrimiento de dependencias global
    console.log(chalk.blue(`Iniciando el análisis del proyecto en: ${projectDir}`));

    try {
      const { DiscoveryEngine } = require('../discovery/index');

      // Leer exclusiones de asaf.json si existe
      let exclude = ['node_modules', 'dist', '.git'];
      const configPath = path.join(projectDir, 'asaf.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.discovery && config.discovery.exclude) {
          exclude = config.discovery.exclude;
        }
      }

      const engine = new DiscoveryEngine(projectDir, exclude);
      const graph = engine.analyze();

      const outputPath = path.join(projectDir, 'asaf-graph.json');
      fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2), 'utf-8');

      // Generar grafo semántico
      const { SemanticAnalyzer } = require('../discovery/semantic');
      const semanticAnalyzer = new SemanticAnalyzer(graph);
      const semanticGraph = semanticAnalyzer.analyzeRelations();

      const semanticOutputPath = path.join(projectDir, 'asaf-semantic-graph.json');
      fs.writeFileSync(semanticOutputPath, JSON.stringify(semanticGraph, null, 2), 'utf-8');

      // Generar Knowledge Graph (Memoria de Proyecto)
      const { KnowledgeGraphBuilder } = require('../discovery/knowledge');
      const knowledgeBuilder = new KnowledgeGraphBuilder(projectDir, graph, semanticGraph);
      const knowledgeGraph = knowledgeBuilder.build();

      const knowledgeOutputPath = path.join(projectDir, 'asaf-knowledge-graph.json');
      fs.writeFileSync(knowledgeOutputPath, JSON.stringify(knowledgeGraph, null, 2), 'utf-8');

      console.log(chalk.green(`Análisis completado con éxito.`));
      console.log(`Lenguajes detectados: ${chalk.cyan(graph.metadata.detectedLanguages.join(', '))}`);
      console.log(`Archivos indexados: ${chalk.cyan(Object.keys(graph.nodes).length)}`);
      console.log(`Grafo semántico guardado en: ${chalk.bold(semanticOutputPath)}`);
      console.log(`Knowledge Graph guardado en: ${chalk.bold(knowledgeOutputPath)}`);
    } catch (error: any) {
      console.error(chalk.red(`Error durante el análisis: ${error.message}`));
    }
  });

// Comando: context
program
  .command('context')
  .description('Muestra el contexto dinámico y acotado (archivos modificados y su impacto)')
  .option('--prompt', 'Exporta el contexto completo formateado como prompt de sistema de IA')
  .action((options) => {
    const projectDir = process.cwd();
    try {
      const { ContextEngine } = require('../context/index');
      const contextEngine = new ContextEngine(projectDir);

      if (!contextEngine.isGitRepository()) {
        console.log(chalk.red('El directorio actual no es un repositorio Git.'));
        return;
      }

      // Intentar cargar el grafo de dependencias y la base de conocimiento
      let graph: any = null;
      const graphPath = path.join(projectDir, 'asaf-graph.json');
      if (fs.existsSync(graphPath)) {
        try {
          graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
        } catch (e) { }
      }

      let knowledgeGraph: any = null;
      const knowledgeGraphPath = path.join(projectDir, 'asaf-knowledge-graph.json');
      if (fs.existsSync(knowledgeGraphPath)) {
        try {
          knowledgeGraph = JSON.parse(fs.readFileSync(knowledgeGraphPath, 'utf-8'));
        } catch (e) { }
      }

      if (options.prompt) {
        const promptOutput = contextEngine.exportAsPrompt(graph, knowledgeGraph);
        console.log(promptOutput);
        return;
      }

      const dynamicContext = contextEngine.getDynamicContext(graph, knowledgeGraph);

      console.log(chalk.blue('--- Context Engine (Optimización de Contexto) ---'));
      console.log(`Archivos cambiados detectados por Git: ${chalk.cyan(dynamicContext.changedFiles.length)}`);
      dynamicContext.changedFiles.forEach((f: any) => {
        console.log(`  - [${f.status}] ${chalk.yellow(f.relativePath)}`);
      });

      console.log(`\nArchivos relevantes para el contexto de la IA (impacto): ${chalk.cyan(dynamicContext.relevantFiles.length)}`);
      dynamicContext.relevantFiles.forEach((f: string) => {
        console.log(`  - ${chalk.green(f)}`);
      });

      if (dynamicContext.relevantADRs && dynamicContext.relevantADRs.length > 0) {
        console.log(`\nDecisiones de arquitectura (ADRs) vinculadas: ${chalk.cyan(dynamicContext.relevantADRs.length)}`);
        dynamicContext.relevantADRs.forEach((adr: any) => {
          console.log(`  - [ADR-${adr.id}] ${chalk.yellow(adr.title)} (${adr.recommendation})`);
        });
      }

      if (!graph) {
        console.log(chalk.yellow('\nTip: Ejecuta "asaf analyze" primero para mapear impactos de dependencias de importación.'));
      }
    } catch (error: any) {
      console.error(chalk.red(`Error al generar contexto: ${error.message}`));
    }
  });

// Comando: interview
program
  .command('interview')
  .description('Inicia la entrevista de negocio interactiva para guiar la arquitectura')
  .action(async () => {
    try {
      const { ProjectInterviewEngine } = require('../advisor/interview');
      const engine = new ProjectInterviewEngine();
      const answers = await engine.run();

      console.log(chalk.green('\nEntrevista finalizada con éxito. Respuestas guardadas en asaf.json.'));
      console.log(chalk.cyan('Ejecuta "asaf advise" para generar las recomendaciones arquitectónicas.'));
    } catch (error: any) {
      console.error(chalk.red(`Error durante la entrevista: ${error.message}`));
    }
  });

// Comando: advise
program
  .command('advise')
  .description('Genera propuestas arquitectónicas basadas en el análisis y la entrevista')
  .option('--apply', 'Genera automáticamente los ADRs (Architecture Decision Records)')
  .action(async (options) => {
    const projectDir = process.cwd();
    const configPath = path.join(projectDir, 'asaf.json');

    if (!fs.existsSync(configPath)) {
      console.log(chalk.red('El archivo asaf.json no existe. Ejecuta "asaf init" primero.'));
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (!config.businessProfile) {
        console.log(chalk.yellow('No se ha detectado perfil de negocio. Ejecuta "asaf interview" primero para mejores recomendaciones.'));
        // Usar perfil por defecto
        config.businessProfile = {
          problemDescription: 'Proyecto genérico',
          userVolume: 'bajo',
          budget: 'bajo',
          cloudPreference: 'paas',
          financialData: false,
          mobileApp: false
        };
      }

      let graph: any = null;
      const graphPath = path.join(projectDir, 'asaf-graph.json');
      if (fs.existsSync(graphPath)) {
        try {
          graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
        } catch (e) { }
      }

      const { ArchitectureAdvisor } = require('../advisor/index');
      const advisor = new ArchitectureAdvisor(config.businessProfile, graph);
      const recommendations = advisor.generateRecommendations();

      console.log(chalk.blue.bold('\n=== Recomendaciones de Arquitectura de ASAF ===\n'));

      recommendations.forEach((rec: any, idx: number) => {
        console.log(`${chalk.green.bold(`[${rec.category}]`)} ${chalk.cyan(rec.item)}`);
        console.log(`  -> Recomendación: ${chalk.bold(rec.recommendation)}`);
        console.log(`  -> Justificación: ${rec.justification}`);
        console.log(`  -> Costo Estimado: ${chalk.yellow(rec.estimatedCost)}`);
        console.log(`  -> Confianza: ${rec.confidence}%\n`);
      });

      if (options.apply) {
        console.log(chalk.blue('Generando ADRs (Architecture Decision Records) en docs/adr/...'));
        const { DecisionEngine } = require('../advisor/decision');
        const decisionEngine = new DecisionEngine(config.decisions?.adrDir || 'docs/adr');

        recommendations.forEach((rec: any, idx: number) => {
          const filePath = decisionEngine.generateADR(rec, idx + 1);
          console.log(`  - Creado: ${chalk.green(path.relative(projectDir, filePath))}`);
        });
        console.log(chalk.green('\nADRs generados con éxito. Revisa docs/adr/README.md para el índice.'));
      } else {
        console.log(chalk.cyan('Usa "asaf advise --apply" para registrar estas recomendaciones como ADRs oficiales.'));
      }
    } catch (error: any) {
      console.error(chalk.red(`Error al procesar recomendaciones: ${error.message}`));
    }
  });

// Comando: agents
program
  .command('agents')
  .description('Lista los agentes de IA especializados disponibles en el pool de ASAF')
  .action(() => {
    try {
      const { AgentsPool } = require('../agents/index');
      const pool = new AgentsPool();
      console.log(chalk.blue.bold('\n=== Pool de Agentes Especializados de ASAF ===\n'));
      pool.listAgents().forEach((name: string) => {
        const agent = pool.getAgent(name);
        if (agent) {
          console.log(`${chalk.green.bold(`[Role]`)} ${chalk.cyan(agent.role)}`);
          console.log(`  -> Objetivo: ${agent.objective}`);
          console.log(`  -> Entradas: ${chalk.yellow(agent.inputs.join(', '))}`);
          console.log(`  -> Salidas: ${chalk.green(agent.outputs.join(', '))}`);
          console.log(`  -> Checklist: \n${agent.checklist.map((c: string) => `     - ${c}`).join('\n')}\n`);
        }
      });
    } catch (e: any) {
      console.error(chalk.red(`Error al listar agentes: ${e.message}`));
    }
  });

// Comando: blueprint
program
  .command('blueprint')
  .description('Instancia un andamiaje (scaffolding) de código basado en un Blueprint aprobado')
  .option('-n, --name <name>', 'Nombre del blueprint a instanciar (ej. nestjs-clean-architecture)', 'nestjs-clean-architecture')
  .option('-o, --out <path>', 'Ruta de salida', './scaffold-project')
  .action(async (options) => {
    try {
      const targetPath = path.resolve(options.out);
      console.log(chalk.blue(`Instanciando blueprint [${options.name}] en: ${targetPath}`));

      if (options.name === 'nestjs-clean-architecture') {
        const { NestJSCleanArchitectureBlueprint } = require('../blueprints/nestjs');
        const blueprint = new NestJSCleanArchitectureBlueprint();
        await blueprint.generateStructure(targetPath);
        console.log(chalk.green(`\n¡Proyecto creado exitosamente usando el blueprint NestJS!`));
      } else {
        console.log(chalk.red(`Blueprint "${options.name}" no soportado de momento.`));
      }
    } catch (e: any) {
      console.error(chalk.red(`Error al instanciar blueprint: ${e.message}`));
    }
  });

// Comando: rules
program
  .command('rules')
  .description('Genera archivos de directivas arquitectónicas para asistentes de IA (.cursorrules, .clinerules)')
  .option('-t, --type <type>', 'Tipo de reglas a generar (all | cursor | cline)', 'all')
  .action((options) => {
    try {
      console.log(chalk.blue('Generando reglas para asistentes de IA...'));
      const { RulesGenerator } = require('./rules');
      const generator = new RulesGenerator();
      generator.generate({ type: options.type });
      console.log(chalk.green('Reglas arquitectónicas generadas exitosamente.'));
    } catch (e: any) {
      console.error(chalk.red(`Error al generar reglas: ${e.message}`));
    }
  });

// Comando: specs
program
  .command('specs')
  .description('Genera o actualiza las especificaciones (specs) y el índice maestro de módulos')
  .option('-f, --file <path>', 'Ruta de un archivo/módulo específico a procesar')
  .option('-a, --all', 'Analiza todo el proyecto y actualiza todos los specs')
  .action((options) => {
    try {
      const { SpecsEngine } = require('../core/specs');
      const engine = new SpecsEngine(process.cwd());

      if (options.file) {
        console.log(chalk.blue(`Procesando spec para el módulo: ${options.file}`));
        engine.analyzeAndGenerateSpec(options.file);
      } else if (options.all) {
        console.log(chalk.blue('Procesando especificaciones para todo el proyecto...'));

        // Obtener archivos del grafo de dependencias local si existe
        const graphPath = path.join(process.cwd(), 'asaf-graph.json');
        if (fs.existsSync(graphPath)) {
          const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
          const files = Object.keys(graph.nodes);
          files.forEach((file: string) => {
            if (file.endsWith('.ts') || file.endsWith('.js')) {
              engine.analyzeAndGenerateSpec(file);
            }
          });
        } else {
          console.log(chalk.yellow('asaf-graph.json no encontrado. Ejecuta primero "npm run dev -- analyze".'));
        }
      } else {
        console.log(chalk.blue('Actualizando el índice maestro de especificaciones...'));
        engine.updateSpecsIndex();
      }
      console.log(chalk.green('Operación de especificaciones completada.'));
    } catch (e: any) {
      console.error(chalk.red(`Error al procesar especificaciones: ${e.message}`));
    }
  });

// Comando: check
program
  .command('check')
  .description('Audita el cumplimiento de las capas arquitectónicas del proyecto (Linter de Gobernanza)')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { ArchitectureGovernanceEngine } = require('../core/infrastructure/governance/governance-engine');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        console.error(chalk.red('Proyecto no indexado. Ejecute primero "asaf index".'));
        process.exit(1);
      }

      const govEngine = new ArchitectureGovernanceEngine(model, projectDir);
      const report = govEngine.checkRules();

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(chalk.blue.bold('\nASAF Architecture Governance - Auditoría de Capas\n'));
        console.log(`Reglas Evaluadas: ${chalk.cyan(report.totalRules)}`);
        console.log(`Archivos Auditados: ${chalk.cyan(report.totalFiles)}`);
        console.log(`Violaciones:      ${report.status === 'pass' ? chalk.green('0') : chalk.red(report.violations.length)}`);
        console.log(`Errores:          ${chalk.red(report.errors)}`);
        console.log(`Warnings:         ${chalk.yellow(report.warnings)}`);
        console.log(chalk.gray('────────────────────────────────────────\n'));

        if (report.violations.length > 0) {
          report.violations.forEach((v: any, idx: number) => {
            const label = v.severity === 'error' ? chalk.red.bold('ERROR') : chalk.yellow.bold('WARNING');
            console.log(`${label} [${idx + 1}] en ${chalk.bold(v.file)}`);
            console.log(`  Importación no permitida: ${chalk.yellow(v.importedPath)}`);
            console.log(`  Regla de gobernanza:     ${v.rule}`);
            if (v.adrLink) {
              console.log(`  Decisión Vinculada:      ${chalk.cyan(v.adrLink)}`);
            }
            console.log();
          });
        } else {
          console.log(chalk.green.bold('✓ ¡Auditoría exitosa! No se detectaron violaciones arquitectónicas en el proyecto.'));
        }
      }

      if (report.errors > 0) {
        process.exit(1);
      }
    } catch (e: any) {
      console.error(chalk.red(`Error al ejecutar auditoría de gobernanza: ${e.message}`));
      process.exit(1);
    }
  });

// Comando: deploy
program
  .command('deploy')
  .description('Genera archivos de configuración de infraestructura, contenedores y pipelines CI/CD')
  .option('-c, --cloud <cloud>', 'Preferencia de nube (aws | azure | paas)', '')
  .action((options) => {
    const projectDir = process.cwd();
    const configPath = path.join(projectDir, 'asaf.json');
    let cloudPreference: 'aws' | 'azure' | 'paas' = 'paas';

    if (options.cloud) {
      const selected = options.cloud.toLowerCase();
      if (['aws', 'azure', 'paas'].includes(selected)) {
        cloudPreference = selected as any;
      }
    } else if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.businessProfile && config.businessProfile.cloudPreference) {
          cloudPreference = config.businessProfile.cloudPreference;
        }
      } catch (e) { }
    }

    try {
      console.log(chalk.blue(`Iniciando generación de configuración de despliegue para: ${chalk.bold(cloudPreference.toUpperCase())}...`));
      const { DeploymentEngine } = require('../generators/deployment');
      const engine = new DeploymentEngine(projectDir);
      engine.generateDeploymentFiles(cloudPreference);
      console.log(chalk.green('Configuraciones de despliegue generadas exitosamente.'));
    } catch (e: any) {
      console.error(chalk.red(`Error durante la generación de infraestructura: ${e.message}`));
    }
  });

// Comando: audit
program
  .command('audit')
  .description('Analiza todo el proyecto inicial, genera specs y produce un informe de brechas e ineficiencias')
  .action(async () => {
    const projectDir = process.cwd();
    console.log(chalk.blue('Iniciando auditoría general de adopción ASAF...'));

    try {
      // 1. Ejecutar análisis del grafo de dependencias
      console.log(chalk.yellow('Analizando dependencias y construyendo el grafo semántico...'));
      const { DiscoveryEngine } = require('../discovery/index');

      let exclude = ['node_modules', 'dist', '.git'];
      const configPath = path.join(projectDir, 'asaf.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.discovery && config.discovery.exclude) {
          exclude = config.discovery.exclude;
        }
      }

      const discoveryEngine = new DiscoveryEngine(projectDir, exclude);
      const graph = discoveryEngine.analyze();

      const graphPath = path.join(projectDir, 'asaf-graph.json');
      fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), 'utf-8');

      // 2. Generar especificaciones (Specs) e Indexar incrementalmente
      console.log(chalk.yellow('Generando especificaciones de módulos e inicializando caché de tokens...'));
      const { SpecsEngine } = require('../core/specs');
      const { TokenSaverEngine } = require('../core/tokenSaver');

      const specsEngine = new SpecsEngine(projectDir);
      const tokenSaver = new TokenSaverEngine(projectDir);

      const files = Object.keys(graph.nodes);
      let analyzedCount = 0;

      files.forEach((file: string) => {
        const fullFilePath = path.join(projectDir, file);
        if (fs.existsSync(fullFilePath)) {
          const content = fs.readFileSync(fullFilePath, 'utf-8');
          // Solo analiza y genera spec si el archivo ha cambiado (Ahorro de tokens)
          if (tokenSaver.checkNeedsAnalysis(file, content)) {
            specsEngine.analyzeAndGenerateSpec(file);
            analyzedCount++;
          }
        }
      });

      tokenSaver.pruneMissingFiles(files);
      tokenSaver.saveHashes();
      specsEngine.updateSpecsIndex();

      console.log(chalk.green(`Caché incremental actualizada. Módulos analizados: ${analyzedCount}/${files.length} (Tokens Ahorrados).`));

      // 3. Ejecutar Auditoría de Brechas (Seguridad, DB, SEO, Escalabilidad)
      console.log(chalk.yellow('Escaneando brechas de seguridad, optimización DB, SEO y escalabilidad...'));
      const { AuditEngine } = require('../core/audit');
      const auditEngine = new AuditEngine(projectDir);
      const breaches = auditEngine.runAudit(files);

      console.log(chalk.green.bold(`\n✓ ¡Auditoría completada! Se detectaron ${breaches.length} brechas de gobernanza.`));
      console.log(`Informe ejecutivo disponible en: ${chalk.bold('docs/audit-report.md')}`);
    } catch (error: any) {
      console.error(chalk.red(`Error durante la auditoría del proyecto: ${error.message}`));
    }
  });

// Comando: task
program
  .command('task <description>')
  .description('Analiza una tarea de desarrollo y genera un reporte estructurado de impacto, riesgo y plan de acción')
  .action(async (description) => {
    const projectDir = process.cwd();
    console.log(chalk.blue(`Iniciando planificación e inteligencia de impacto para la tarea:`));
    console.log(chalk.cyan.bold(`"${description}"\n`));

    try {
      let graph: any = null;
      const graphPath = path.join(projectDir, 'asaf-graph.json');
      if (fs.existsSync(graphPath)) {
        graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
      } else {
        console.log(chalk.yellow('asaf-graph.json no encontrado. Analizando dinámicamente...'));
        const { DiscoveryEngine } = require('../discovery/index');
        const discovery = new DiscoveryEngine(projectDir);
        graph = discovery.analyze();
      }

      let knowledgeGraph: any = null;
      const knowledgeGraphPath = path.join(projectDir, 'asaf-knowledge-graph.json');
      if (fs.existsSync(knowledgeGraphPath)) {
        knowledgeGraph = JSON.parse(fs.readFileSync(knowledgeGraphPath, 'utf-8'));
      }

      const { TaskEngine } = require('../core/task');
      const taskEngine = new TaskEngine(projectDir, graph, knowledgeGraph);
      const report = taskEngine.analyzeTask(description);

      console.log(chalk.bold('--- REPORT EXECUTIVE OF TASK PLANNING ---'));
      console.log(`Nivel de Riesgo Técnico: ${report.risk === 'alto' ? chalk.red.bold('ALTO') : report.risk === 'medio' ? chalk.yellow.bold('MEDIO') : chalk.green.bold('BAJO')}`);
      console.log(`Budget de Contexto Estimado: ${chalk.magenta(`${report.estimatedTokens} tokens`)}`);

      console.log(chalk.cyan('\n📂 Archivos involucrados y bajo impacto (Slicing):'));
      report.estimatedFiles.forEach((file: string) => {
        console.log(`  - ${chalk.yellow(file)}`);
      });

      if (report.impactedDependencies.length > 0) {
        console.log(chalk.cyan('\n⚙️ Componentes / Servicios Afectados:'));
        console.log(`  ${report.impactedDependencies.join(', ')}`);
      }

      if (report.relevantADRs.length > 0) {
        console.log(chalk.cyan('\n📜 Restricciones de Arquitectura vinculadas (ADRs):'));
        report.relevantADRs.forEach((adr: any) => {
          console.log(`  - [ADR-${adr.id}] ${chalk.bold(adr.title)} (${adr.category})`);
        });
      }

      console.log(chalk.green('\n🎯 Plan de Acción Sugerido (Paso a Paso):'));
      report.steps.forEach((step: string) => {
        console.log(`  ${step}`);
      });

    } catch (error: any) {
      console.error(chalk.red(`Error al analizar la tarea: ${error.message}`));
    }
  });

// Comando: status
program
  .command('status')
  .description('Muestra la salud del proyecto actual, riesgos y métricas de deuda técnica de forma visual')
  .action(async () => {
    const projectDir = process.cwd();

    try {
      // Cargar metadatos de Index y Git
      let indexStatusText = chalk.gray('No indexado (Ejecute primero "asaf index")');
      try {
        const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
        const { GitChangeDetector } = require('../core/infrastructure/git/git-change-detector');

        const store = new FileProjectIndexStore(projectDir);
        const model = await store.load();
        if (model) {
          const detector = new GitChangeDetector(projectDir);
          const changes = await detector.getChanges();
          const isStale = model.git.indexedCommit !== model.git.headCommit || changes.length > 0;

          indexStatusText = `  Index Status:     ${isStale ? chalk.yellow.bold('STALE (Requiere asaf index --incremental)') : chalk.green.bold('UP TO DATE')}
  Commit Indexado:  ${chalk.gray(model.git.indexedCommit || 'N/A')}
  Commit HEAD:      ${chalk.gray(model.git.headCommit || 'N/A')}
  Archivos Sucios:  ${changes.length > 0 ? chalk.yellow(changes.length) : chalk.green('0')}
  Última Actualiz.: ${chalk.gray(model.indexMetadata?.updatedAt || 'N/A')}`;
        }
      } catch (e) { }

      console.log(chalk.blue.bold('\nASAF Project Intelligence - Estado del Proyecto\n'));
      console.log(chalk.cyan.bold('Index & Git Engine:'));
      console.log(indexStatusText);
      console.log(chalk.bold('\n────────────────────────────────────────'));
      let graph: any = null;
      const graphPath = path.join(projectDir, 'asaf-graph.json');
      if (fs.existsSync(graphPath)) {
        graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
      } else {
        console.log(chalk.yellow('asaf-graph.json no encontrado. Analizando dinámicamente...'));
        const { DiscoveryEngine } = require('../discovery/index');
        const discovery = new DiscoveryEngine(projectDir);
        graph = discovery.analyze();
      }

      const { ProjectStatusEngine } = require('../core/status');
      const statusEngine = new ProjectStatusEngine(projectDir, graph);
      const status = statusEngine.calculateStatus();

      const formatScore = (score: number) => {
        const bar = statusEngine.getProgressBar(score);
        if (score >= 90) return `${chalk.green(bar)} ${chalk.green.bold(`${score}%`)} ${chalk.green('✓')}`;
        if (score >= 70) return `${chalk.yellow(bar)} ${chalk.yellow.bold(`${score}%`)} ${chalk.yellow('⚠')}`;
        return `${chalk.red(bar)} ${chalk.red.bold(`${score}%`)} ${chalk.red('✗')}`;
      };

      console.log(`Arquitectura:       ${formatScore(status.architectureScore)}`);
      console.log(`Seguridad:          ${formatScore(status.securityScore)}`);
      console.log(`Base de Datos:      ${formatScore(status.databaseScore)}`);
      console.log(`Calidad SEO:        ${formatScore(status.seoScore)}`);

      console.log(chalk.cyan.bold('\nDeuda Técnica Estimada:'));
      console.log(`Esfuerzo de Corrección: ${chalk.yellow.bold(`${status.technicalDebtHours} horas`)}`);

      console.log(chalk.cyan.bold('\nHallazgos Abiertos (Findings):'));
      console.log(`  Críticos:    ${status.findings.critical > 0 ? chalk.red.bold(status.findings.critical) : chalk.green('0')}`);
      console.log(`  Altos:       ${status.findings.high > 0 ? chalk.red(status.findings.high) : chalk.green('0')}`);
      console.log(`  Medios:      ${status.findings.medium > 0 ? chalk.yellow(status.findings.medium) : chalk.green('0')}`);
      console.log(`  Bajos:       ${status.findings.low > 0 ? chalk.cyan(status.findings.low) : chalk.green('0')}`);

      console.log(chalk.bold('\n────────────────────────────────────────'));
    } catch (error: any) {
      console.error(chalk.red(`Error al calcular estado del proyecto: ${error.message}`));
    }
  });

// Comando: index
program
  .command('index')
  .description('Analiza e indexa de forma determinista el árbol AST del proyecto guardándolo en .asaf/')
  .option('--incremental', 'Indexa únicamente los archivos modificados desde la última ejecución', false)
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (options) => {
    const projectDir = process.cwd();
    const startTime = Date.now();

    if (!options.json) {
      console.log(chalk.blue.bold('\nASAF Project Intelligence - Indexing Engine\n'));
    }

    try {
      const { DeterministicProjectIndexer } = require('../core/infrastructure/indexing/project-indexer');
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { GitChangeDetector } = require('../core/infrastructure/git/git-change-detector');

      const store = new FileProjectIndexStore(projectDir);
      const indexer = new DeterministicProjectIndexer(projectDir);

      let model;

      if (options.incremental) {
        const existingModel = await store.load();
        if (!existingModel) {
          if (!options.json) console.log(chalk.yellow('No se encontró un índice previo. Ejecutando indexación completa...'));
          model = await indexer.index();
        } else {
          const detector = new GitChangeDetector(projectDir);
          const changes = await detector.getChanges();
          if (changes.length === 0) {
            if (options.json) {
              console.log(JSON.stringify({ message: 'Index is already up to date.', changes: 0 }, null, 2));
              return;
            }
            console.log(chalk.green('✓ El índice ya se encuentra actualizado de forma incremental (0 cambios detectados).'));
            return;
          }
          if (!options.json) console.log(chalk.gray(`Actualizando incrementalmente ${changes.length} archivos cambiados...`));
          model = await indexer.update(existingModel, changes);
        }
      } else {
        if (!options.json) console.log(chalk.gray('Escaneando archivos y parseando AST...'));
        model = await indexer.index();
      }

      await store.save(model);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      if (options.json) {
        console.log(JSON.stringify({
          status: 'success',
          duration,
          files: model.files.length,
          symbols: model.symbols.length,
          relations: model.relations.length,
          errors: model.indexMetadata.diagnostics.length
        }, null, 2));
        return;
      }

      console.log(chalk.green(`✓ ¡Indexación finalizada en ${duration}s!\n`));
      console.log(`Proyecto:       ${chalk.bold(model.project.name)}`);
      console.log(`Archivos:       ${model.files.length}`);
      console.log(`Símbolos:       ${model.symbols.length}`);
      console.log(`Relaciones:     ${model.relations.length}`);
      console.log(`Diagnósticos:   ${model.indexMetadata.diagnostics.length > 0 ? chalk.yellow(model.indexMetadata.diagnostics.length) : chalk.green('0')}`);
      console.log(`Ubicación:      .asaf/index/project.json`);

      if (model.indexMetadata.diagnostics.length > 0) {
        console.log(chalk.yellow.bold('\nDiagnósticos de indexación:'));
        model.indexMetadata.diagnostics.forEach((d: any) => {
          console.log(`  ⚠ ${d.file}: ${d.message}`);
        });
      }

      console.log(chalk.bold('\n────────────────────────────────────────'));
    } catch (error: any) {
      if (options.json) {
        console.log(JSON.stringify({ status: 'error', message: error.message }, null, 2));
      } else {
        console.error(chalk.red(`Error al indexar el proyecto: ${error.message}`));
      }
    }
  });

// Comando: run
program
  .command('run <taskDescription>')
  .description('Inicia la orquestación interactiva del Agent Runtime para resolver una tarea')
  .action(async (taskDescription) => {
    const projectDir = process.cwd();
    try {
      let graph: any = null;
      const graphPath = path.join(projectDir, 'asaf-graph.json');
      if (fs.existsSync(graphPath)) {
        graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
      } else {
        const { DiscoveryEngine } = require('../discovery/index');
        const discovery = new DiscoveryEngine(projectDir);
        graph = discovery.analyze();
      }

      let knowledgeGraph: any = null;
      const knowledgeGraphPath = path.join(projectDir, 'asaf-knowledge-graph.json');
      if (fs.existsSync(knowledgeGraphPath)) {
        knowledgeGraph = JSON.parse(fs.readFileSync(knowledgeGraphPath, 'utf-8'));
      }

      const { AgentOrchestrator } = require('../agents/orchestrator');
      const orchestrator = new AgentOrchestrator(projectDir, graph, knowledgeGraph);
      await orchestrator.orchestrate(taskDescription);
    } catch (error: any) {
      console.error(chalk.red(`Error en la orquestación del Agent Runtime: ${error.message}`));
    }
  });

// Grupo de comandos: graph
const graphCmd = program
  .command('graph')
  .description('Navega y consulta la topología del grafo semántico e importaciones del proyecto');

graphCmd
  .command('dependencies <nodeId>')
  .description('Muestra las dependencias directas y transitivas de un archivo o símbolo')
  .option('-d, --depth <number>', 'Profundidad máxima de análisis', '1')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (nodeId, options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { DeterministicGraphQueryEngine } = require('../core/infrastructure/graph/query-engine');
      const { GraphResultFormatter } = require('../core/infrastructure/graph/graph-formatter');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        throw new Error('Proyecto no indexado. Ejecute primero "asaf index".');
      }

      const engine = new DeterministicGraphQueryEngine(model);
      const depth = options.depth === 'all' ? 'all' : parseInt(options.depth, 10);
      const deps = engine.getDependencies(nodeId, { depth });

      console.log(GraphResultFormatter.formatDependencies(nodeId, deps, options.json));
    } catch (e: any) {
      if (options.json) {
        console.log(JSON.stringify({ error: 'NODE_NOT_FOUND', message: e.message }, null, 2));
      } else {
        console.error(chalk.red(`Error: ${e.message}`));
      }
    }
  });

graphCmd
  .command('dependents <nodeId>')
  .description('Muestra los dependientes directos y transitivos de un archivo o símbolo')
  .option('-d, --depth <number>', 'Profundidad máxima de análisis', '1')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (nodeId, options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { DeterministicGraphQueryEngine } = require('../core/infrastructure/graph/query-engine');
      const { GraphResultFormatter } = require('../core/infrastructure/graph/graph-formatter');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        throw new Error('Proyecto no indexado. Ejecute primero "asaf index".');
      }

      const engine = new DeterministicGraphQueryEngine(model);
      const depth = options.depth === 'all' ? 'all' : parseInt(options.depth, 10);
      const deps = engine.getDependents(nodeId, { depth });

      console.log(GraphResultFormatter.formatDependents(nodeId, deps, options.json));
    } catch (e: any) {
      if (options.json) {
        console.log(JSON.stringify({ error: 'NODE_NOT_FOUND', message: e.message }, null, 2));
      } else {
        console.error(chalk.red(`Error: ${e.message}`));
      }
    }
  });

graphCmd
  .command('relations <nodeId>')
  .description('Muestra las relaciones directas entrantes y salientes de un nodo')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (nodeId, options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { DeterministicGraphQueryEngine } = require('../core/infrastructure/graph/query-engine');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        throw new Error('Proyecto no indexado. Ejecute primero "asaf index".');
      }

      const engine = new DeterministicGraphQueryEngine(model);
      const relations = engine.getRelations(nodeId);

      if (options.json) {
        console.log(JSON.stringify(relations, null, 2));
      } else {
        console.log(chalk.blue.bold(`\nRelaciones para: ${nodeId}`));
        relations.forEach((r: any) => {
          console.log(`  ${r.from} --[${r.type}]--> ${r.to}`);
        });
      }
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

graphCmd
  .command('path <from> <to>')
  .description('Encuentra el camino de dependencias (shortest path) entre dos nodos')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (from, to, options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { DeterministicGraphQueryEngine } = require('../core/infrastructure/graph/query-engine');
      const { GraphResultFormatter } = require('../core/infrastructure/graph/graph-formatter');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        throw new Error('Proyecto no indexado. Ejecute primero "asaf index".');
      }

      const engine = new DeterministicGraphQueryEngine(model);
      const pathResult = engine.findPath(from, to);

      console.log(GraphResultFormatter.formatPath(from, to, pathResult, options.json));
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

graphCmd
  .command('metrics')
  .description('Calcula métricas de salud y dependencias circulares de la topología')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { DeterministicGraphQueryEngine } = require('../core/infrastructure/graph/query-engine');
      const { GraphResultFormatter } = require('../core/infrastructure/graph/graph-formatter');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        throw new Error('Proyecto no indexado. Ejecute primero "asaf index".');
      }

      const engine = new DeterministicGraphQueryEngine(model);
      const metrics = engine.calculateMetrics();

      console.log(GraphResultFormatter.formatMetrics(metrics, options.json));
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

graphCmd
  .command('node <nodeId>')
  .description('Inspecciona y describe un nodo específico en el grafo')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (nodeId, options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { DeterministicGraphQueryEngine } = require('../core/infrastructure/graph/query-engine');
      const { GraphResultFormatter } = require('../core/infrastructure/graph/graph-formatter');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        throw new Error('Proyecto no indexado. Ejecute primero "asaf index".');
      }

      const engine = new DeterministicGraphQueryEngine(model);
      const node = engine.getNode(nodeId);
      const relations = engine.getRelations(nodeId);

      console.log(GraphResultFormatter.formatNode(node, relations, options.json));
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

// Comando: impact
program
  .command('impact [nodeId]')
  .description('Analiza determinísticamente el impacto de modificar un archivo o símbolo en el proyecto')
  .option('--changed', 'Analiza el impacto de todos los archivos modificados actualmente en Git', false)
  .option('-d, --depth <number>', 'Profundidad de cascada en el análisis (número o "all")', 'all')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (nodeId, options) => {
    const projectDir = process.cwd();
    const { DeterministicImpactEngine } = require('../core/infrastructure/impact/impact-engine');
    const { GitChangeDetector } = require('../core/infrastructure/git/git-change-detector');
    const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');

    try {
      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        console.error(chalk.red('Proyecto no indexado. Ejecute primero "asaf index".'));
        process.exit(1);
      }

      const engine = new DeterministicImpactEngine(model);
      const depth: number | 'all' = options.depth === 'all' ? 'all' : parseInt(options.depth, 10);

      let targets: string[] = [];
      if (options.changed) {
        const detector = new GitChangeDetector(projectDir);
        const changes = await detector.getChanges();
        targets = changes
          .filter((c: any) => c.type !== 'deleted')
          .map((c: any) => c.path);
        if (targets.length === 0) {
          console.log(chalk.green('No hay archivos modificados en el working tree de Git.'));
          return;
        }
      } else if (nodeId) {
        targets = [nodeId];
      } else {
        console.error(chalk.red('Debe proveer un nodeId o especificar la bandera --changed.'));
        process.exit(1);
      }

      const reports: any[] = [];
      for (const target of targets) {
        try {
          const report = await engine.analyzeImpact(target, depth);
          reports.push(report);
        } catch (e: any) {
          reports.push({
            target,
            status: 'error',
            error: e.message
          });
        }
      }

      if (options.json) {
        console.log(JSON.stringify(reports, null, 2));
      } else {
        console.log(chalk.blue.bold('\nASAF Project Intelligence - Impact Analysis\n'));
        for (const report of reports) {
          if (report.status === 'error') {
            console.log(`${chalk.bold(report.target)}  ${chalk.red('ERROR')}: ${report.error}`);
          } else if (report.status === 'removed-from-index') {
            console.log(`${chalk.bold(report.target)}  ${chalk.gray('ELIMINADO DEL ÍNDICE')}`);
          } else {
            const riskColor = report.risk.level === 'HIGH'
              ? chalk.red.bold
              : report.risk.level === 'MEDIUM'
                ? chalk.yellow.bold
                : chalk.green.bold;
            console.log(`Target:              ${chalk.bold(report.target)}`);
            console.log(`Riesgo:              ${riskColor(report.risk.level)} (score: ${report.risk.score.toFixed(1)})`);
            console.log(`Razón:               ${report.risk.reason}`);
            console.log(`Nodos Afectados:     ${report.metrics.affectedNodes}`);
            console.log(`APIs Comprometidas:  ${report.metrics.affectedApis}`);
            console.log(`BBDD Comprometidas:  ${report.metrics.affectedDatabases}`);
            console.log(`Tests Comprometidos: ${report.metrics.affectedTests}`);
            console.log(`Fan-in:              ${report.metrics.fanIn}`);
            console.log(`Fan-out:             ${report.metrics.fanOut}`);
            console.log(`Profundidad Max:     ${report.metrics.maxDepth}`);
            if (report.architectureBoundariesCrossed && report.architectureBoundariesCrossed.length > 0) {
              console.log(chalk.red.bold('\nLímites Arquitectónicos Cruzados:'));
              report.architectureBoundariesCrossed.forEach((b: string) => {
                console.log(`  ⚠ ${chalk.yellow(b)}`);
              });
            }
            if (report.affectedADRs && report.affectedADRs.length > 0) {
              console.log(chalk.red.bold('\nDecisiones Arquitectónicas Afectadas (ADRs):'));
              report.affectedADRs.forEach((a: any) => {
                console.log(`  ⚠ ${chalk.yellow.bold(a.id)}: ${a.title} (${chalk.cyan(a.status)})`);
                console.log(`    Razón: ${a.reason}`);
                console.log(`    Trazabilidad: ${a.evidence.path.join(' ➔ ')}`);
              });
            }
          }
          console.log(chalk.gray('────────────────────────────────────────'));
        }
      }
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Comando: adr
const adrCmd = program
  .command('adr')
  .description('Herramientas de Inteligencia y Gobernanza de Decisiones de Arquitectura (ADR)');

adrCmd
  .command('list')
  .description('Lista todas las decisiones de arquitectura (ADRs) registradas')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { DeterministicADRIntelligenceEngine } = require('../core/infrastructure/adr/adr-intelligence-engine');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        console.error(chalk.red('Proyecto no indexado. Ejecute primero "asaf index".'));
        process.exit(1);
      }

      const adrEngine = new DeterministicADRIntelligenceEngine(model);
      const adrs = adrEngine.listADRs();

      if (options.json) {
        console.log(JSON.stringify(adrs, null, 2));
      } else {
        console.log(chalk.blue.bold('\nASAF Architecture Decisions - Catálogo de ADRs\n'));
        if (adrs.length === 0) {
          console.log(chalk.yellow('No hay decisiones de arquitectura indexadas.'));
        } else {
          adrs.forEach((adr: any) => {
            const statusColor = adr.status === 'accepted' ? chalk.green : adr.status === 'deprecated' ? chalk.red : chalk.yellow;
            console.log(`- ${chalk.bold(adr.id)}: ${adr.title} [${statusColor(adr.status)}]`);
          });
        }
        console.log();
      }
    } catch (e: any) {
      console.error(chalk.red(`Error al listar ADRs: ${e.message}`));
      process.exit(1);
    }
  });

adrCmd
  .command('show <adrId>')
  .description('Muestra los detalles estructurados de un ADR específico')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (adrId, options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { DeterministicADRIntelligenceEngine } = require('../core/infrastructure/adr/adr-intelligence-engine');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        console.error(chalk.red('Proyecto no indexado. Ejecute primero "asaf index".'));
        process.exit(1);
      }

      const adrEngine = new DeterministicADRIntelligenceEngine(model);
      const adr = adrEngine.getADR(adrId);

      if (!adr) {
        console.error(chalk.red(`No se encontró el ADR con ID "${adrId}".`));
        process.exit(1);
      }

      if (options.json) {
        console.log(JSON.stringify(adr, null, 2));
      } else {
        const statusColor = adr.status === 'accepted' ? chalk.green : adr.status === 'deprecated' ? chalk.red : chalk.yellow;
        console.log(chalk.blue.bold(`\n=== Decision Record: ${adr.id} ===`));
        console.log(`Título:       ${chalk.bold(adr.title)}`);
        console.log(`Estado:       ${statusColor(adr.status)}`);
        if (adr.date) console.log(`Fecha:        ${adr.date}`);
        if (adr.supersedes) console.log(`Reemplaza a:  ${adr.supersedes.join(', ')}`);
        if (adr.supersededBy) console.log(`Reemplazado por: ${adr.supersededBy}`);
        if (adr.tags) console.log(`Tags:         ${adr.tags.join(', ')}`);
        console.log(chalk.gray('────────────────────────────────────────'));
        if (adr.context) {
          console.log(chalk.bold('\nContexto:'));
          console.log(adr.context);
        }
        if (adr.decision) {
          console.log(chalk.bold('\nDecisión:'));
          console.log(adr.decision);
        }
        if (adr.consequences) {
          console.log(chalk.bold('\nConsecuencias:'));
          console.log(adr.consequences);
        }
        console.log();
      }
    } catch (e: any) {
      console.error(chalk.red(`Error al mostrar ADR: ${e.message}`));
      process.exit(1);
    }
  });

adrCmd
  .command('check')
  .description('Audita la consistencia bidireccional y la salud del catálogo de ADRs')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { DeterministicADRIntelligenceEngine } = require('../core/infrastructure/adr/adr-intelligence-engine');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        console.error(chalk.red('Proyecto no indexado. Ejecute primero "asaf index".'));
        process.exit(1);
      }

      const adrEngine = new DeterministicADRIntelligenceEngine(model);
      const report = adrEngine.validateADRConsistency();

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(chalk.blue.bold('\nASAF ADR Catalog - Auditoría de Consistencia\n'));
        if (report.isValid) {
          console.log(chalk.green.bold('✓ ¡Auditoría exitosa! El catálogo de ADRs y sus relaciones en el grafo son 100% consistentes.'));
        } else {
          console.log(chalk.red.bold(`✗ Se detectaron ${report.issues.length} inconsistencias en el catálogo de decisiones:\n`));
          report.issues.forEach((issue: string, idx: number) => {
            console.log(`  ${chalk.red(idx + 1)}. ${issue}`);
          });
        }
        console.log();
      }

      if (!report.isValid) {
        process.exit(1);
      }
    } catch (e: any) {
      console.error(chalk.red(`Error al auditar ADRs: ${e.message}`));
      process.exit(1);
    }
  });

adrCmd
  .command('impact <adrId>')
  .description('Muestra los archivos y dependientes del código gobernados por este ADR')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (adrId, options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { DeterministicADRIntelligenceEngine } = require('../core/infrastructure/adr/adr-intelligence-engine');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        console.error(chalk.red('Proyecto no indexado. Ejecute primero "asaf index".'));
        process.exit(1);
      }

      const adrEngine = new DeterministicADRIntelligenceEngine(model);
      const adr = adrEngine.getADR(adrId);
      if (!adr) {
        console.error(chalk.red(`No se encontró el ADR con ID "${adrId}".`));
        process.exit(1);
      }

      const nodes = adrEngine.findRelatedNodes(adrId);

      if (options.json) {
        console.log(JSON.stringify({ adrId, title: adr.title, governedNodes: nodes }, null, 2));
      } else {
        console.log(chalk.blue.bold(`\nADR Impact & Coverage: ${adr.id} — ${adr.title}\n`));
        console.log(`Estado:       ${adr.status}`);
        console.log(`Nodos Código Gobernados Directa o Transitivamente: ${chalk.cyan(nodes.length)}`);
        console.log(chalk.gray('────────────────────────────────────────'));
        if (nodes.length === 0) {
          console.log(chalk.yellow('No hay archivos ni símbolos vinculados a esta decisión arquitectónica.'));
        } else {
          nodes.forEach((node: string) => {
            console.log(`  ➔ ${chalk.green(node)}`);
          });
        }
        console.log();
      }
    } catch (e: any) {
      console.error(chalk.red(`Error al evaluar impacto de ADR: ${e.message}`));
      process.exit(1);
    }
  });

// Comando: plan
program
  .command('plan')
  .argument('[taskDescription]', 'Descripción de la tarea de desarrollo')
  .description('Genera un plan de cambio arquitectónico accionable para una tarea de desarrollo')
  .option('--file <filePath>', 'Analiza tomando un archivo como target explícito')
  .option('--budget <tokens>', 'Establece el límite máximo de tokens para el contexto', '10000')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (taskDescription, options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { ArchitecturalReasoner } = require('../core/reasoning/architectural-reasoner');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        console.error(chalk.red('Proyecto no indexado. Ejecute primero "asaf index".'));
        process.exit(1);
      }

      if (!taskDescription && !options.file) {
        console.error(chalk.red('Debe proporcionar una descripción de tarea o un archivo explícito con --file.'));
        process.exit(1);
      }

      const task = taskDescription || `Plan para archivo ${options.file}`;
      const budget = parseInt(options.budget, 10);
      const reasoner = new ArchitecturalReasoner(model);
      const plan = await reasoner.plan(task, {
        explicitFiles: options.file ? [options.file] : [],
        expandGraph: true,
        budget
      });
      const { PlanningEngine } = require('../core/planning/planning-engine');
      const planningEngine = new PlanningEngine(model);
      const planningResult = planningEngine.plan(plan);

      if (options.json) {
        console.log(JSON.stringify(planningResult, null, 2));
      } else {
        console.log(chalk.blue.bold('\n================================================'));
        console.log(chalk.blue.bold('       ASAF Architectural Change Plan           '));
        console.log(chalk.blue.bold('================================================\n'));
        console.log(`Tarea:         ${chalk.bold(planningResult.changePlan.task)}`);
        console.log(`Riesgo Global: ${planningResult.summary.riskScore} / 100 (${chalk.bold(planningResult.summary.complexity)})`);
        console.log(`Complejidad:   ${chalk.bold(planningResult.summary.complexity)}`);
        console.log(chalk.gray('────────────────────────────────────────'));

        console.log(chalk.bold('\n1. Cambios Requeridos (Priorizados):'));
        planningResult.changePlan.changes.forEach((change: any) => {
          let actionColor = chalk.cyan;
          if (change.action === 'CREATE') actionColor = chalk.green;
          else if (change.action === 'DELETE') actionColor = chalk.red;
          else if (change.action === 'TEST') actionColor = chalk.yellow;
          else if (change.action === 'REVIEW') actionColor = chalk.magenta;

          console.log(`  [Prio ${change.priority}] ${actionColor.bold(change.action)} ${chalk.green(change.path)}`);
          console.log(`    Razón: ${change.reason}`);
          if (change.dependencies.length > 0) {
            console.log(`    Depende de: ${change.dependencies.join(', ')}`);
          }
        });

        console.log(chalk.bold('\n2. Delta de Arquitectura Proyectada:'));
        if (planningResult.architectureDelta.addedNodes.length > 0) {
          console.log(chalk.green(`  [+] Nodos Agregados: ${planningResult.architectureDelta.addedNodes.map((n: any) => n.id).join(', ')}`));
        }
        if (planningResult.architectureDelta.removedNodes.length > 0) {
          console.log(chalk.red(`  [-] Nodos Removidos: ${planningResult.architectureDelta.removedNodes.map((n: any) => n.id).join(', ')}`));
        }
        if (planningResult.architectureDelta.modifiedNodes.length > 0) {
          console.log(chalk.yellow(`  [*] Nodos Modificados: ${planningResult.architectureDelta.modifiedNodes.map((n: any) => n.id).join(', ')}`));
        }
        if (planningResult.architectureDelta.addedRelations.length > 0) {
          console.log(chalk.green(`  [+] Relaciones Agregadas:`));
          planningResult.architectureDelta.addedRelations.forEach((r: any) => {
            console.log(`      ${r.from} ➔ ${r.to} (${r.type})`);
          });
        }
        if (planningResult.architectureDelta.boundariesEntered.length > 0) {
          console.log(chalk.cyan(`  ➔ Capas de Límite Entradas: ${planningResult.architectureDelta.boundariesEntered.join(', ')}`));
        }

        console.log(chalk.bold('\n3. Secuencia de Ejecución (Orden de Grafo):'));
        if (planningResult.summary.hasCycle) {
          console.log(chalk.red.bold('  ⚠ No se puede determinar la secuencia de forma segura debido a ciclos de dependencias en el grafo.'));
          console.log(chalk.red(`    Componentes en el ciclo: ${planningResult.changeGraph.cycleNodes.join(' ⇄ ')}`));
        } else {
          planningResult.executionPlan.steps.forEach((step: any) => {
            let color = chalk.cyan;
            if (step.action === 'CREATE') color = chalk.green;
            else if (step.action === 'TEST') color = chalk.yellow;
            else if (step.action === 'REVIEW') color = chalk.magenta;

            console.log(`  Paso ${step.order}: ${color.bold(step.action)} sobre '${chalk.green(step.target)}'`);
            console.log(`    Racional: ${step.rationale}`);
            step.validation.forEach((val: string) => {
              console.log(`      ✓ Validación: ${val}`);
            });
          });

          if (planningResult.executionPlan.parallelGroups.length > 0) {
            console.log(chalk.bold('\n  Grupos de Ejecución Paralela:'));
            planningResult.executionPlan.parallelGroups.forEach((group: string[], index: number) => {
              console.log(`    Grupo ${index + 1}: [${group.join(', ')}]`);
            });
          }
        }

        console.log(chalk.bold('\n4. Estrategia de Tests:'));
        if (planningResult.testStrategy.mustRun.length > 0) {
          console.log(chalk.red.bold('  Debe Ejecutar (Test Directo):'));
          planningResult.testStrategy.mustRun.forEach((t: any) => console.log(`    ➔ ${chalk.red(t.testFile)} (para ${t.target}) - Prio ${t.priority}`));
        }
        if (planningResult.testStrategy.shouldRun.length > 0) {
          console.log(chalk.yellow.bold('  Debería Ejecutar (Test Indirecto):'));
          planningResult.testStrategy.shouldRun.forEach((t: any) => console.log(`    ➔ ${chalk.yellow(t.testFile)} (para ${t.target}) - Prio ${t.priority}`));
        }
        if (planningResult.testStrategy.recommendedToCreate.length > 0) {
          console.log(chalk.green.bold('  Recomendado Crear:'));
          planningResult.testStrategy.recommendedToCreate.forEach((t: any) => console.log(`    ➔ ${chalk.green(t.testFile)} (para ${t.target}) - Prio ${t.priority}`));
        }

        if (planningResult.architectureDelta.violationsIntroduced.length > 0) {
          console.log(chalk.red.bold('\n5. Violaciones de Gobernanza Introducidas:'));
          planningResult.architectureDelta.violationsIntroduced.forEach((v: string) => {
            console.log(`  ⚠ ${chalk.red(v)}`);
          });
        }

        if (planningResult.architectureDelta.affectedADRs.length > 0) {
          console.log(chalk.bold('\n6. ADRs Afectados:'));
          planningResult.architectureDelta.affectedADRs.forEach((adr: string) => {
            console.log(`  ➔ ${chalk.yellow(adr)}`);
          });
        }
        console.log();
      }
    } catch (e: any) {
      console.error(chalk.red(`Error al generar el plan de cambio: ${e.message}`));
      process.exit(1);
    }
  });

// Comando: simulate
program
  .command('simulate')
  .argument('[taskDescription]', 'Descripción de la tarea de desarrollo')
  .description('Simula los efectos arquitectónicos de una tarea de desarrollo sin realizar modificaciones físicas')
  .option('--file <filePath>', 'Analiza tomando un archivo como target explícito')
  .option('--budget <tokens>', 'Establece el límite máximo de tokens para el contexto', '10000')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .action(async (taskDescription, options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { ArchitecturalReasoner } = require('../core/reasoning/architectural-reasoner');
      const { PlanningEngine } = require('../core/planning/planning-engine');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        console.error(chalk.red('Proyecto no indexado. Ejecute primero "asaf index".'));
        process.exit(1);
      }

      if (!taskDescription && !options.file) {
        console.error(chalk.red('Debe proporcionar una descripción de tarea o un archivo explícito con --file.'));
        process.exit(1);
      }

      const task = taskDescription || `Plan para archivo ${options.file}`;
      const budget = parseInt(options.budget, 10);
      const reasoner = new ArchitecturalReasoner(model);
      const plan = await reasoner.plan(task, {
        explicitFiles: options.file ? [options.file] : [],
        expandGraph: true,
        budget
      });

      const planningEngine = new PlanningEngine(model);
      const planningResult = planningEngine.plan(plan);

      if (options.json) {
        console.log(JSON.stringify(planningResult, null, 2));
      } else {
        console.log(chalk.blue.bold('\n================================================'));
        console.log(chalk.blue.bold('       ASAF Architectural Change Simulation      '));
        console.log(chalk.blue.bold('================================================\n'));
        console.log(`Tarea:         ${chalk.bold(planningResult.changePlan.task)}`);
        console.log(chalk.gray('────────────────────────────────────────'));

        console.log(chalk.bold('\nBEFORE (Grafo Real Actual):'));
        console.log(`  Archivos totales: ${model.files.length}`);
        console.log(`  Relaciones totales: ${model.relations.length}`);

        console.log(chalk.bold('\nPROJECTED (Simulado después de cambios):'));
        console.log(`  Archivos totales: ${planningResult.summary.metrics.graphNodes}`);
        console.log(`  Relaciones totales: ${planningResult.summary.metrics.graphEdges}`);

        console.log(chalk.bold('\nDELTA DE CAMBIO:'));
        if (planningResult.architectureDelta.addedNodes.length > 0) {
          console.log(chalk.green(`  [+] Agregados: ${planningResult.architectureDelta.addedNodes.map((n: any) => n.id).join(', ')}`));
        }
        if (planningResult.architectureDelta.removedNodes.length > 0) {
          console.log(chalk.red(`  [-] Eliminados: ${planningResult.architectureDelta.removedNodes.map((n: any) => n.id).join(', ')}`));
        }
        if (planningResult.architectureDelta.addedRelations.length > 0) {
          console.log(chalk.green(`  [+] Nuevas Relaciones de Dependencia:`));
          planningResult.architectureDelta.addedRelations.forEach((r: any) => {
            console.log(`      ${r.from} ➔ ${r.to} (${r.type})`);
          });
        }

        if (planningResult.architectureDelta.violationsIntroduced.length > 0) {
          console.log(chalk.red.bold('\nVIOLACIONES INTRODUCIDAS:'));
          planningResult.architectureDelta.violationsIntroduced.forEach((v: string) => {
            console.log(`  ⚠ ${chalk.red(v)}`);
          });
        } else {
          console.log(chalk.green('\n✓ No se introdujeron violaciones de arquitectura.'));
        }

        console.log();
      }
    } catch (e: any) {
      console.error(chalk.red(`Error al simular el cambio: ${e.message}`));
      process.exit(1);
    }
  });

// Comando: context
program
  .command('context [taskDescription]')
  .description('Construye y optimiza el contexto determinista enfocado en una tarea')
  .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
  .option('--budget <tokens>', 'Establece el límite máximo de tokens para el contexto', '10000')
  .option('--file <filePath>', 'Analiza el contexto tomando un archivo como target explícito')
  .option('--explain', 'Muestra la explicación del ranking del contexto', false)
  .action(async (taskDescription, options) => {
    const projectDir = process.cwd();
    try {
      const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
      const { UnifiedContextEngine } = require('../core/context/context-engine');

      const store = new FileProjectIndexStore(projectDir);
      const model = await store.load();
      if (!model) {
        console.error(chalk.red('Proyecto no indexado. Ejecute primero "asaf index".'));
        process.exit(1);
      }

      const budget = parseInt(options.budget, 10);
      const files = options.file ? [options.file] : [];
      const engine = new UnifiedContextEngine(model);

      const context = await engine.buildContext({
        task: taskDescription,
        files,
        budget,
        explain: options.explain
      });

      if (options.json) {
        console.log(JSON.stringify(context, null, 2));
      } else {
        console.log(chalk.blue.bold('\nASAF Context Intelligence — Contexto Optimizado\n'));
        console.log(`Tarea:               ${chalk.bold(context.task)}`);
        console.log(`Presupuesto Máximo:  ${context.budget.requested} tokens`);
        console.log(`Seleccionado:        ${context.budget.selected} tokens (Ahorro significativo)`);
        console.log(`Archivos del Target: ${context.target.files.join(', ') || 'Ninguno (Git limpio)'}`);
        console.log(chalk.gray('────────────────────────────────────────'));

        if (context.codeSlices.length > 0) {
          console.log(chalk.bold('\nEstructura de Código Relevante (Slices):'));
          context.codeSlices.forEach((slice: any) => {
            console.log(`  ➔ ${chalk.green(slice.filePath)} [Nivel: ${slice.level}] (${slice.estimatedTokens} tokens)`);
          });
        }

        if (context.decisions.length > 0) {
          console.log(chalk.bold('\nDecisiones Arquitectónicas Vinculadas (ADRs):'));
          context.decisions.forEach((adr: any) => {
            console.log(`  ⚠ ${chalk.yellow(adr.id)}: ${adr.title}`);
          });
        }

        if (context.evidence.length > 0) {
          console.log(chalk.bold('\nTrazabilidad Física (Evidencia):'));
          context.evidence.forEach((ev: any) => {
            console.log(`  ✓ ${ev.claim}`);
            console.log(`    Camino: ${ev.path.join(' ➔ ')}`);
          });
        }

        if (options.explain && context.explain) {
          console.log(chalk.bold('\nExplicación del Ranking de Contexto (Explain):'));
          context.explain.forEach((item: any) => {
            console.log(`  ➔ [Prioridad ${item.priority}] ${chalk.cyan(item.id)} (${item.type})`);
            console.log(`     Razón: ${item.reason}`);
          });
        }
        console.log();
      }
    } catch (e: any) {
      console.error(chalk.red(`Error al procesar contexto: ${e.message}`));
      process.exit(1);
    }
  });

// Comando: execute
program
        .command('execute <taskDescription>')
        .description('Ejecuta físicamente un plan de cambio arquitectónico (v0.3.0 Safe Physical Execution)')
        .option('--no-dry-run', 'Ejecuta físicamente la modificación en disco (por defecto es DRY-RUN)', true)
        .option('-d, --dir <path>', 'Directorio del proyecto', '.')
        .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
        .action(async (taskDescription, options) => {
          const projectDir = path.resolve(options.dir);
          try {
            const { FileProjectIndexStore } = require('../core/infrastructure/indexing/project-index-store');
            const { ArchitecturalReasoner } = require('../core/reasoning/architectural-reasoner');
            const { PlanningEngine } = require('../core/planning/planning-engine');
            const { ChangeExecutor } = require('../core/execution/change-executor');

            const store = new FileProjectIndexStore(projectDir);
            const model = await store.load();
            if (!model) {
              console.error(chalk.red('Proyecto no indexado. Ejecute primero "asaf index".'));
              process.exit(1);
            }

            const reasoner = new ArchitecturalReasoner(model);
            const plan = await reasoner.plan(taskDescription, {
              expandGraph: true
            });

            const planningEngine = new PlanningEngine(model);
            const planningResult = planningEngine.plan(plan);

            const patches = planningResult.executionPlan.steps
              .filter((step: any) => ['CREATE', 'MODIFY', 'DELETE'].includes(step.action))
              .map((step: any) => ({
                filePath: step.target,
                action: step.action as any,
                expectedHashBefore: undefined,
                content: step.action === 'DELETE' ? undefined : `// ASAF MODIFIED: ${step.rationale}\n`
              }));

            const executor = new ChangeExecutor(projectDir);
            const isDryRun = options.dryRun !== false;

            if (options.json) {
              const session = await executor.execute(planningResult, patches, { dryRun: isDryRun });
              console.log(JSON.stringify(session, null, 2));
            } else {
              console.log(chalk.blue.bold('\nASAF SAFE PHYSICAL EXECUTION'));
              console.log(chalk.gray('────────────────────────────────'));
              console.log(`Mode:    ${isDryRun ? chalk.yellow('DRY-RUN') : chalk.red('PHYSICAL EXECUTION')}`);
              console.log(`Risk:    ${chalk.bold(planningResult.summary.riskLevel)} (Score: ${planningResult.summary.riskScore})`);
              console.log(`Policy:  ${planningResult.summary.riskLevel}`);
              console.log();
              console.log(chalk.bold('Files to process:'));

              patches.forEach((p: any) => {
                const color = p.action === 'CREATE' ? chalk.green : p.action === 'MODIFY' ? chalk.yellow : chalk.red;
                console.log(`  ${color(p.action)}  ${p.filePath}`);
              });

              console.log();
              console.log(chalk.bold('Execution order:'));
              planningResult.executionPlan.steps.forEach((step: any, idx: number) => {
                console.log(`  ${idx + 1}. ${step.target} (${step.action})`);
              });

              console.log();

              const session = await executor.execute(planningResult, patches, { dryRun: isDryRun });

              console.log(chalk.bold('Execution Status:'));
              console.log(`  Session ID: ${chalk.cyan(session.sessionId)}`);
              console.log(`  Status:     ${session.status === 'COMMITTED' ? chalk.green('COMMITTED') : chalk.red(session.status)}`);
              console.log(`  Rollback:   ${session.rollbackAvailable ? chalk.green('Available') : chalk.yellow('None')}`);

              if (session.validation) {
                console.log();
                console.log(chalk.bold('Validation results:'));
                console.log(`  ✓ Scope:      ${session.validation.checks.scope ? chalk.green('Passed') : chalk.red('Failed')}`);
                console.log(`  ✓ TypeScript: ${session.validation.checks.build ? chalk.green('Passed') : chalk.red('Failed')}`);
                console.log(`  ✓ Unit Tests: ${session.validation.checks.tests ? chalk.green('Passed') : chalk.red('Failed')}`);
                console.log(`  ✓ Governance: ${session.validation.checks.governance ? chalk.green('Passed') : chalk.red('Failed')}`);
                console.log(`  ✓ ADRs:       ${session.validation.checks.adr ? chalk.green('Passed') : chalk.red('Failed')}`);
              }

              console.log();
              console.log(chalk.green('✓ Operación completada.'));
            }
          } catch (e: any) {
            console.error(chalk.red(`\nError en la ejecución física: ${e.message}`));
            process.exit(1);
          }
        });

      // Comando: verify
      program
        .command('verify <sessionId>')
        .description('Verifica post-cambios o corre validaciones sobre una sesión de ejecución física existente')
        .option('-d, --dir <path>', 'Directorio del proyecto', '.')
        .option('--json', 'Retorna el resultado en formato JSON estructurado', false)
        .action(async (sessionId, options) => {
          const projectDir = path.resolve(options.dir);
          try {
            const { ExecutionSessionManager } = require('../core/execution/execution-session');
            const { ValidationEngine } = require('../core/execution/validation-engine');

            const sessionManager = new ExecutionSessionManager(projectDir);
            const session = sessionManager.loadSession(sessionId);
            if (!session) {
              console.error(chalk.red(`Error: Sesión '${sessionId}' no encontrada.`));
              process.exit(1);
            }

            const validationEngine = new ValidationEngine(projectDir);

            const beforeHashes: Record<string, string> = {};
            session.journal.forEach((entry: any) => {
              if (entry.hashBefore) beforeHashes[entry.path] = entry.hashBefore;
            });

            const result = await validationEngine.validate({
              sessionId,
              before: { hashes: beforeHashes, violations: [] },
              expectedChanges: session.journal.map((j: any) => j.path)
            });

            if (options.json) {
              console.log(JSON.stringify(result, null, 2));
            } else {
              console.log(chalk.blue.bold(`\nASAF Verification Report - Session: ${sessionId}\n`));
              console.log(`Status de Validación: ${result.passed ? chalk.green('PASSED') : chalk.red('FAILED')}`);
              console.log(chalk.gray('────────────────────────────────────────'));
              console.log(`  ✓ Compilación (Build):  ${result.checks.build ? chalk.green('Pass') : chalk.red('Fail')}`);
              console.log(`  ✓ Pruebas (Tests):      ${result.checks.tests ? chalk.green('Pass') : chalk.red('Fail')}`);
              console.log(`  ✓ Gobernanza (DDD):     ${result.checks.governance ? chalk.green('Pass') : chalk.red('Fail')}`);
              console.log(`  ✓ ADRs:                 ${result.checks.adr ? chalk.green('Pass') : chalk.red('Fail')}`);
              console.log(`  ✓ Scope de Archivos:    ${result.checks.scope ? chalk.green('Pass') : chalk.red('Fail')}`);

              if (result.errors.length > 0) {
                console.log(chalk.red.bold('\nErrores Detectados:'));
                result.errors.forEach((e: string) => console.log(`  ✗ ${e}`));
              }
              console.log();
            }
          } catch (e: any) {
            console.error(chalk.red(`Error al verificar la sesión: ${e.message}`));
            process.exit(1);
          }
        });

      // Comando: mcp
      program
        .command('mcp')
        .description('Inicia el servidor Model Context Protocol (MCP) nativo de ASAF sobre stdio')
        .action(() => {
          try {
            console.error(chalk.blue('Iniciando el servidor MCP de ASAF...'));
            require('../mcp/index');
          } catch (error: any) {
            console.error(chalk.red(`Error al iniciar el servidor MCP: ${error.message}`));
          }
        });

      // Comando: recovery (ASAF v0.3.1)
      const recoveryCmd = program
        .command('recovery')
        .description('Grupo de comandos para auditoría y recuperación de sesiones de ejecución física huérfanas');

      recoveryCmd
        .command('list')
        .description('Lista todas las sesiones huérfanas, activas e incompletas detectadas en el workspace')
        .action(() => {
          try {
            const { RecoveryEngine } = require('../core/execution/recovery-engine');
            const engine = new RecoveryEngine(process.cwd());
            const orphans = engine.detectOrphans();

            if (orphans.length === 0) {
              console.log(chalk.green('✓ No se detectaron sesiones huérfanas activas en el workspace. El estado es consistente.'));
            } else {
              console.log(chalk.red.bold(`\nSe detectaron ${orphans.length} sesiones huérfanas activas:\n`));
              orphans.forEach((o: any) => {
                console.log(`  ➔ Sesión ID: ${chalk.cyan(o.sessionId)} [Estado: ${chalk.yellow(o.status)}] (Creada: ${o.createdAt})`);
              });
              console.log(chalk.gray('\nUsa "asaf recovery inspect <sessionId>" para auditar el estado y restaurar.'));
            }
          } catch (e: any) {
            console.error(chalk.red(`Error al listar sesiones: ${e.message}`));
          }
        });

      recoveryCmd
        .command('inspect <sessionId>')
        .description('Audita la integridad de un snapshot, diario y workspace de una sesión huérfana')
        .action((sessionId) => {
          try {
            const { RecoveryEngine } = require('../core/execution/recovery-engine');
            const engine = new RecoveryEngine(process.cwd());
            const report = engine.inspectSession(sessionId);

            console.log(chalk.blue.bold(`\nReporte de Recuperación — Sesión: ${sessionId}\n`));
            console.log(`  Estrategia Sugerida: ${chalk.bold(report.decision)}`);
            console.log(`  Estado de Sesión:    ${report.status}`);
            console.log(`  ✓ Snapshot Válido:   ${report.snapshotIntegrity ? chalk.green('SÍ') : chalk.red('NO')}`);
            console.log(`  ✓ Diario Válido:     ${report.journalIntegrity ? chalk.green('SÍ') : chalk.red('NO')}`);
            console.log(`  ✓ Disco Consistente: ${report.workspaceIntegrity ? chalk.green('SÍ') : chalk.red('NO')}`);
            console.log();
            console.log(`  Pasos Aplicados:     ${report.appliedSteps.join(', ') || 'Ninguno'}`);
            console.log(`  Pasos Pendientes:    ${report.pendingSteps.join(', ') || 'Ninguno'}`);
            
            if (report.errors.length > 0) {
              console.log(chalk.red.bold('\nConflictos/Inconsistencias Detectadas:'));
              report.errors.forEach((e: string) => console.log(`  ✗ ${e}`));
            }
            console.log();
          } catch (e: any) {
            console.error(chalk.red(`Error al inspeccionar la sesión: ${e.message}`));
          }
        });

      recoveryCmd
        .command('rollback <sessionId>')
        .description('Fuerza la reversión física atómica LIFO de todos los cambios de una sesión huérfana')
        .action(async (sessionId) => {
          try {
            console.log(chalk.yellow(`\nIniciando rollback atómico para la sesión ${sessionId}...`));
            const { RecoveryEngine } = require('../core/execution/recovery-engine');
            const engine = new RecoveryEngine(process.cwd());
            const report = await engine.rollbackOrphan(sessionId);

            console.log(chalk.green(`\n✓ Rollback completado de forma exitosa.`));
            console.log(`  Sesión ID: ${report.sessionId}`);
            console.log(`  Estado:     ${report.status}`);
            console.log(`  Archivos Revertidos: ${report.rolledBackSteps.join(', ') || 'Ninguno'}`);
          } catch (e: any) {
            console.error(chalk.red(`\nError crítico durante el rollback: ${e.message}`));
          }
        });

      recoveryCmd
        .command('resume <sessionId>')
        .description('Reanuda la ejecución física de los pasos pendientes de una sesión huérfana de forma idempotente')
        .action(async (sessionId) => {
          try {
            console.log(chalk.blue(`\nReanudando la ejecución de la sesión ${sessionId}...`));
            const { RecoveryEngine } = require('../core/execution/recovery-engine');
            const engine = new RecoveryEngine(process.cwd());
            const report = await engine.resume(sessionId);

            console.log(chalk.green(`\n✓ Sesión reanudada y procesada con éxito.`));
            console.log(`  Estado Final: ${report.status}`);
          } catch (e: any) {
            console.error(chalk.red(`\nError crítico durante la reanudación: ${e.message}`));
          }
        });

      recoveryCmd
        .command('cleanup <sessionId>')
        .description('Limpia y elimina los recursos y archivos temporales de una sesión terminal')
        .action((sessionId) => {
          try {
            const { RecoveryEngine } = require('../core/execution/recovery-engine');
            const engine = new RecoveryEngine(process.cwd());
            engine.cleanup(sessionId);
            console.log(chalk.green(`✓ Sesión '${sessionId}' limpiada y purgada del disco.`));
          } catch (e: any) {
            console.error(chalk.red(`Error al limpiar sesión: ${e.message}`));
          }
        });

      if (process.env.NODE_ENV !== 'test') {
        process.on('SIGINT', () => {
          console.error(chalk.yellow('\n\n[ASAF] Interrupción del proceso detectada (SIGINT).'));
          process.exit(130);
        });

        process.on('SIGTERM', () => {
          console.error(chalk.yellow('\n[ASAF] Señal de terminación recibida (SIGTERM).'));
          process.exit(143);
        });
      }

      if (process.env.NODE_ENV !== 'test') {
        program.parse(process.argv);
      }
      export default program;
