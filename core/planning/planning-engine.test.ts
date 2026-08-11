import { PlanningEngine } from './planning-engine';
import { ProjectModel } from '../domain/project-model';
import { ChangePlan } from '../reasoning/types';

describe('PlanningEngine', () => {
  let engine: PlanningEngine;
  let mockModel: ProjectModel;
  let mockChangePlan: ChangePlan;

  beforeEach(() => {
    mockModel = {
      project: { name: 'planning-test', version: '1.0.0', path: 'temp' },
      indexMetadata: { schemaVersion: 1, indexerVersion: '1.0.0', createdAt: '', updatedAt: '', diagnostics: [] },
      files: [
        { path: 'src/core/auth.service.ts', hash: 'h1', size: 100 }
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
      git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
    };

    mockChangePlan = {
      task: 'Agregar AuthController',
      intent: { task: 'Agregar AuthController', action: 'CREATE', concepts: [], technicalAreas: [], probableArtifacts: [], confidence: 1 },
      targets: ['src/core/auth.service.ts'],
      summary: { changeType: 'CREATE', complexity: 'LOW', riskScore: 10 },
      changes: [
        {
          path: 'src/core/auth.controller.ts',
          action: 'CREATE',
          priority: 2,
          reason: 'Nuevo controlador',
          dependencies: ['src/core/auth.service.ts'],
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

    engine = new PlanningEngine(mockModel);
  });

  test('1. Debería ejecutar el pipeline de planificación completo y retornar el PlanningResult estructurado', () => {
    const result = engine.plan(mockChangePlan);

    // Estructuras de PlanningResult
    expect(result.changeGraph).toBeDefined();
    expect(result.architectureDelta).toBeDefined();
    expect(result.testStrategy).toBeDefined();
    expect(result.executionPlan).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.evidence.length).toBeGreaterThan(0);

    // Simulación Delta
    expect(result.architectureDelta.addedNodes.length).toBe(1);
    expect(result.architectureDelta.addedNodes[0].id).toBe('src/core/auth.controller.ts');

    // Grafo de cambios
    expect(result.changeGraph.nodes.length).toBe(1);
    expect(result.changeGraph.topologicalOrder).toEqual(['src/core/auth.controller.ts']);

    // Métricas del plan
    expect(result.summary.metrics.changes).toBe(1);
    expect(result.summary.complexity).toBe('LOW'); // 1 cambio y < 25 score = LOW
  });
});
