#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

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
    
    // 1. Crear asaf.json si no existe
    if (!fs.existsSync(configPath)) {
      const defaultConfig = {
        name: path.basename(projectDir),
        version: '0.1.0',
        description: 'Proyecto administrado por ASAF',
        discovery: {
          exclude: ['node_modules', 'dist', '.git']
        },
        architecture: {},
        decisions: {
          adrDir: 'docs/adr'
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      console.log(chalk.green('✓ Archivo asaf.json creado con éxito.'));
    } else {
      console.log(chalk.yellow('El archivo asaf.json ya existe. Continuando con la configuración de características...'));
    }

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
  .description('Analiza el proyecto actual y genera un grafo de dependencias local')
  .option('-d, --dir <path>', 'Directorio a analizar', '.')
  .action(async (options) => {
    const projectDir = path.resolve(options.dir);
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
        } catch (e) {}
      }

      let knowledgeGraph: any = null;
      const knowledgeGraphPath = path.join(projectDir, 'asaf-knowledge-graph.json');
      if (fs.existsSync(knowledgeGraphPath)) {
        try {
          knowledgeGraph = JSON.parse(fs.readFileSync(knowledgeGraphPath, 'utf-8'));
        } catch (e) {}
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
        } catch (e) {}
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
  .action(() => {
    const projectDir = process.cwd();
    const graphPath = path.join(projectDir, 'asaf-graph.json');

    if (!fs.existsSync(graphPath)) {
      console.log(chalk.red('El archivo asaf-graph.json no existe. Ejecuta "asaf analyze" primero.'));
      return;
    }

    try {
      console.log(chalk.blue('Iniciando auditoría de gobernanza arquitectónica...'));
      const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
      const { ArchitectureLinter } = require('../core/governance');
      
      const linter = new ArchitectureLinter(graph);
      const violations = linter.checkRules();

      if (violations.length === 0) {
        console.log(chalk.green.bold('\n✓ ¡Felicidades! No se detectaron violaciones arquitectónicas. La estructura cumple las capas.'));
      } else {
        console.log(chalk.red.bold(`\n✗ Se detectaron ${violations.length} violaciones arquitectónicas:\n`));
        violations.forEach((v: any, idx: number) => {
          console.log(`${chalk.red.bold(`[VIOLACIÓN #${idx + 1}]`)} ${chalk.yellow(v.file)}`);
          console.log(`  -> Importación prohibida: ${chalk.bold(v.importedPath)}`);
          console.log(`  -> Regla rota: ${v.rule}\n`);
        });
        process.exit(1); // Retornar código de salida con error para CI/CD
      }
    } catch (e: any) {
      console.error(chalk.red(`Error durante la auditoría: ${e.message}`));
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
      } catch (e) {}
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

program.parse(process.argv);
