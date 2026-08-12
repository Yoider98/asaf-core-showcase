import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';

const testDir = path.join(__dirname, 'temp_cli_proposal_project');

const mockProjectModel = {
  project: { name: 'test-cli-proposal-project', version: '1.0.0', path: testDir.replace(/\\/g, '/') },
  indexMetadata: { schemaVersion: 1, indexerVersion: '1.0.0', createdAt: '', updatedAt: '', diagnostics: [] },
  files: [
    { path: 'src/auth/auth.service.ts', hash: 'h1', size: 100 }
  ],
  modules: [],
  symbols: [],
  relations: [],
  apis: [],
  databases: [],
  tests: [],
  dependencies: [],
  architecture: { layers: [] },
  decisions: [],
  git: { indexedCommit: 'c1', headCommit: 'c1', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
};

describe('CLI Commands v0.4.0: config llm, generate y execute proposal', () => {
  let logs: string[] = [];
  let errors: string[] = [];
  let originalLog = console.log;
  let originalError = console.error;
  let originalExit = process.exit;
  let exitCode: number | null = null;
  let originalCwd = process.cwd;
  let originalArgv = process.argv;

  beforeAll(() => {
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

    // Archivo de código en sandbox para hash
    fs.mkdirSync(path.join(testDir, 'src/auth'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'src/auth/auth.service.ts'), "export class AuthService {}", 'utf-8');

    process.cwd = () => testDir;
    process.argv = ['node', 'asaf'];

    console.log = (...args) => logs.push(args.join(' '));
    console.error = (...args) => errors.push(args.join(' '));
    (process as any).exit = (code?: number) => {
      exitCode = code ?? 0;
    };
  });

  afterAll(() => {
    console.log = originalLog;
    console.error = originalError;
    process.exit = originalExit;
    process.cwd = originalCwd;
    process.argv = originalArgv;

    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    logs = [];
    errors = [];
    exitCode = null;
    jest.restoreAllMocks();
  });

  const getProgram = (): Command => {
    return require('../../cli/index').default || require('../../cli/index');
  };

  test('Debería guardar la configuración del LLM en asaf.json con config llm', async () => {
    const program = getProgram();
    await program.parseAsync([
      'node',
      'asaf',
      'config',
      'llm',
      '--provider',
      'ollama',
      '--model',
      'codellama',
      '--host',
      'http://localhost:11434',
      '--timeout',
      '50000'
    ]);

    expect(logs.join(' ')).toContain('Configuración de LLM guardada con éxito');
    const asafJson = JSON.parse(fs.readFileSync(path.join(testDir, 'asaf.json'), 'utf-8'));
    expect(asafJson.llm).toBeDefined();
    expect(asafJson.llm.provider).toBe('ollama');
    expect(asafJson.llm.model).toBe('codellama');
    expect(asafJson.llm.timeoutMs).toBe(50000);
  });

  test('Debería generar y validar propuesta in-memory guardándola en .asaf/proposals', async () => {
    const { AgentOrchestrator } = require('../../agents/orchestrator');

    // Mockear la llamada de orquestación de propuesta para no requerir conexión LLM real en el test de CLI
    const mockProposal = {
      id: 'prop-123',
      changePlanTask: 'refactor auth',
      contextHash: 'c-hash',
      promptVersion: 'v0.4.0-test',
      provider: 'ollama',
      model: 'codegemma',
      patches: [
        {
          filePath: 'src/auth/auth.service.ts',
          action: 'MODIFY',
          expectedHashBefore: null,
          content: 'export class AuthService { /* modified */ }'
        }
      ],
      warnings: [],
      createdAt: new Date().toISOString()
    };

    jest.spyOn(AgentOrchestrator.prototype, 'orchestrateProposal').mockResolvedValue(mockProposal as any);

    const program = getProgram();
    await program.parseAsync(['node', 'asaf', 'generate', 'refactor auth', '--budget', '30000', '--dir', testDir]);

    // Loguear errores para depuración si falla
    if (errors.length > 0)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

    expect(logs.join(' ')).toContain('Propuesta de cambio validada y guardada exitosamente');
    expect(logs.join(' ')).toContain('proposal-prop-123.json');

    // Verificar archivo guardado
    const savedProposalPath = path.join(testDir, '.asaf/proposals/proposal-prop-123.json');
    expect(fs.existsSync(savedProposalPath)).toBe(true);

    const savedProposal = JSON.parse(fs.readFileSync(savedProposalPath, 'utf-8'));
    expect(savedProposal.id).toBe('prop-123');
    expect(savedProposal.patches[0].expectedHashBefore).toBeDefined();
    expect(savedProposal.patches[0].expectedHashBefore).not.toBeNull();
  });

  test('Debería ejecutar propuesta físicamente con execute --proposal', async () => {
    // Primero, guardar propuesta en el sandbox
    const proposal = {
      id: 'prop-456',
      changePlanTask: 'refactor auth',
      contextHash: 'c-hash',
      promptVersion: 'v0.4.0-test',
      provider: 'ollama',
      model: 'codegemma',
      patches: [
        {
          filePath: 'src/auth/auth.service.ts',
          action: 'MODIFY',
          expectedHashBefore: 'd8c281df6f8832a83e07d0f917537b019688df2cb039d91f24d3a04294b63e80',
          content: 'export class AuthService { /* execute-proposal-test */ }'
        }
      ],
      warnings: [],
      createdAt: new Date().toISOString()
    };

    const proposalDir = path.join(testDir, '.asaf/proposals');
    if (!fs.existsSync(proposalDir)) {
      fs.mkdirSync(proposalDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(proposalDir, 'proposal-prop-456.json'),
      JSON.stringify(proposal, null, 2),
      'utf-8'
    );

    const program = getProgram();
    await program.parseAsync(['node', 'asaf', 'execute', '--proposal', 'prop-456', '--dir', testDir]);

    // Loguear errores para depuración si falla
    if (errors.length > 0)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

    expect(logs.join(' ')).toContain('ASAF SAFE PHYSICAL EXECUTION');
    expect(logs.join(' ')).toContain('src/auth/auth.service.ts');
  });
});
