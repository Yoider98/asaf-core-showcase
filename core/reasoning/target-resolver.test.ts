import { TargetResolver } from './target-resolver';
import { ProjectModel } from '../domain/project-model';
import { TaskIntent } from './types';

const mockProjectModel: ProjectModel = {
  project: {
    name: 'test-project',
    version: '1.0.0',
    path: 'D:/GitHub/ASAF'
  },
  indexMetadata: {
    schemaVersion: 1,
    indexerVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    diagnostics: []
  },
  files: [
    { path: 'src/auth/auth.controller.ts', hash: 'h1', size: 100 },
    { path: 'src/auth/auth.service.ts', hash: 'h2', size: 150 },
    { path: 'src/user/user.repository.ts', hash: 'h3', size: 200 },
    { path: 'src/auth/auth.spec.ts', hash: 'h4', size: 80 }
  ],
  modules: [],
  symbols: [
    { id: 'symbol:AuthController', name: 'AuthController', type: 'class', filePath: 'src/auth/auth.controller.ts', line: 5 },
    { id: 'symbol:AuthService', name: 'AuthService', type: 'class', filePath: 'src/auth/auth.service.ts', line: 8 },
    { id: 'symbol:login', name: 'login', type: 'function', filePath: 'src/auth/auth.service.ts', line: 12 }
  ],
  relations: [
    { from: 'src/auth/auth.controller.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
    { from: 'src/auth/auth.service.ts', to: 'src/user/user.repository.ts', type: 'imports' },
    { from: 'src/auth/auth.spec.ts', to: 'src/auth/auth.service.ts', type: 'imports' }
  ],
  apis: [],
  databases: [],
  tests: [],
  dependencies: [],
  architecture: { layers: [] },
  decisions: [],
  git: {
    indexedCommit: 'c1',
    headCommit: 'c1',
    changedFilesSinceLastIndex: [],
    indexTimestamp: new Date().toISOString(),
    isDirty: false
  }
};

describe('TargetResolver', () => {
  const resolver = new TargetResolver(mockProjectModel);

  const mockIntent: TaskIntent = {
    task: 'Agregar login seguro',
    action: 'CREATE',
    concepts: ['login', 'seguro'],
    technicalAreas: ['auth'],
    probableArtifacts: ['auth.service', 'auth.controller'],
    confidence: 0.8
  };

  test('1. Debería resolver targets explícitos si se proporcionan', () => {
    const result = resolver.resolve(mockIntent, {
      explicitFiles: ['src/auth/auth.controller.ts']
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('src/auth/auth.controller.ts');
    expect(result[0].source).toBe('explicit');
    expect(result[0].confidence).toBe(1.0);
    expect(result[0].confidenceSource).toBe('structural');
  });

  test('2. No debería resolver archivos explícitos si no existen en el modelo', () => {
    const result = resolver.resolve(mockIntent, {
      explicitFiles: ['src/non-existent.ts']
    });
    expect(result.length).toBe(0);
  });

  test('3. Debería normalizar backslashes en rutas explícitas', () => {
    const result = resolver.resolve(mockIntent, {
      explicitFiles: ['src\\auth\\auth.controller.ts']
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('src/auth/auth.controller.ts');
  });

  test('4. Debería resolver targets Git si no hay explícitos', () => {
    const result = resolver.resolve(mockIntent, {
      gitChanges: ['src/auth/auth.service.ts']
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('src/auth/auth.service.ts');
    expect(result[0].source).toBe('git');
    expect(result[0].confidenceSource).toBe('git');
  });

  test('5. Debería ignorar cambios Git si se proporcionan explícitos', () => {
    const result = resolver.resolve(mockIntent, {
      explicitFiles: ['src/auth/auth.controller.ts'],
      gitChanges: ['src/auth/auth.service.ts']
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('src/auth/auth.controller.ts');
    expect(result[0].source).toBe('explicit');
  });

  test('6. Debería resolver semánticamente por archivos si no hay explícitos ni Git', () => {
    const result = resolver.resolve(mockIntent);
    // Debe emparejar con auth.controller.ts y auth.service.ts basados en probableArtifacts
    const ids = result.map(r => r.id);
    expect(ids).toContain('src/auth/auth.controller.ts');
    expect(ids).toContain('src/auth/auth.service.ts');
    expect(result[0].source).toBe('semantic');
    expect(result[0].confidenceSource).toBe('semantic');
  });

  test('7. Debería emparejar por símbolos en coincidencia semántica', () => {
    const intentSymbol: TaskIntent = {
      task: 'Llamar a login',
      action: 'UPDATE',
      concepts: ['login'],
      technicalAreas: ['auth'],
      probableArtifacts: ['login'],
      confidence: 0.7
    };
    const result = resolver.resolve(intentSymbol);
    const ids = result.map(r => r.id);
    expect(ids).toContain('symbol:login');
  });

  test('8. Debería asignar alta confianza (0.9) a coincidencia exacta de nombre de archivo', () => {
    const result = resolver.resolve(mockIntent);
    const serviceTarget = result.find(r => r.id === 'src/auth/auth.service.ts');
    expect(serviceTarget?.confidence).toBe(0.9);
  });

  test('9. Debería expandir el grafo con dependencias de distancia 1 si se indica', () => {
    const result = resolver.resolve(mockIntent, {
      explicitFiles: ['src/auth/auth.controller.ts'],
      expandGraph: true
    });
    // auth.controller.ts importa auth.service.ts, por lo que expande a auth.service.ts
    const ids = result.map(r => r.id);
    expect(ids).toContain('src/auth/auth.controller.ts');
    expect(ids).toContain('src/auth/auth.service.ts');

    const serviceTarget = result.find(r => r.id === 'src/auth/auth.service.ts');
    expect(serviceTarget?.source).toBe('graph');
    expect(serviceTarget?.confidenceSource).toBe('structural');
    expect(serviceTarget?.evidence?.[0].type).toBe('graph_relation');
    expect(serviceTarget?.evidence?.[0].relation).toBe('IMPORTS');
  });

  test('10. Debería expandir el grafo con dependientes directos de distancia 1', () => {
    const result = resolver.resolve(mockIntent, {
      explicitFiles: ['src/auth/auth.service.ts'],
      expandGraph: true
    });
    // auth.controller.ts y auth.spec.ts importan auth.service.ts
    const ids = result.map(r => r.id);
    expect(ids).toContain('src/auth/auth.controller.ts');
    expect(ids).toContain('src/auth/auth.spec.ts');
  });

  test('11. No debería duplicar targets que ya existen en el mapa al expandir', () => {
    const result = resolver.resolve(mockIntent, {
      explicitFiles: ['src/auth/auth.controller.ts', 'src/auth/auth.service.ts'],
      expandGraph: true
    });
    const controller = result.filter(r => r.id === 'src/auth/auth.controller.ts');
    const service = result.filter(r => r.id === 'src/auth/auth.service.ts');
    expect(controller.length).toBe(1);
    expect(service.length).toBe(1);
    expect(controller[0].source).toBe('explicit');
    expect(service[0].source).toBe('explicit');
  });

  test('12. Debería resolver semánticamente a un subconjunto correcto de términos de conceptos', () => {
    const intentCustom: TaskIntent = {
      task: 'Gestionar repositorio de usuarios',
      action: 'UPDATE',
      concepts: ['user', 'repository'],
      technicalAreas: ['database'],
      probableArtifacts: ['user.repository'],
      confidence: 0.8
    };
    const result = resolver.resolve(intentCustom);
    const ids = result.map(r => r.id);
    expect(ids).toContain('src/user/user.repository.ts');
  });

  test('13. Debería inyectar las evidencias correctas en los targets resueltos', () => {
    const result = resolver.resolve(mockIntent, {
      explicitFiles: ['src/auth/auth.controller.ts']
    });
    expect(result[0].evidence?.[0].description).toContain('especificado explícitamente');
  });

  test('14. Debería ignorar la resolución semántica si hay cambios Git válidos', () => {
    const result = resolver.resolve(mockIntent, {
      gitChanges: ['src/user/user.repository.ts']
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('src/user/user.repository.ts');
    expect(result[0].source).toBe('git');
  });

  test('15. Debería mantener la inalterabilidad de la confianza de un target si se detecta múltiples veces', () => {
    const intentDuplicate: TaskIntent = {
      task: 'Repetido',
      action: 'UPDATE',
      concepts: ['auth', 'auth'],
      technicalAreas: ['auth'],
      probableArtifacts: ['auth.service', 'auth.service'],
      confidence: 0.6
    };
    const result = resolver.resolve(intentDuplicate);
    const serviceTargets = result.filter(r => r.id === 'src/auth/auth.service.ts');
    expect(serviceTargets.length).toBe(1);
  });
});
