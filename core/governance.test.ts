import { ProjectModel } from './domain/project-model';
import { ArchitectureGovernanceEngine } from './infrastructure/governance/governance-engine';

describe('Architecture Governance Engine Test Suite', () => {
  const baseModel: ProjectModel = {
    project: { name: 'GovernanceTest', version: '0.1.0', path: '' },
    indexMetadata: {
      schemaVersion: 1,
      indexerVersion: '0.2.5',
      createdAt: '2026-08-10T00:00:00.000Z',
      updatedAt: '2026-08-10T00:00:00.000Z',
      diagnostics: []
    },
    files: [
      { path: 'core/domain/user-entity.ts', hash: 'h1', size: 100 },
      { path: 'core/infrastructure/user-repository.ts', hash: 'h2', size: 200 },
      { path: 'cli/index.ts', hash: 'h3', size: 300 }
    ],
    modules: [],
    symbols: [],
    relations: [
      // Relación prohibida: Domain importa a Infrastructure
      { from: 'core/domain/user-entity.ts', to: 'core/infrastructure/user-repository.ts', type: 'imports' }
    ],
    apis: [],
    databases: [],
    tests: [],
    dependencies: [],
    architecture: { layers: [] },
    decisions: [],
    git: {
      indexedCommit: 'commit1',
      headCommit: 'commit1',
      changedFilesSinceLastIndex: [],
      indexTimestamp: '2026-08-10T00:00:00.000Z',
      isDirty: false
    }
  };

  test('Debería evaluar pertenencia de capas estrictas mediante segmentos', () => {
    const engine = new ArchitectureGovernanceEngine(JSON.parse(JSON.stringify(baseModel)), '/non-existent');
    
    expect(engine.isPathInLayer('core/domain/user.ts', 'core/domain')).toBe(true);
    expect(engine.isPathInLayer('core/domain-old/user.ts', 'core/domain')).toBe(false);
    expect(engine.isPathInLayer('core/domain', 'core/domain')).toBe(true);
    expect(engine.isPathInLayer('core/dom/user.ts', 'core/domain')).toBe(false);
  });

  test('Debería reportar violaciones para imports prohibidos con evidencia completa', () => {
    const model = JSON.parse(JSON.stringify(baseModel));
    const engine = new ArchitectureGovernanceEngine(model, '/non-existent');
    const report = engine.checkRules();

    expect(report.status).toBe('violations');
    expect(report.errors).toBe(1);
    expect(report.violations.length).toBe(1);

    const violation = report.violations[0];
    expect(violation.file).toBe('core/domain/user-entity.ts');
    expect(violation.importedPath).toBe('core/infrastructure/user-repository.ts');
    expect(violation.rule).toBe('rule:Domain');
    expect(violation.evidence.relations[0].type).toBe('imports');
  });

  test('Debería inyectar relaciones governed-by dinámicamente en el ProjectModel', () => {
    const model = JSON.parse(JSON.stringify(baseModel));
    const engine = new ArchitectureGovernanceEngine(model, '/non-existent');
    
    // Debería existir la relación del archivo core/domain/user-entity.ts a la regla Domain
    const hasRelation = model.relations.some(
      (r: any) => r.from === 'core/domain/user-entity.ts' && r.to === 'rule:Domain' && r.type === 'governed-by'
    );
    expect(hasRelation).toBe(true);
  });

  test('Debería detectar boundaries cruzados al evaluar el impacto', () => {
    const model = JSON.parse(JSON.stringify(baseModel));
    const engine = new ArchitectureGovernanceEngine(model, '/non-existent');
    
    // Si modificamos 'core/domain/user-entity.ts', y esto impacta a 'core/infrastructure/user-repository.ts'
    // La regla 'rule:Domain' prohíbe importar de 'core/infrastructure'.
    const boundaries = engine.findAffectedBoundaries('core/domain/user-entity.ts', ['core/infrastructure/user-repository.ts']);
    
    expect(boundaries.length).toBe(1);
    expect(boundaries[0]).toContain('core/infrastructure');
  });
});
