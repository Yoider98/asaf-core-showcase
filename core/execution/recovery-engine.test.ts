import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { RecoveryEngine } from './recovery-engine';
import { ChangeExecutor } from './change-executor';
import { FileOperation } from './file-operation';
import { LockManager } from './lock-manager';
import { SessionStore } from './session-store';
import { JournalStore } from './journal-store';
import { SnapshotStore } from './snapshot-store';
import { ExecutionHeartbeat } from './execution-heartbeat';
import { GitSafetyLayer } from './git-safety';
import { ValidationEngine } from './validation-engine';
import { FilePatch } from './types';
import { PlanningResult } from '../planning/types';

jest.mock('./git-safety');
jest.mock('./validation-engine');

describe('ASAF v0.3.1 Recovery Engine & Hardening (INV-015 to INV-024)', () => {
  const tempDir = path.resolve(__dirname, 'temp_recovery_project');
  let fileOp: FileOperation;
  let executor: ChangeExecutor;
  let lockManager: LockManager;
  let sessionStore: SessionStore;
  let journalStore: JournalStore;
  let snapshotStore: SnapshotStore;
  let heartbeat: ExecutionHeartbeat;
  let recoveryEngine: RecoveryEngine;

  const mockPlanningResult = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', riskScore: number): PlanningResult => {
    return {
      changePlan: {
        task: 'Recovery Test',
        intent: { task: 'Recovery Test', action: 'UPDATE', concepts: [], technicalAreas: [], probableArtifacts: [], confidence: 1.0 },
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

  const getFileSHA256 = (relativePath: string): string => {
    const fullPath = path.join(tempDir, relativePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
  };

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fileOp = new FileOperation(tempDir);
    executor = new ChangeExecutor(tempDir);
    lockManager = new LockManager(tempDir);
    sessionStore = new SessionStore(tempDir);
    journalStore = new JournalStore(tempDir);
    snapshotStore = new SnapshotStore(tempDir);
    heartbeat = new ExecutionHeartbeat(tempDir);
    recoveryEngine = new RecoveryEngine(tempDir);
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
    jest.restoreAllMocks();
    (GitSafetyLayer.prototype.inspect as jest.Mock).mockReturnValue({
      isRepository: true, isClean: true, currentBranch: 'main', headCommit: 'abc', changedFiles: [], conflictingFiles: [], activeMergeOrRebase: false
    });
    (GitSafetyLayer.prototype.assertSafeForExecution as jest.Mock).mockReturnValue(true);
    (ValidationEngine.prototype.validate as jest.Mock).mockResolvedValue({
      passed: true, checks: {}, errors: []
    });

    // Limpiar directorios temporales de sesiones y bloqueos
    const sessionsDir = path.join(tempDir, '.asaf', 'sessions');
    if (fs.existsSync(sessionsDir)) {
      fs.rmSync(sessionsDir, { recursive: true, force: true });
    }
    const locksDir = path.join(tempDir, '.asaf', 'locks');
    if (fs.existsSync(locksDir)) {
      fs.rmSync(locksDir, { recursive: true, force: true });
    }
    fs.mkdirSync(sessionsDir, { recursive: true });
    fs.mkdirSync(locksDir, { recursive: true });
  });

  test('INV-015 & INV-016: Orphan Session Detection', async () => {
    const demoFile = 'src/demo_orphan.ts';
    fileOp.writeFileSync(demoFile, '// original\n');

    // Forzar que no limpie para simular crash
    jest.spyOn(executor as any, 'rollbackSession').mockImplementation(async () => {});
    (ValidationEngine.prototype.validate as jest.Mock).mockRejectedValue(new Error('Simulated Crash'));

    const plan = mockPlanningResult('LOW', 10);
    const patches: FilePatch[] = [{
      filePath: demoFile,
      action: 'MODIFY',
      expectedHashBefore: getFileSHA256(demoFile),
      content: '// modified\n'
    }];

    await expect(executor.execute(plan, patches, { dryRun: false })).rejects.toThrow('Simulated Crash');
    
    const active = sessionStore.findActive()[0];
    heartbeat.stop(active.sessionId);

    // Forzar el estado a EXECUTING
    active.status = 'EXECUTING';
    sessionStore.save(active);

    const orphans = recoveryEngine.detectOrphans();
    expect(orphans.length).toBe(1);
    expect(orphans[0].sessionId).toBe(active.sessionId);
  });

  test('INV-017: Lock Recovery of Orphan Session', async () => {
    const demoFile = 'src/demo_locks.ts';
    fileOp.writeFileSync(demoFile, '// original\n');

    jest.spyOn(executor as any, 'rollbackSession').mockImplementation(async () => {});
    (ValidationEngine.prototype.validate as jest.Mock).mockRejectedValue(new Error('Simulated Crash'));

    const plan = mockPlanningResult('LOW', 10);
    const patches: FilePatch[] = [{
      filePath: demoFile,
      action: 'MODIFY',
      expectedHashBefore: getFileSHA256(demoFile),
      content: '// modified\n'
    }];

    await expect(executor.execute(plan, patches, { dryRun: false })).rejects.toThrow('Simulated Crash');
    
    const active = sessionStore.findActive()[0];
    heartbeat.stop(active.sessionId);

    active.status = 'EXECUTING';
    sessionStore.save(active);

    // Adquirir lock artificialmente para la sesión
    lockManager.acquireLock(active.sessionId, demoFile, active.expiresAt);

    const locks = lockManager.inspectLocks();
    expect(locks.some(l => l.sessionId === active.sessionId)).toBe(true);

    await recoveryEngine.rollbackOrphan(active.sessionId);

    const locksAfter = lockManager.inspectLocks();
    expect(locksAfter.some(l => l.sessionId === active.sessionId)).toBe(false);
  });

  test('INV-019: Snapshot Integrity Verification', async () => {
    const demoFile = 'src/demo_integrity.ts';
    fileOp.writeFileSync(demoFile, '// original\n');

    jest.spyOn(executor as any, 'rollbackSession').mockImplementation(async () => {});
    (ValidationEngine.prototype.validate as jest.Mock).mockRejectedValue(new Error('Simulated Crash'));

    const plan = mockPlanningResult('LOW', 10);
    const patches: FilePatch[] = [{
      filePath: demoFile,
      action: 'MODIFY',
      expectedHashBefore: getFileSHA256(demoFile),
      content: '// modified\n'
    }];

    await expect(executor.execute(plan, patches, { dryRun: false })).rejects.toThrow('Simulated Crash');
    
    const active = sessionStore.findActive()[0];
    heartbeat.stop(active.sessionId);

    active.status = 'EXECUTING';
    sessionStore.save(active);

    // Corromper el archivo físico del snapshot a mano para simular fallo
    const manifest = snapshotStore.loadManifest(active.sessionId)!;
    const snapFile = manifest.files[0];
    if (snapFile.snapshotPath)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

    await expect(recoveryEngine.rollbackOrphan(active.sessionId)).rejects.toThrow(/Integrity Failure/);
  });

  test('INV-022: Recovery Before Execution Block', async () => {
    const demoFile = 'src/demo_block.ts';
    fileOp.writeFileSync(demoFile, '// original\n');

    jest.spyOn(executor as any, 'rollbackSession').mockImplementation(async () => {});
    (ValidationEngine.prototype.validate as jest.Mock).mockRejectedValue(new Error('Simulated Crash'));

    const plan = mockPlanningResult('LOW', 10);
    const patches: FilePatch[] = [{
      filePath: demoFile,
      action: 'MODIFY',
      expectedHashBefore: getFileSHA256(demoFile),
      content: '// modified\n'
    }];

    await expect(executor.execute(plan, patches, { dryRun: false })).rejects.toThrow('Simulated Crash');
    
    const active = sessionStore.findActive()[0];
    heartbeat.stop(active.sessionId);

    active.status = 'EXECUTING';
    sessionStore.save(active);

    // Intentar iniciar una nueva ejecución debe fallar bloqueado
    const plan2 = mockPlanningResult('LOW', 5);
    await expect(executor.execute(plan2, patches, { dryRun: false })).rejects.toThrow(/Active or orphan session exists/);
  });

  test('Idempotency of Rollback and Resume', async () => {
    const demoFile = 'src/demo_idempotente.ts';
    fileOp.writeFileSync(demoFile, '// original\n');

    jest.spyOn(executor as any, 'rollbackSession').mockImplementation(async () => {});
    (ValidationEngine.prototype.validate as jest.Mock).mockRejectedValue(new Error('Simulated Crash'));

    const plan = mockPlanningResult('LOW', 10);
    const patches: FilePatch[] = [{
      filePath: demoFile,
      action: 'MODIFY',
      expectedHashBefore: getFileSHA256(demoFile),
      content: '// modified\n'
    }];

    await expect(executor.execute(plan, patches, { dryRun: false })).rejects.toThrow('Simulated Crash');
    
    const active = sessionStore.findActive()[0];
    heartbeat.stop(active.sessionId);

    active.status = 'EXECUTING';
    sessionStore.save(active);

    // Rollback 1
    const report1 = await recoveryEngine.rollbackOrphan(active.sessionId);
    expect(report1.status).toBe('ROLLED_BACK');

    // Rollback 2 (debe ser idempotente sin fallar)
    const sessionLoaded = sessionStore.load(active.sessionId)!;
    expect(sessionLoaded.status).toBe('ROLLED_BACK');
  });

  test('Conflict detection by external modification during crash', async () => {
    const demoFile = 'src/demo_conflict.ts';
    fileOp.writeFileSync(demoFile, '// original\n');

    jest.spyOn(executor as any, 'rollbackSession').mockImplementation(async () => {});
    (ValidationEngine.prototype.validate as jest.Mock).mockRejectedValue(new Error('Simulated Crash'));

    const plan = mockPlanningResult('LOW', 10);
    const patches: FilePatch[] = [{
      filePath: demoFile,
      action: 'MODIFY',
      expectedHashBefore: getFileSHA256(demoFile),
      content: '// modified\n'
    }];

    await expect(executor.execute(plan, patches, { dryRun: false })).rejects.toThrow('Simulated Crash');
    
    const active = sessionStore.findActive()[0];
    heartbeat.stop(active.sessionId);

    active.status = 'EXECUTING';
    sessionStore.save(active);

    // Modificar externamente el archivo antes del recovery
    fileOp.writeFileSync(demoFile, '// modified externally\n');

    const report = recoveryEngine.inspectSession(active.sessionId);
    expect(report.status).toBe('BLOCKED');
    expect(report.decision).toBe('REQUIRES_MANUAL_INTERVENTION');
  });
});
