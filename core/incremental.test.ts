import { ProjectModel } from './domain/project-model';
import { DeterministicProjectIndexer } from './infrastructure/indexing/project-indexer';
import { FileChange } from './domain/indexer';

function normalizeProjectModel(model: ProjectModel): any  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }-${a.to}`.localeCompare(`${b.from}-${b.to}`)),
    dependencies: [...model.dependencies].sort((a, b) => a.name.localeCompare(b.name))
  };
}

describe('Incremental Indexing Golden Test Suite', () => {
  const baseModel: ProjectModel = {
    project: { name: 'TestProject', version: '0.1.0', path: '' },
    indexMetadata: {
      schemaVersion: 1,
      indexerVersion: '0.2.3',
      createdAt: '2026-08-09T00:00:00.000Z',
      updatedAt: '2026-08-09T00:00:00.000Z',
      diagnostics: []
    },
    files: [
      { path: 'A.ts', hash: 'hashA', size: 100 },
      { path: 'B.ts', hash: 'hashB', size: 150 }
    ],
    modules: [],
    symbols: [
      { id: 'symbol:A.ts:ClassA', name: 'ClassA', type: 'class', filePath: 'A.ts', line: 5 },
      { id: 'symbol:B.ts:ClassB', name: 'ClassB', type: 'class', filePath: 'B.ts', line: 10 }
    ],
    relations: [
      { from: 'A.ts', to: 'symbol:A.ts:ClassA', type: 'contains' },
      { from: 'B.ts', to: 'symbol:B.ts:ClassB', type: 'contains' },
      { from: 'A.ts', to: 'B.ts', type: 'imports' }
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
      indexTimestamp: '2026-08-09T00:00:00.000Z',
      isDirty: false
    }
  };

  const indexer = new DeterministicProjectIndexer('');

  test('Debería manejar correctamente la eliminación de un archivo y purgar sus relaciones bidireccionales', async () => {
    const model = JSON.parse(JSON.stringify(baseModel));
    const changes: FileChange[] = [{ type: 'deleted', path: 'B.ts' }];

    const result = await indexer.update(model, changes);

    expect(result.files.some(f => f.path === 'B.ts')).toBe(false);
    expect(result.symbols.some(s => s.filePath === 'B.ts')).toBe(false);
    // Debe haber eliminado tanto B.ts -> ClassB como A.ts -> B.ts (relación entrante obsoleta)
    expect(result.relations.some(r => r.from === 'B.ts' || r.to === 'B.ts')).toBe(false);
    expect(result.relations.some(r => r.to === 'symbol:B.ts:ClassB')).toBe(false);
  });

  test('Debería ser idempotente al ejecutar actualizaciones repetidas', async () => {
    const model1 = JSON.parse(JSON.stringify(baseModel));
    const changes: FileChange[] = [{ type: 'modified', path: 'A.ts' }];

    const result1 = await indexer.update(model1, [{ type: 'deleted', path: 'A.ts' }]);
    const result2 = await indexer.update(result1, []);

    const norm1 = normalizeProjectModel(result1);
    const norm2 = normalizeProjectModel(result2);

    expect(norm1).toEqual(norm2);
  });
});
