import { SimulationEngine } from './simulation-engine';
import { ProjectModel } from '../domain/project-model';
import { ChangePlan } from '../reasoning/types';

describe('SimulationEngine', () => {
  let simulationEngine: SimulationEngine;
  let mockModel: ProjectModel;

  beforeEach(() => {
    simulationEngine = new SimulationEngine();

    mockModel = {
      project: {
        name: 'test-simulation',
        version: '1.0.0',
        path: 'D:/GitHub/ASAF/temp'
      },
      indexMetadata: {
        schemaVersion: 1,
        indexerVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        diagnostics: []
      },
      files: [
        { path: 'domain/entities/user.ts', hash: 'h1', size: 100 },
        { path: 'use-cases/register-user.ts', hash: 'h2', size: 200 }
      ],
      modules: [],
      symbols: [],
      relations: [
        { from: 'use-cases/register-user.ts', to: 'domain/entities/user.ts', type: 'imports' }
      ],
      apis: [],
      databases: [],
      tests: [],
      dependencies: [],
      architecture: {
        layers: []
      },
      decisions: [],
      git: {
        indexedCommit: 'c1',
        headCommit: 'c1',
        changedFilesSinceLastIndex: [],
        indexTimestamp: new Date().toISOString(),
        isDirty: false
      }
    };
  });

  test('1. Debería simular sin cambios y retornar delta vacío', () => {
    const plan: ChangePlan = {
      task: 'Ninguna',
      intent: {
        task: 'Ninguna',
        action: 'UNKNOWN',
        concepts: [],
        technicalAreas: [],
        probableArtifacts: [],
        confidence: 1.0
      },
      targets: [],
      summary: { changeType: 'UNKNOWN', complexity: 'LOW', riskScore: 0 },
      changes: [],
      impact: { affectedNodes: [], dependencies: [], dependents: [], boundariesCrossed: [] },
      tests: { affected: [], recommended: [], missing: [] },
      risks: [],
      architecture: { violations: [], affectedADRs: [], conflicts: [] },
      evidence: [],
      recommendations: []
    };

    const delta = simulationEngine.simulate(mockModel, plan);
    expect(delta.addedNodes.length).toBe(0);
    expect(delta.removedNodes.length).toBe(0);
    expect(delta.modifiedNodes.length).toBe(0);
    expect(delta.addedRelations.length).toBe(0);
    expect(delta.removedRelations.length).toBe(0);
    expect(delta.boundariesEntered.length).toBe(0);
    expect(delta.boundariesExited.length).toBe(0);
  });

  test('2. Debería simular CREATE y retornar el delta adecuado', () => {
    const plan: ChangePlan = {
      task: 'Agregar AuthService',
      intent: {
        task: 'Agregar AuthService',
        action: 'CREATE',
        concepts: [],
        technicalAreas: [],
        probableArtifacts: [],
        confidence: 1.0
      },
      targets: [],
      summary: { changeType: 'CREATE', complexity: 'LOW', riskScore: 10 },
      changes: [
        {
          path: 'domain/services/auth.service.ts',
          action: 'CREATE',
          priority: 2,
          reason: 'Nuevo servicio de auth',
          dependencies: ['domain/entities/user.ts'],
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

    const delta = simulationEngine.simulate(mockModel, plan);

    expect(delta.addedNodes.length).toBe(1);
    expect(delta.addedNodes[0].id).toBe('domain/services/auth.service.ts');
    expect(delta.addedNodes[0].status).toBe('PROJECTED');
    expect(delta.addedRelations.length).toBe(1);
    expect(delta.addedRelations[0].from).toBe('domain/services/auth.service.ts');
    expect(delta.addedRelations[0].to).toBe('domain/entities/user.ts');
  });

  test('3. Debería simular DELETE y retornar el delta adecuado', () => {
    const plan: ChangePlan = {
      task: 'Eliminar register-user',
      intent: {
        task: 'Eliminar register-user',
        action: 'DELETE',
        concepts: [],
        technicalAreas: [],
        probableArtifacts: [],
        confidence: 1.0
      },
      targets: [],
      summary: { changeType: 'DELETE', complexity: 'LOW', riskScore: 10 },
      changes: [
        {
          path: 'use-cases/register-user.ts',
          action: 'DELETE',
          priority: 1,
          reason: 'Obsoleto',
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

    const delta = simulationEngine.simulate(mockModel, plan);

    expect(delta.removedNodes.length).toBe(1);
    expect(delta.removedNodes[0].id).toBe('use-cases/register-user.ts');
    expect(delta.removedNodes[0].status).toBe('OBSERVED');
    expect(delta.removedRelations.length).toBe(1);
    expect(delta.removedRelations[0].from).toBe('use-cases/register-user.ts');
    expect(delta.removedRelations[0].to).toBe('domain/entities/user.ts');
  });

  test('4. Debería detectar violaciones introducidas (Gobernanza Layer)', () => {
    // La regla por defecto (Clean Architecture) indica que "Domain" no puede importar de "Use Cases" o "Infrastructure"
    // Forzamos que un servicio en "domain/" importe un archivo de "use-cases/"
    const plan: ChangePlan = {
      task: 'Violación',
      intent: {
        task: 'Violación',
        action: 'CREATE',
        concepts: [],
        technicalAreas: [],
        probableArtifacts: [],
        confidence: 1.0
      },
      targets: [],
      summary: { changeType: 'CREATE', complexity: 'LOW', riskScore: 20 },
      changes: [
        {
          path: 'domain/entities/user.ts',
          action: 'MODIFY',
          priority: 1,
          reason: 'Modificar user para importar register-user',
          dependencies: ['use-cases/register-user.ts'],
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

    const delta = simulationEngine.simulate(mockModel, plan);

    expect(delta.violationsIntroduced.length).toBeGreaterThan(0);
    expect(delta.violationsIntroduced[0]).toContain('Violación introducida en domain/entities/user.ts');
  });
});
