import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';

jest.mock('../infrastructure/git/git-change-detector', () => {
  return {
    GitChangeDetector: jest.fn().mockImplementation(() => {
      return {
        getChangesSync: () => []
      };
    })
  };
});

const testDir = path.join(__dirname, 'temp_cli_project');

const mockProjectModel = {
  project: {
    name: 'test-cli-project',
    version: '1.0.0',
    path: testDir.replace(/\\/g, '/')
  },
  indexMetadata: {
    schemaVersion: 1,
    indexerVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    diagnostics: []
  },
  files: [
    { path: 'src/auth/auth.service.ts', hash: 'h1', size: 100 },
    { path: 'src/auth/auth.controller.ts', hash: 'h2', size: 120 },
    { path: 'src/auth/auth.spec.ts', hash: 'h3', size: 80 }
  ],
  modules: [],
  symbols: [
    { id: 'symbol:AuthService', name: 'AuthService', type: 'class', filePath: 'src/auth/auth.service.ts', line: 1 },
    { id: 'symbol:AuthController', name: 'AuthController', type: 'class', filePath: 'src/auth/auth.controller.ts', line: 5 }
  ],
  relations: [
    { from: 'src/auth/auth.controller.ts', to: 'src/auth/auth.service.ts', type: 'imports' }
  ],
  apis: [],
  databases: [],
  tests: [],
  dependencies: [],
  architecture: { layers: [] },
  decisions: [],
  git: {
    indexedCommit: 'c1',
    headCommit: 'c1',
    changedFilesSinceLastIndex: [],
    indexTimestamp: new Date().toISOString(),
    isDirty: false
  }
};

