import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ProposalSimulationEngine, ProposalSimulationResult } from './proposal-simulation-engine';
import { ChangePlan } from '../reasoning/types';
import { ProjectModel } from '../domain/project-model';
import { FilePatch } from '../execution/types';

describe('ProposalSimulationEngine Tests', () => {
  const sandboxPath = path.resolve(__dirname, 'temp_simulation_sandbox');

  beforeAll(() => {
    if (!fs.existsSync(sandboxPath)) {
      fs.mkdirSync(sandboxPath, { recursive: true });
    }

    // tsconfig de prueba
    fs.writeFileSync(
      path.resolve(sandboxPath, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@/*': ['./src/*']
          }
        }
      }),
      'utf-8'
    );

    // Estructura de código original en disco para resolución de dependencias
    fs.mkdirSync(path.resolve(sandboxPath, 'src'), { recursive: true });
    fs.writeFileSync(path.resolve(sandboxPath, 'src/auth.ts'), "export class Auth {}", 'utf-8');
    fs.writeFileSync(path.resolve(sandboxPath, 'src/logger.ts'), "export class Logger {}", 'utf-8');
    fs.writeFileSync(path.resolve(sandboxPath, 'package.json'), "{}", 'utf-8');
  });

  afterAll(() => {
    if (fs.existsSync(sandboxPath)) {
      fs.rmSync(sandboxPath, { recursive: true, force: true });
    }
  });

  // Mocks estables
  const changePlan: ChangePlan = {
    task: 'Configure services',
    intent: { task: 'configure', action: 'REFACTOR', concepts: [], technicalAreas: [], probableArtifacts: [], confidence: 1.0 },
    targets: ['src/auth.ts'],
    summary: { changeType: 'REFACTOR', complexity: 'LOW', riskScore: 2 },
    changes: [
      {
        path: 'src/auth.ts',
        action: 'MODIFY',
        priority: 1,
        reason: 'refactor auth',
        dependencies: [],
        evidence: []
      },
      {
        path: 'src/new-service.ts',
        action: 'CREATE',
        priority: 2,
        reason: 'new file',
        dependencies: [],
        evidence: []
      },
      {
        path: 'src/obsolete.ts',
        action: 'DELETE',
        priority: 3,
        reason: 'delete file',
        dependencies: [],
        evidence: []
      }
    ],
    impact: { affectedNodes: [], dependencies: [], dependents: [], boundariesCrossed: [] },
    tests: { affected: [], recommended: [], missing: [] },
    risks: [],
    architecture: {
      violations: [],
      affectedADRs: [],
      conflicts: []
    },
    evidence: [],
    recommendations: []
  };

  const originalModel: ProjectModel = {
    project: { name: 'ASAF', version: '1.0.0', path: sandboxPath },
    indexMetadata: { schemaVersion: 1, indexerVersion: '1.0', createdAt: '', updatedAt: '', diagnostics: [] },
    files: [
      { path: 'src/auth.ts', hash: 'h1', size: 100 },
      { path: 'src/logger.ts', hash: 'h2', size: 100 },
      { path: 'src/obsolete.ts', hash: 'h3', size: 50 }
    ],
    modules: [],
    symbols: [
      { id: 'symbol:src/auth.ts:Auth', name: 'Auth', type: 'class', filePath: 'src/auth.ts', line: 1 },
      { id: 'symbol:src/logger.ts:Logger', name: 'Logger', type: 'class', filePath: 'src/logger.ts', line: 1 }
    ],
    relations: [
      { from: 'src/auth.ts', to: 'symbol:src/auth.ts:Auth', type: 'contains' },
      { from: 'src/logger.ts', to: 'symbol:src/logger.ts:Logger', type: 'contains' }
    ],
    apis: [],
    databases: [],
    tests: [],
    dependencies: [],
    architecture: { layers: [] },
    decisions: [],
    git: { indexedCommit: '', headCommit: '', isDirty: false, changedFilesSinceLastIndex: [], indexTimestamp: '' }
  };

  // Helper para tomar hash del workspace físico para verificar No-Touch Disk
  function getWorkspaceStateHash(): string  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
    });
    return hash.digest('hex');
  }

  // Serialización canónica determinista
  function canonical(obj: any): string  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

  test('Should simulate CREATE valid patch in memory', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/new-service.ts',
        action: 'CREATE',
        expectedHashBefore: null,
        content: `
          import { Logger } from './logger';
          export class NewService {}
        `
      }
    ];

    const engine = new ProposalSimulationEngine(sandboxPath);
    const res = engine.simulateProposal(originalModel, changePlan, patches);

    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.delta.addedNodes).toHaveLength(1);
    expect(res.delta.addedNodes[0].id).toBe('src/new-service.ts');
    expect(res.dependenciesAdded).toContain('src/new-service.ts -> src/logger.ts');
  });

  test('Should simulate MODIFY valid patch and detect relations', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/auth.ts',
        action: 'MODIFY',
        expectedHashBefore: null,
        content: `
          import { Logger } from './logger';
          export class Auth {
            constructor()  { /* Constructor del motor ASAF */ }
          }
        `
      }
    ];

    const engine = new ProposalSimulationEngine(sandboxPath);
    const res = engine.simulateProposal(originalModel, changePlan, patches);

    expect(res.isValid).toBe(true);
    expect(res.dependenciesAdded).toContain('src/auth.ts -> src/logger.ts');
  });

  test('Should simulate DELETE valid patch', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/obsolete.ts',
        action: 'DELETE',
        expectedHashBefore: null
      }
    ];

    const engine = new ProposalSimulationEngine(sandboxPath);
    const res = engine.simulateProposal(originalModel, changePlan, patches);

    expect(res.isValid).toBe(true);
    expect(res.delta.removedNodes).toHaveLength(1);
    expect(res.delta.removedNodes[0].id).toBe('src/obsolete.ts');
  });

  test('Should reject patches outside ChangePlan scope', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/unauthorized.ts',
        action: 'MODIFY',
        expectedHashBefore: null,
        content: 'code'
      }
    ];

    const engine = new ProposalSimulationEngine(sandboxPath);
    const res = engine.simulateProposal(originalModel, changePlan, patches);

    expect(res.isValid).toBe(false);
    expect(res.scopeViolations).toHaveLength(1);
    expect(res.scopeViolations[0]).toContain('is not listed in ChangePlan expected changes');
  });

  test('Should reject incompatible action on scope target', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/auth.ts',
        action: 'DELETE', // ChangePlan expects MODIFY
        expectedHashBefore: null
      }
    ];

    const engine = new ProposalSimulationEngine(sandboxPath);
    const res = engine.simulateProposal(originalModel, changePlan, patches);

    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('is not compatible with authorized action');
  });

  test('Should reject path traversal imports (Contrabando Caso A)', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/auth.ts',
        action: 'MODIFY',
        expectedHashBefore: null,
        content: `
          import { Secret } from '../../outside-secret';
          export class Auth {}
        `
      }
    ];

    const engine = new ProposalSimulationEngine(sandboxPath);
    const res = engine.simulateProposal(originalModel, changePlan, patches);

    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain("Cannot resolve local import '../../outside-secret'");
  });

  test('Should reject imports to reserved infrastructure .asaf (Contrabando Caso B)', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/auth.ts',
        action: 'MODIFY',
        expectedHashBefore: null,
        content: `
          import config from '../../../.asaf/config';
          export class Auth {}
        `
      }
    ];

    const engine = new ProposalSimulationEngine(sandboxPath);
    const res = engine.simulateProposal(originalModel, changePlan, patches);

    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain("Cannot resolve local import '../../../.asaf/config'");
  });

  test('Should evaluate imports to package.json (Contrabando Caso C)', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/auth.ts',
        action: 'MODIFY',
        expectedHashBefore: null,
        content: `
          import pkg from '../package.json';
          export class Auth {}
        `
      }
    ];

    const engine = new ProposalSimulationEngine(sandboxPath);
    const res = engine.simulateProposal(originalModel, changePlan, patches);

    // package.json no es resuelto localmente por el resolvedor original de TS (solo procesa archivos de código)
    expect(res.dependenciesAdded).not.toContain('src/auth.ts -> package.json');
  });

  test('Should resolve node built-ins as non-workspace dependencies (Contrabando Caso D)', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/auth.ts',
        action: 'MODIFY',
        expectedHashBefore: null,
        content: `
          import fs from 'node:fs';
          export class Auth {}
        `
      }
    ];

    const engine = new ProposalSimulationEngine(sandboxPath);
    const res = engine.simulateProposal(originalModel, changePlan, patches);

    // Debe ser válido porque no es una dependencia local rota, sino un core module de Node
    expect(res.isValid).toBe(true);
    expect(res.dependenciesAdded).toHaveLength(0); // No es una dependencia física del workspace
  });

  test('Invariante: originalModel must remain structural and byte immutable', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/auth.ts',
        action: 'MODIFY',
        expectedHashBefore: null,
        content: `
          import { Logger } from './logger';
          export class Auth {}
        `
      }
    ];

    const beforeHash = canonical(originalModel);
    const engine = new ProposalSimulationEngine(sandboxPath);
    engine.simulateProposal(originalModel, changePlan, patches);
    const afterHash = canonical(originalModel);

    expect(beforeHash).toBe(afterHash);
  });

  test('Invariante: No-Touch Disk Test (State hash validation)', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/new-service.ts',
        action: 'CREATE',
        expectedHashBefore: null,
        content: `
          import { Logger } from './logger';
          export class NewService {}
        `
      }
    ];

    const beforeWorkspaceHash = getWorkspaceStateHash();

    const engine = new ProposalSimulationEngine(sandboxPath);
    engine.simulateProposal(originalModel, changePlan, patches);

    const afterWorkspaceHash = getWorkspaceStateHash();

    expect(beforeWorkspaceHash).toBe(afterWorkspaceHash);
  });

  test('Invariante: Determinismo Test (x10 runs canonical check)', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/auth.ts',
        action: 'MODIFY',
        expectedHashBefore: null,
        content: `
          import { Logger } from './logger';
          export class Auth {}
        `
      }
    ];

    const engine = new ProposalSimulationEngine(sandboxPath);
    const results: string[] = [];

    for (let i = 0; i < 10; i++)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

    // Verificar que todas las ejecuciones produjeron exactamente el mismo string serializado
    const firstResult = results[0];
    results.forEach(r => {
      expect(r).toBe(firstResult);
    });
  });

  test('Invariante: Failure isolation test', () => {
    const patches: FilePatch[] = [
      {
        filePath: 'src/auth.ts',
        action: 'MODIFY',
        expectedHashBefore: null,
        content: `
          import { Secret } from '../../outside-secret'; // Inválido
          export class Auth {}
        `
      }
    ];

    const engine = new ProposalSimulationEngine(sandboxPath);
    const res = engine.simulateProposal(originalModel, changePlan, patches);

    expect(res.isValid).toBe(false);
    expect(res.errors).toHaveLength(1);
  });
});
