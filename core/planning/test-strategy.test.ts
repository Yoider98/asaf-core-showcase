import { TestStrategyEngine } from './test-strategy';
import { ProjectModel } from '../domain/project-model';
import { ChangePlan } from '../reasoning/types';

describe('TestStrategyEngine', () => {
  let engine: TestStrategyEngine;
  let mockModel: ProjectModel;

  beforeEach(() => {
    mockModel = {
      project: { name: 'test', version: '1.0.0', path: 'temp' },
      indexMetadata: { schemaVersion: 1, indexerVersion: '1.0.0', createdAt: '', updatedAt: '', diagnostics: [] },
      files: [
        { path: 'src/auth/auth.service.ts', hash: 'h1', size: 10 },
        { path: 'src/auth/auth.spec.ts', hash: 'h2', size: 10 }
      ],
      modules: [],
      symbols: [],
      relations: [],
      apis: [],
      databases: [],
      tests: [],
      dependencies: [],
      architecture: {
        layers: [
          'src/auth/'
        ]
      },
      decisions: [],
      git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
    };
    engine = new TestStrategyEngine(mockModel);
  });

  test('1. Debería clasificar tests mustRun (DIRECT) y shouldRun (INDIRECT) con prioridades calculadas', () => {
    const plan: ChangePlan = {
      task: 'test',
      intent: { task: '', action: 'UPDATE', concepts: [], technicalAreas: [], probableArtifacts: [], confidence: 1 },
      targets: ['src/auth/auth.service.ts'],
      summary: { changeType: 'UPDATE', complexity: 'LOW', riskScore: 20 },
      changes: [
        {
          path: 'src/auth/auth.service.ts',
          action: 'MODIFY',
          priority: 4, // Alta prioridad (>3) => +5 de bonus
          reason: 'test',
          dependencies: [],
          evidence: []
        }
      ],
      impact: { affectedNodes: [], dependencies: [], dependents: [], boundariesCrossed: [] },
      tests: {
        affected: [
          {
            testFile: 'src/auth/auth.spec.ts',
            target: 'src/auth/auth.service.ts',
            classification: 'DIRECT',
            distance: 1,
            path: ['src/auth/auth.spec.ts', 'src/auth/auth.service.ts'],
            confidence: 1.0,
            reason: 'direct'
          },
          {
            testFile: 'src/user/user.spec.ts',
            target: 'src/auth/auth.service.ts',
            classification: 'INDIRECT',
            distance: 2,
            path: ['src/user/user.spec.ts', 'src/auth/auth.service.ts'],
            confidence: 0.75,
            reason: 'indirect'
          }
        ],
        recommended: [],
        missing: []
      },
      risks: [],
      architecture: { violations: [], affectedADRs: [], conflicts: [] },
      evidence: [],
      recommendations: []
    };

    const strategy = engine.generate(plan, false);

    // mustRun
    expect(strategy.mustRun.length).toBe(1);
    expect(strategy.mustRun[0].testFile).toBe('src/auth/auth.spec.ts');
    // Prioridad: 100 base + 10 (same boundary) + 5 (change priority) = 115 => limitado a 100.
    expect(strategy.mustRun[0].priority).toBe(100);

    // shouldRun
    expect(strategy.shouldRun.length).toBe(1);
    expect(strategy.shouldRun[0].testFile).toBe('src/user/user.spec.ts');
    // Prioridad: 75 (distancia 2) + 5 (change priority) = 80.
    expect(strategy.shouldRun[0].priority).toBe(80);
  });

  test('2. Debería recomendar crear test para componentes CREATE', () => {
    const plan: ChangePlan = {
      task: 'test',
      intent: { task: '', action: 'CREATE', concepts: [], technicalAreas: [], probableArtifacts: [], confidence: 1 },
      targets: ['src/auth/new.service.ts'],
      summary: { changeType: 'CREATE', complexity: 'LOW', riskScore: 10 },
      changes: [
        {
          path: 'src/auth/new.service.ts',
          action: 'CREATE',
          priority: 2,
          reason: 'nuevo',
          dependencies: [],
          evidence: []
        }
      ],
      impact: { affectedNodes: [], dependencies: [], dependents: [], boundariesCrossed: [] },
      tests: { affected: [], recommended: [], missing: [] },
      risks: [],
      architecture: { violations: [], affectedADRs: [], conflicts: [] },
      evidence: [],
      recommendations: []
    };

    const strategy = engine.generate(plan, false);
    expect(strategy.recommendedToCreate.length).toBe(1);
    expect(strategy.recommendedToCreate[0].testFile).toBe('src/auth/new.service.spec.ts');
    expect(strategy.recommendedToCreate[0].priority).toBe(80);
  });
});