describe('CLI Commands: analyze y plan', () => {
  let logs: string[] = [];
  let errors: string[] = [];
  let originalLog = console.log;
  let originalError = console.error;
  let originalExit = process.exit;
  let exitCode: number | null = null;
  let originalCwd = process.cwd;
  let originalArgv = process.argv;
  let originalStderr = process.stderr.write;

  beforeAll(() => {
    // Crear el sandbox del proyecto
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    const indexDir = path.join(testDir, '.asaf', 'index');
    fs.mkdirSync(indexDir, { recursive: true });
    fs.writeFileSync(
      path.join(indexDir, 'project.json'),
      JSON.stringify(mockProjectModel, null, 2),
      'utf-8'
    );

    // Mockear process.cwd para que apunte al sandbox
    process.cwd = () => testDir;

    // Mockear process.argv para que Commander no falle con comandos de Jest
    process.argv = ['node', 'asaf'];

    // Interceptar salidas y exit
    console.log = (...args) => logs.push(args.join(' '));
    console.error = (...args) => errors.push(args.join(' '));
    (process.stderr as any).write = (str: string) => {
      errors.push(str);
      return true;
    };
    (process as any).exit = (code?: number) => {
      exitCode = code ?? 0;
    };
  });

  afterAll(() => {
    // Restaurar originales
    console.log = originalLog;
    console.error = originalError;
    process.stderr.write = originalStderr;
    process.exit = originalExit;
    process.cwd = originalCwd;
    process.argv = originalArgv;

    // Limpiar sandbox
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    logs = [];
    errors = [];
    exitCode = null;
  });

  const getProgram = (): Command => {
    jest.resetModules();
    return require('../../cli/index').default || require('../../cli/index');
  };

  test('1. Debería registrar el comando analyze en la CLI con soporte v0.2.8', () => {
    const program = getProgram();
    const cmd = (program as any).commands.find((c: any) => c._name === 'analyze');
    expect(cmd).toBeDefined();
    expect(cmd._description).toContain('diagnóstico descriptivo');
  });

  test('2. Debería registrar el comando plan en la CLI', () => {
    const program = getProgram();
    const cmd = (program as any).commands.find((c: any) => c._name === 'plan');
    expect(cmd).toBeDefined();
    expect(cmd._description).toContain('Genera un plan de cambio');
  });

  test('3. Debería ejecutar la lógica de descubrimiento original (v0.2.7) en analyze si no hay tarea ni file', async () => {
    const program = getProgram();
    await program.parseAsync(['node', 'asaf', 'analyze', '--dir', testDir]);
    
    expect(logs.join(' ')).toContain('Iniciando el análisis del proyecto');
    expect(logs.join(' ')).toContain('Análisis completado con éxito');
  });

  test('4. Debería ejecutar el diagnóstico de analyze (v0.2.8) exitosamente con una descripción de tarea', async () => {
    const program = getProgram();
    await program.parseAsync(['node', 'asaf', 'analyze', 'Modificar auth.service.ts', '--dir', testDir]);

    expect(logs.join(' ')).toContain('ASAF Architectural Analysis');
    expect(logs.join(' ')).toContain('Tarea:');
    expect(logs.join(' ')).toContain('Riesgo y Severidad:');
  });

  test('5. Debería retornar JSON estructurado en analyze si se pasa el flag --json', async () => {
    const program = getProgram();
    await program.parseAsync(['node', 'asaf', 'analyze', 'Modificar auth.service.ts', '--json', '--dir', testDir]);

    const output = JSON.parse(logs.join('\n'));
    expect(output.task).toBe('Modificar auth.service.ts');
    expect(output.targets).toContain('src/auth/auth.service.ts');
  });

  test('6. Debería fallar el comando plan si no hay argumentos ni flags', async () => {
    const program = getProgram();
    await program.parseAsync(['node', 'asaf', 'plan']);

    expect(errors.join(' ')).toContain('Debe proporcionar una descripción de tarea');
    expect(exitCode).toBe(1);
  });

  test('7. Debería ejecutar plan exitosamente con una descripción de tarea', async () => {
    const program = getProgram();
    await program.parseAsync(['node', 'asaf', 'plan', 'Modificar auth.service.ts', '--budget', '10000']);

    expect(logs.join(' ')).toContain('ASAF Architectural Change Plan');
    expect(logs.join(' ')).toContain('Cambios Requeridos');
  });

  test('8. Debería retornar JSON estructurado en plan si se pasa el flag --json', async () => {
    const program = getProgram();
    await program.parseAsync(['node', 'asaf', 'plan', 'Modificar auth.service.ts', '--json', '--budget', '10000']);

    const output = JSON.parse(logs.join('\n'));
    expect(output.changePlan.task).toBe('Modificar auth.service.ts');
    expect(output.changePlan.changes.length).toBeGreaterThan(0);
  });

  test('9. Debería ejecutar analyze usando target explícito con flag --file', async () => {
    const program = getProgram();
    await program.parseAsync(['node', 'asaf', 'analyze', '--file', 'src/auth/auth.controller.ts', '--dir', testDir]);

    expect(logs.join(' ')).toContain('Targets:');
    expect(logs.join(' ')).toContain('src/auth/auth.controller.ts');
  });

  test('10. Debería ejecutar plan usando target explícito con flag --file', async () => {
    const program = getProgram();
    await program.parseAsync(['node', 'asaf', 'plan', '--file', 'src/auth/auth.controller.ts', '--budget', '8000']);

    expect(logs.join(' ')).toContain('Plan para archivo src/auth/auth.controller.ts');
  });

  test('11. Debería ejecutar simulate exitosamente (formato humano y JSON)', async () => {
    const program = getProgram();
    await program.parseAsync(['node', 'asaf', 'simulate', 'Modificar auth.service.ts', '--budget', '10000']);

    expect(logs.join(' ')).toContain('ASAF Architectural Change Simulation');
    expect(logs.join(' ')).toContain('DELTA DE CAMBIO');

    // Test JSON
    logs = [];
    await program.parseAsync(['node', 'asaf', 'simulate', 'Modificar auth.service.ts', '--json', '--budget', '10000']);
    const output = JSON.parse(logs.join('\n'));
    expect(output.architectureDelta).toBeDefined();
    expect(output.summary.metrics.changes).toBeGreaterThan(0);
  });
});
