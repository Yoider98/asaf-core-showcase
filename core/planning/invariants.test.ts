import { PlanningEngine } from './planning-engine';
import { ProjectModel } from '../domain/project-model';
import { ChangePlan } from '../reasoning/types';

describe('Invariantes y Regresión de Planificación v0.2.9', () => {
  let mockModel: ProjectModel;
  let mockChangePlan: ChangePlan;

  beforeEach(() => {
    mockModel = {
      project: { name: 'invariants-test', version: '1.0.0', path: 'temp' },
      indexMetadata: { schemaVersion: 1, indexerVersion: '1.0.0', createdAt: '', updatedAt: '', diagnostics: [] },
      files: [
        { path: 'src/services/auth.service.ts', hash: 'h1', size: 100 },
        { path: 'src/controllers/auth.controller.ts', hash: 'h2', size: 150 }
      ],
      modules: [],
      symbols: [],
      relations: [
        { from: 'src/controllers/auth.controller.ts', to: 'src/services/auth.service.ts', type: 'imports' }
      ],
      apis: [],
      databases: [],
      tests: [],
      dependencies: [],
      architecture: { layers: [] },
      decisions: [],
      git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
    };

    mockChangePlan = {
      task: 'Refactorizar Auth',
      intent: { task: '', action: 'UPDATE', concepts: [], technicalAreas: [], probableArtifacts: [], confidence: 1 },
      targets: ['src/services/auth.service.ts'],
      summary: { changeType: 'UPDATE', complexity: 'LOW', riskScore: 20 },
      changes: [
        {
          path: 'src/services/auth.service.ts',
          action: 'MODIFY',
          priority: 2,
          reason: 'Refactorización interna',
          dependencies: [],
          evidence: [
            {
              type: 'semantic_match',
              description: 'Coincidencia semántica con auth',
              confidence: 0.9
            }
          ]
        },
        {
          path: 'src/controllers/auth.controller.ts',
          action: 'MODIFY',
          priority: 3,
          reason: 'Consumir refactorización',
          dependencies: ['src/services/auth.service.ts'],
          evidence: [
            {
              type: 'graph_relation',
              description: 'Dependiente directo',
              confidence: 1.0
            }
          ]
        }
      ],
      impact: { affectedNodes: [], dependencies: [], dependents: [], boundariesCrossed: [] },
      tests: { affected: [], recommended: [], missing: [] },
      risks: [],
      architecture: { violations: [], affectedADRs: [], conflicts: [] },
      evidence: [],
      recommendations: []
    };
  });

  test('INV-002: Determinismo byte-por-byte idéntico en múltiples corridas', () => {
    const engine = new PlanningEngine(mockModel);
    
    const results = Array.from({ length: 5 }, () => {
      const res = engine.plan(mockChangePlan);
      // Eliminar planificación temporal si existiera
      delete res.summary.metrics.planningTimeMs;
      return JSON.stringify(res);
    });

    // Comparación consecutiva byte-por-byte
    for (let i = 1; i < results.length; i++)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('INV-003: Cada paso en el plan de ejecución y delta de arquitectura contiene evidencias', () => {
    const engine = new PlanningEngine(mockModel);
    const result = engine.plan(mockChangePlan);

    // Delta de arquitectura
    result.architectureDelta.addedNodes.forEach(node => {
      expect(node.evidence.length).toBeGreaterThan(0);
    });
    result.architectureDelta.modifiedNodes.forEach(node => {
      expect(node.evidence.length).toBeGreaterThan(0);
    });

    // Execution steps
    result.executionPlan.steps.forEach(step => {
      expect(step.evidence.length).toBeGreaterThan(0);
    });
  });

  test('INV-004: No-Mutación: El modelo original no se altera durante la simulación', () => {
    const originalString = JSON.stringify(mockModel);
    const engine = new PlanningEngine(mockModel);
    engine.plan(mockChangePlan);

    const postString = JSON.stringify(mockModel);
    expect(postString).toBe(originalString);
  });

  test('Correctitud Topológica: El plan de ejecución sigue el orden de dependencias correcto', () => {
    const engine = new PlanningEngine(mockModel);
    const result = engine.plan(mockChangePlan);

    expect(result.executionPlan.hasCycle).toBe(false);

    // En mockChangePlan: auth.controller depende de auth.service.
    // Por ende, auth.service debe ejecutarse antes que auth.controller.
    const serviceStep = result.executionPlan.steps.find(s => s.target === 'src/services/auth.service.ts');
    const controllerStep = result.executionPlan.steps.find(s => s.target === 'src/controllers/auth.controller.ts');

    expect(serviceStep).toBeDefined();
    expect(controllerStep).toBeDefined();
    expect(serviceStep!.order).toBeLessThan(controllerStep!.order);
  });
});
