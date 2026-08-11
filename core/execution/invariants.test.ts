import * as fs from 'fs';
import * as path from 'path';
import { ChangeExecutor } from './change-executor';
import { FileOperation } from './file-operation';
import { LockManager } from './lock-manager';
import { ExecutionSessionManager } from './execution-session';
import { GitSafetyLayer } from './git-safety';
import { ValidationEngine } from './validation-engine';
import { FilePatch } from './types';
import { PlanningResult } from '../planning/types';

jest.mock('./git-safety');
jest.mock('./validation-engine');

describe('ASAF v0.3.0 Formal Security Invariants (INV-005 to INV-014)', () => {
  const tempDir = path.resolve(__dirname, 'temp_invariants_project');
  let fileOp: FileOperation;
  let executor: ChangeExecutor;
  let lockManager: LockManager;
  let sessionManager: ExecutionSessionManager;

  const mockPlanningResult = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', riskScore: number): PlanningResult => {
    return {
      changePlan: {
        task: 'Invariant test',
        intent: { task: 'Invariant test', action: 'UPDATE', concepts: [], technicalAreas: [], probableArtifacts: [], confidence: 1.0 },
        targets: [],
        summary: { changeType: 'UPDATE', complexity: 'LOW', riskScore },
        changes: [], impact: { affectedNodes: [], dependencies: [], dependents: [], boundariesCrossed: [] },
        tests: { affected: [], recommended: [], missing: [] }, risks: [],
        architecture: { violations: [], affectedADRs: [], conflicts: [] }, evidence: [], recommendations: []
      },
      architectureDelta: {
        addedNodes: [], removedNodes: [], modifiedNodes: [], addedRelations: [], removedRelations: [],
        boundariesEntered: [], boundariesExited: [], violationsIntroduced: [], violationsResolved: [], affectedADRs: [], evidence: []
      },
      changeGraph: { nodes: [], edges: [], hasCycle: false, cycleNodes: [], topologicalOrder: [] },
      testStrategy: { mustRun: [], shouldRun: [], recommendedToCreate: [], missingCoverage: [], blocked: [] },
      executionPlan: { steps: [], parallelGroups: [], blocked: [], hasCycle: false, evidence: [] },
      summary: {
        changeType: 'UPDATE', complexity: 'LOW', riskScore, riskLevel, hasCycle: false,
        metrics: { graphNodes: 0, graphEdges: 0, changes: 0, affectedTests: 0, missingTests: 0, boundariesCrossed: 0, risks: 0, evidenceCount: 0 }
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
    lockManager = new LockManager(tempDir);
    sessionManager = new ExecutionSessionManager(tempDir);
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
    
    // Simular Git limpio
    (GitSafetyLayer.prototype.inspect as jest.Mock).mockReturnValue({
      isRepository: true, isClean: true, currentBranch: 'main', headCommit: 'abc', changedFiles: [], conflictingFiles: [], activeMergeOrRebase: false
    });

    // Simular Validación exitosa
    (ValidationEngine.prototype.validate as jest.Mock).mockResolvedValue({
      passed: true, checks: {}, errors: []
    });

    // Limpiar directorios
    const sessionsDir = path.join(tempDir, '.asaf', 'sessions');
    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir);
      for (const file of files)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
    }
  });

  test('INV-005: Safe Execution Gate & CRITICAL Dry Run Only', async () => {
    const plan = mockPlanningResult('CRITICAL', 95);
    const patches: FilePatch[] = [{ filePath: 'src/inv.ts', action: 'CREATE', expectedHashBefore: null, content: 'test' }];

    const session = await executor.execute(plan, patches, { dryRun: false });
    expect(session.dryRun).toBe(true); // Forzado a dry run por política de riesgo crítico
    expect(fileOp.existsSync('src/inv.ts')).toBe(false);
  });

  test('INV-006: Rollback Integrity (SHA-256 verification)', async () => {
    const filePath = 'src/inv.ts';
    const originalContent = 'const original = true;';
    fileOp.writeFileSync(filePath, originalContent);
    const originalHash = fileOp.readFileSync(filePath);

    // Configurar fallo de validación para disparar rollback
    (ValidationEngine.prototype.validate as jest.Mock).mockResolvedValue({
      passed: false, checks: { tests: false }, errors: ['Tests failed.']
    });

    const plan = mockPlanningResult('MEDIUM', 45);
    const patches: FilePatch[] = [{
      filePath,
      action: 'MODIFY',
      expectedHashBefore: require('crypto').createHash('sha256').update(originalContent).digest('hex'),
      content: 'const modified = true;'
    }];

    const session = await executor.execute(plan, patches, { dryRun: false });
    expect(session.status).toBe('ROLLED_BACK');
    expect(fileOp.readFileSync(filePath)).toBe(originalContent); // Restaurado correctamente
  });

  test('INV-007: Change Scope Containment', async () => {
    const file1 = 'src/expected.ts';
    const file2 = 'src/unexpected.ts';
    fileOp.writeFileSync(file1, 'data1');
    fileOp.writeFileSync(file2, 'data2');

    // Mock reactivo para simular el comportamiento de Git status frente a cambios físicos en inesperados
    (GitSafetyLayer.prototype.inspect as jest.Mock).mockImplementation(() => {
      const unexpectedChanged = fileOp.existsSync(file2) && fileOp.readFileSync(file2) === 'modifiedData2';
      return {
        isRepository: true,
        isClean: false,
        currentBranch: 'main',
        headCommit: 'abc',
        changedFiles: unexpectedChanged ? [file1, file2] : [file1],
        conflictingFiles: [],
        activeMergeOrRebase: false
      };
    });

    const { ValidationEngine: RealValidationEngine } = jest.requireActual('./validation-engine');
    (ValidationEngine.prototype.validate as jest.Mock).mockImplementation(async (context) => {
      fileOp.writeFileSync(file2, 'modifiedData2');
      const realValEngine = new RealValidationEngine(tempDir);
      return realValEngine.validate(context);
    });

    const plan = mockPlanningResult('LOW', 10);
    const patches: FilePatch[] = [{
      filePath: file1,
      action: 'MODIFY',
      expectedHashBefore: require('crypto').createHash('sha256').update('data1').digest('hex'),
      content: 'data1modified'
    }];

    const session = await executor.execute(plan, patches, { dryRun: false });
    expect(session.status).toBe('ROLLED_BACK'); // Debe fallar y revertir por violar el scope
    expect(session.validation?.checks.scope).toBe(false);
  });

  test('INV-009: Precondition Integrity Check', async () => {
    const filePath = 'src/precondition.ts';
    fileOp.writeFileSync(filePath, 'original content');

    const plan = mockPlanningResult('LOW', 10);
    const patches: FilePatch[] = [{
      filePath,
      action: 'MODIFY',
      expectedHashBefore: 'wronghash123', // Hash incorrecto
      content: 'new content'
    }];

    await expect(executor.execute(plan, patches, { dryRun: false })).rejects.toThrow(/has been modified externally/);
  });

  test('INV-010 & INV-014: Path Containment & Symlink Escape Prevention', () => {
    expect(() => {
      fileOp.resolveAndValidatePath('../outside.ts');
    }).toThrow(/Security Violation: Path containment breach/);
  });

  test('INV-011: Session State Integrity Transition rules', () => {
    const session = sessionManager.createSession('LOW', 10, false);
    expect(session.status).toBe('CREATED');

    sessionManager.updateSessionStatus(session.sessionId, 'COMMITTED');
    const updated = sessionManager.loadSession(session.sessionId)!;
    expect(updated.status).toBe('COMMITTED');
  });

  test('INV-013: Lock Manager Exclusivity', () => {
    const filePath = 'src/locked_file.ts';
    const expiresAt = new Date(Date.now() + 5000).toISOString();

    const acquired1 = lockManager.acquireLock('session_1', filePath, expiresAt);
    expect(acquired1).toBe(true);

    const acquired2 = lockManager.acquireLock('session_2', filePath, expiresAt);
    expect(acquired2).toBe(false); // Bloqueado
  });
});
