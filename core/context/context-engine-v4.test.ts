import * as fs from 'fs';
import * as path from 'path';
import { ContextEnginev4 } from './context-engine-v4';
import { ChangePlan } from '../reasoning/types';
import { ProjectModel } from '../domain/project-model';
import { AIContextv4 } from './context-types-v4';

describe('ContextEnginev4 Tests', () => {
  const sandboxPath = path.resolve(__dirname, 'temp_context_sandbox');

  beforeAll(() => {
    // Crear sandbox temporal y escribir archivos de prueba
    if (!fs.existsSync(sandboxPath)) {
      fs.mkdirSync(sandboxPath, { recursive: true });
    }

    // 1. Target file con código completo
    const targetCode = `import { dep } from './dependency';
@decorator
export class AuthService {
  private key = 'secret';

  constructor()  { /* Constructor del motor ASAF */ }

  public async login(user: string): Promise<boolean>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

  private async verify(user: string): Promise<boolean>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
}`;
    fs.writeFileSync(path.resolve(sandboxPath, 'target.ts'), targetCode, 'utf-8');

    // 2. Dependency file
    const depCode = `export function dep()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }`;
    fs.writeFileSync(path.resolve(sandboxPath, 'dependency.ts'), depCode, 'utf-8');

    // 3. Test file
    const testCode = `describe('AuthService', () => {
  it('should login', () => {});
});`;
    fs.writeFileSync(path.resolve(sandboxPath, 'target.test.ts'), testCode, 'utf-8');
  });

  afterAll(() => {
    // Eliminar sandbox temporal
    if (fs.existsSync(sandboxPath)) {
      fs.rmSync(sandboxPath, { recursive: true, force: true });
    }
  });

  // ChangePlan de prueba
  const changePlan: ChangePlan = {
    task: 'Configure authentication service',
    intent: {
      task: 'Configure auth',
      action: 'REFACTOR',
      concepts: ['auth'],
      technicalAreas: ['security'],
      probableArtifacts: [],
      confidence: 1.0
    },
    targets: ['target.ts'],
    summary: { changeType: 'REFACTOR', complexity: 'LOW', riskScore: 5 },
    changes: [
      {
        path: 'target.ts',
        action: 'MODIFY',
        priority: 1,
        reason: 'refactor logic',
        dependencies: ['dependency.ts'],
        evidence: []
      }
    ],
    impact: {
      affectedNodes: ['dependency.ts'],
      dependencies: ['dependency.ts'],
      dependents: ['dependant.ts'],
      boundariesCrossed: []
    },
    tests: {
      affected: [
        {
          testFile: 'target.test.ts',
          target: 'target.ts',
          classification: 'DIRECT',
          distance: 1,
          path: [],
          confidence: 1.0,
          reason: 'test covers target'
        }
      ],
      recommended: [],
      missing: []
    },
    risks: [],
    architecture: {
      violations: [
        {
          ruleId: 'GOV-001',
          description: 'AuthService must not import infrastructure packages',
          severity: 'error',
          target: 'target.ts',
          reason: 'import rule'
        }
      ],
      affectedADRs: [
        {
          adrId: 'ADR-001',
          title: 'Authentication Strategy',
          status: 'accepted',
          reason: 'governs strategy',
          impactType: 'GOVERNS'
        }
      ],
      conflicts: []
    },
    evidence: [],
    recommendations: []
  };

  // ProjectModel de prueba
  const originalModel: ProjectModel = {
    project: { name: 'ASAF', version: '1.0.0', path: sandboxPath },
    indexMetadata: { schemaVersion: 1, indexerVersion: '1.0', createdAt: '', updatedAt: '', diagnostics: [] },
    files: [
      { path: 'target.ts', hash: 'h1', size: 500 },
      { path: 'dependency.ts', hash: 'h2', size: 100 }
    ],
    modules: [],
    symbols: [
      { id: 's1', name: 'AuthService', type: 'class', filePath: 'target.ts', line: 3 },
      { id: 's2', name: 'login', type: 'function', filePath: 'target.ts', line: 9 }
    ],
    relations: [],
    apis: [],
    databases: [],
    tests: [],
    dependencies: [],
    architecture: { layers: [] },
    decisions: [
      {
        id: 'ADR-001',
        title: 'Authentication Strategy',
        status: 'accepted',
        decision: 'Use JWT for session-less authentication.',
        file: 'target.ts'
      }
    ],
    git: { indexedCommit: '', headCommit: '', isDirty: false, changedFilesSinceLastIndex: [], indexTimestamp: '' }
  };

  test('Should build a complete AIContext structured payload', () => {
    const engine = new ContextEnginev4(sandboxPath);
    const context = engine.buildContext(changePlan, originalModel, 30000, ['PREV_BUILD_FAIL']);

    expect(context.task).toBe('Configure authentication service');
    expect(context.changePlanSummary.complexity).toBe('LOW');
    expect(context.targetFiles).toHaveLength(1);
    expect(context.targetFiles[0].filePath).toBe('target.ts');
    expect(context.targetFiles[0].status).toBe('TARGET');
    expect(context.targetFiles[0].granularity).toBe('FULL');
    expect(context.contextOnlyFiles).toHaveLength(1);
    expect(context.contextOnlyFiles[0].filePath).toBe('dependency.ts');
    expect(context.contextOnlyFiles[0].status).toBe('CONTEXT');
    expect(context.previousErrors).toEqual(['PREV_BUILD_FAIL']);
    expect(context.relevantADRs).toHaveLength(1);
    expect(context.relevantADRs[0].recommendation).toBe('Use JWT for session-less authentication.');
  });

  test('Should wrap code content in UNTRUSTED REPOSITORY DATA security block', () => {
    const engine = new ContextEnginev4(sandboxPath);
    const context = engine.buildContext(changePlan, originalModel);

    const filePayload = context.targetFiles[0];
    expect(filePayload.content).toContain('[UNTRUSTED REPOSITORY DATA FILE: target.ts]');
    expect(filePayload.content).toContain('[/UNTRUSTED REPOSITORY DATA]');
    expect(filePayload.content).toContain('class AuthService');
  });

  test('Should compute deterministic reproducible contextHash', () => {
    const engine = new ContextEnginev4(sandboxPath);
    const context1 = engine.buildContext(changePlan, originalModel);
    const context2 = engine.buildContext(changePlan, originalModel);

    expect(context1.contextHash).toBeDefined();
    expect(context1.contextHash).toBe(context2.contextHash);
  });

  test('Should execute structural slicing (STRUCTURAL) omitting method bodies', () => {
    const engine = new ContextEnginev4(sandboxPath);
    const sliced = engine.sliceCode('target.ts', 'STRUCTURAL');

    expect(sliced).toContain('export class AuthService');
    expect(sliced).toContain('{ /* ... código omitido por ASAF ... */ }');
    expect(sliced).not.toContain('console.log(\'init\')');
    expect(sliced).not.toContain('const isValid = await this.verify(user)');
  });

  test('Should execute signature slicing (SIGNATURE) keeping only signatures', () => {
    const engine = new ContextEnginev4(sandboxPath);
    const sliced = engine.sliceCode('target.ts', 'SIGNATURE');

    expect(sliced).toContain('import { dep } from \'./dependency\'');
    expect(sliced).toContain('export class AuthService');
    expect(sliced).not.toContain('console.log');
    expect(sliced).not.toContain('isValid');
  });

  test('Should execute minimal slicing (MINIMAL) returning only metadata comments', () => {
    const engine = new ContextEnginev4(sandboxPath);
    const sliced = engine.sliceCode('target.ts', 'MINIMAL');

    expect(sliced).toContain('// Minimal structural view for: target.ts');
    expect(sliced).not.toContain('class AuthService');
  });

  test('Should enforce token budget by slicing context files dynamically', () => {
    const engine = new ContextEnginev4(sandboxPath);
    
    // Configurar un tokenBudget extremadamente bajo (ej. 180 tokens)
    // Esto forzará al engine a reducir primero dependency.ts (context file) de FULL -> STRUCTURAL -> SIGNATURE -> MINIMAL
    const context = engine.buildContext(changePlan, originalModel, 180);

    expect(context.tokenUsageEstimate).toBeLessThanOrEqual(180);
    // El archivo de contexto 'dependency.ts' debió reducir su granularidad a MINIMAL o SIGNATURE
    const depFile = context.contextOnlyFiles[0];
    expect(depFile.granularity).not.toBe('FULL');
  });

  test('Should drop context files entirely if token budget is critically low', () => {
    const engine = new ContextEnginev4(sandboxPath);
    
    // Token budget absurdamente bajo
    const context = engine.buildContext(changePlan, originalModel, 90);

    expect(context.tokenUsageEstimate).toBeLessThanOrEqual(90);
    // Debió vaciar contextOnlyFiles por completo
    expect(context.contextOnlyFiles).toHaveLength(0);
  });
});
