import * as fs from 'fs';
import * as path from 'path';
import { ChangeExecutor } from './change-executor';
import { FileOperation } from './file-operation';
import { PlanningResult } from '../planning/types';
import { FilePatch } from './types';
import { GitSafetyLayer } from './git-safety';
import { ValidationEngine } from './validation-engine';

jest.mock('./git-safety');
jest.mock('./validation-engine');

describe('ChangeExecutor Tests (INV-005, INV-006, INV-011)', () => {
  const tempDir = path.resolve(__dirname, 'temp_executor_project');
  let fileOp: FileOperation;
  let executor: ChangeExecutor;

  const mockPlanningResult = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', riskScore: number): PlanningResult => {
    return {
      changePlan: {
        task: 'Test Task',
        intent: {
          task: 'Test Task',
          action: 'UPDATE',
          concepts: [],
          technicalAreas: [],
          probableArtifacts: [],
          confidence: 1.0
        },
        targets: [],
        summary: {
          changeType: 'UPDATE',
          complexity: 'LOW',
          riskScore
        },
        changes: [],
        impact: {
          affectedNodes: [],
          dependencies: [],
          dependents: [],
          boundariesCrossed: []
        },
        tests: {
          affected: [],
          recommended: [],
          missing: []
        },
        risks: [],
        architecture: {
          violations: [],
          affectedADRs: [],
          conflicts: []
        },
        evidence: [],
        recommendations: []
      },
      architectureDelta: {
        addedNodes: [],
        removedNodes: [],
        modifiedNodes: [],
        addedRelations: [],
        removedRelations: [],
        boundariesEntered: [],
        boundariesExited: [],
        violationsIntroduced: [],
        violationsResolved: [],
        affectedADRs: [],
        evidence: []
      },
      changeGraph: {
        nodes: [],
        edges: [],
        hasCycle: false,
        cycleNodes: [],
        topologicalOrder: []
      },
      testStrategy: {
        mustRun: [],
        shouldRun: [],
        recommendedToCreate: [],
        missingCoverage: [],
        blocked: []
      },
      executionPlan: {
        steps: [],
        parallelGroups: [],
        blocked: [],
        hasCycle: false,
        evidence: []
      },
      summary: {
        changeType: 'UPDATE',
        complexity: 'LOW',
        riskScore,
        riskLevel, // Incorporado en Fase A
        hasCycle: false,
        metrics: {
          graphNodes: 0,
          graphEdges: 0,
          changes: 0,
          affectedTests: 0,
          missingTests: 0,
          boundariesCrossed: 0,
          risks: 0,
          evidenceCount: 0
        }
      },
      evidence: []
    };
  };

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fileOp = new FileOperation(tempDir);
    executor = new ChangeExecutor(tempDir);
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
    }
  });

  beforeEach(() => {
    jest.resetAllMocks();
    
    // Configurar GitSafety por defecto limpia
    (GitSafetyLayer.prototype.inspect as jest.Mock).mockReturnValue({
      isRepository: true,
      isClean: true,
      currentBranch: 'main',
      headCommit: 'abc',
      changedFiles: [],
      conflictingFiles: [],
      activeMergeOrRebase: false
    });

    // Configurar ValidationEngine por defecto pasa
    (ValidationEngine.prototype.validate as jest.Mock).mockResolvedValue({
      passed: true,
      checks: {},
      errors: []
    });

    // Limpiar sesiones y locks
    const sessionsDir = path.join(tempDir, '.asaf', 'sessions');
    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir);
      for (const file of files)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
    }
    
    const testFile = 'src/code.ts';
    if (fileOp.existsSync(testFile)) {
      fileOp.deleteFileSync(testFile);
    }
  });

  test('should execute DRY RUN and not modify disk physically', async () => {
    const plan = mockPlanningResult('MEDIUM', 45);
    const patches: FilePatch[] = [
      {
        filePath: 'src/code.ts',
        action: 'CREATE',
        expectedHashBefore: null,
        content: 'const a = 1;'
      }
    ];

    const session = await executor.execute(plan, patches, { dryRun: true });
    expect(session.status).toBe('COMMITTED');
    expect(session.dryRun).toBe(true);
    expect(fileOp.existsSync('src/code.ts')).toBe(false); // No se modificó el disco
  });

  test('should execute real modifications when dryRun is false (INV-005)', async () => {
    const plan = mockPlanningResult('MEDIUM', 45);
    const patches: FilePatch[] = [
      {
        filePath: 'src/code.ts',
        action: 'CREATE',
        expectedHashBefore: null,
        content: 'const a = 1;'
      }
    ];

    const session = await executor.execute(plan, patches, { dryRun: false });
    expect(session.status).toBe('COMMITTED');
    expect(session.dryRun).toBe(false);
    expect(fileOp.existsSync('src/code.ts')).toBe(true);
    expect(fileOp.readFileSync('src/code.ts')).toBe('const a = 1;');
  });

  test('should trigger automatic rollback if post-validation fails (INV-006 & INV-008)', async () => {
    const plan = mockPlanningResult('HIGH', 75);
    const patches: FilePatch[] = [
      {
        filePath: 'src/code.ts',
        action: 'CREATE',
        expectedHashBefore: null,
        content: 'const a = 1;'
      }
    ];

    // Forzar fallo de validación
    (ValidationEngine.prototype.validate as jest.Mock).mockResolvedValue({
      passed: false,
      checks: { build: false },
      errors: ['Build compilation failed.']
    });

    const session = await executor.execute(plan, patches, { dryRun: false });
    expect(session.status).toBe('ROLLED_BACK');
    expect(fileOp.existsSync('src/code.ts')).toBe(false); // Eliminado por el rollback de CREATE
  });

  test('should force Dry Run if risk is CRITICAL (INV-005 Security Gate)', async () => {
    const plan = mockPlanningResult('CRITICAL', 95);
    const patches: FilePatch[] = [
      {
        filePath: 'src/code.ts',
        action: 'CREATE',
        expectedHashBefore: null,
        content: 'const a = 1;'
      }
    ];

    // Aunque pasemos dryRun: false, la política de CRITICAL debe forzar dryRun = true
    const session = await executor.execute(plan, patches, { dryRun: false });
    expect(session.dryRun).toBe(true);
    expect(session.status).toBe('COMMITTED');
    expect(fileOp.existsSync('src/code.ts')).toBe(false);
  });
});
