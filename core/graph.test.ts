import { ProjectModel } from './domain/project-model';
import { DeterministicGraphQueryEngine } from './infrastructure/graph/query-engine';

describe('Graph Query Engine Test Suite', () => {
  const mockModel: ProjectModel = {
    project: { name: 'Test', version: '1.0', path: '' },
    indexMetadata: {
      schemaVersion: 1,
      indexerVersion: '0.2.3',
      createdAt: '',
      updatedAt: '',
      diagnostics: []
    },
    files: [
      { path: 'A.ts', hash: '', size: 10 },
      { path: 'B.ts', hash: '', size: 10 },
      { path: 'C.ts', hash: '', size: 10 },
      { path: 'D.ts', hash: '', size: 10 }
    ],
    modules: [],
    symbols: [],
    relations: [
      { from: 'A.ts', to: 'B.ts', type: 'imports' },
      { from: 'B.ts', to: 'C.ts', type: 'imports' },
      { from: 'C.ts', to: 'A.ts', type: 'imports' }, // Ciclo A -> B -> C -> A
      { from: 'C.ts', to: 'D.ts', type: 'imports' }
    ],
    apis: [],
    databases: [],
    tests: [],
    dependencies: [],
    architecture: { layers: [] },
    decisions: [],
    git: {
      indexedCommit: '',
      headCommit: '',
      changedFilesSinceLastIndex: [],
      indexTimestamp: '',
      isDirty: false
    }
  };

  const engine = new DeterministicGraphQueryEngine(mockModel);

  test('Debería cargar correctamente nodos y adyacencias', () => {
    const node = engine.getNode('A.ts');
    expect(node).not.toBeNull();
    expect(node!.type).toBe('file');
  });

  test('Debería resolver dependencias transitivas e iterativas', () => {
    const deps = engine.getDependencies('A.ts', { depth: 'all' });
    expect(deps).toContain('B.ts');
    expect(deps).toContain('C.ts');
    expect(deps).toContain('D.ts');
  });

  test('Debería respetar límites de profundidad (depth)', () => {
    const deps = engine.getDependencies('A.ts', { depth: 1 });
    expect(deps).toContain('B.ts');
    expect(deps).not.toContain('C.ts');
  });

  test('Debería detectar ciclos normalizados mediante Tarjan SCC', () => {
    const metrics = engine.calculateMetrics();
    expect(metrics.cycles.length).toBe(1);
    expect(metrics.cycles[0]).toContain('A.ts');
    expect(metrics.cycles[0]).toContain('B.ts');
    expect(metrics.cycles[0]).toContain('C.ts');
  });

  test('Debería calcular camino más corto (findPath)', () => {
    const path = engine.findPath('A.ts', 'D.ts');
    expect(path).not.toBeNull();
    expect(path!.nodes).toEqual(['A.ts', 'B.ts', 'C.ts', 'D.ts']);
  });
});
