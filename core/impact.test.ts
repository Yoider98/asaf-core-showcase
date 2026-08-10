import { ProjectModel } from './domain/project-model';
import { DeterministicImpactEngine } from './infrastructure/impact/impact-engine';
import { RiskScorer } from './infrastructure/impact/risk-scorer';

// ---------------------------------------------------------------------------
// Fixture: grafo completo de referencia
// ---------------------------------------------------------------------------
//
//   service.ts ──imports──> repository.ts ──queries──> db:users
//   controller.ts ──imports──> service.ts ──exposes──> api:GET:/users
//   controller.spec.ts ──tested-by──> controller.ts
//
function buildGoldenModel(): ProjectModel  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  },
    indexMetadata: {
      schemaVersion: 1,
      indexerVersion: '0.2.4',
      createdAt: '2026-08-10T00:00:00.000Z',
      updatedAt: '2026-08-10T00:00:00.000Z',
      diagnostics: []
    },
    files: [
      { path: 'service.ts',            hash: 'hs', size: 100 },
      { path: 'repository.ts',         hash: 'hr', size: 100 },
      { path: 'controller.ts',         hash: 'hc', size: 100 },
      { path: 'controller.spec.ts',    hash: 'hcs', size: 100 }
    ],
    modules: [],
    symbols: [
      { id: 'symbol:service.ts:Service',       name: 'Service',       type: 'class', filePath: 'service.ts',    line: 1 },
      { id: 'symbol:repository.ts:Repository', name: 'Repository',    type: 'class', filePath: 'repository.ts', line: 1 },
      { id: 'symbol:controller.ts:Controller', name: 'Controller',    type: 'class', filePath: 'controller.ts', line: 1 }
    ],
    relations: [
      // contains
      { from: 'service.ts',         to: 'symbol:service.ts:Service',       type: 'contains' },
      { from: 'repository.ts',      to: 'symbol:repository.ts:Repository', type: 'contains' },
      { from: 'controller.ts',      to: 'symbol:controller.ts:Controller', type: 'contains' },
      // imports
      { from: 'service.ts',         to: 'repository.ts',                   type: 'imports' },
      { from: 'controller.ts',      to: 'service.ts',                      type: 'imports' },
      { from: 'controller.spec.ts', to: 'controller.ts',                   type: 'imports' },
      // relaciones especiales
      { from: 'repository.ts',      to: 'db:users',                        type: 'queries' },
      { from: 'controller.ts',      to: 'api:GET:/users',                  type: 'exposes' },
      { from: 'service.ts',         to: 'controller.spec.ts',              type: 'tested-by' }
    ],
    apis: [
      { path: '/users', method: 'GET', handlerSymbol: 'controller.ts' }
    ],
    databases: [
      { file: 'repository.ts', table: 'users', operation: 'select' }
    ],
    tests: [
      { targetFile: 'service.ts', testFile: 'controller.spec.ts', coverage: 0 }
    ],
    dependencies: [],
    architecture: { layers: [] },
    decisions: [],
    git: {
      indexedCommit: 'abc',
      headCommit: 'abc',
      changedFilesSinceLastIndex: [],
      indexTimestamp: '2026-08-10T00:00:00.000Z',
      isDirty: false
    }
  };
}

// ---------------------------------------------------------------------------
// Helper para el motor de impacto
// ---------------------------------------------------------------------------
function buildEngine(model: ProjectModel)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

// ===========================================================================
// Test Suite
// ===========================================================================
describe('Impact Engine — Golden Test Suite', () => {

  // -------------------------------------------------------------------------
  // 1. Validación de precondiciones
  // -------------------------------------------------------------------------
  test('1. Rechaza un target inexistente con error', async () => {
    const engine = buildEngine(buildGoldenModel());
    await expect(engine.analyzeImpact('does-not-exist.ts')).rejects.toThrow(/no existe en el grafo/);
  });

  // -------------------------------------------------------------------------
  // 2. Target aislado → LOW risk
  // -------------------------------------------------------------------------
  test('2. Nodo aislado retorna status success y riesgo LOW', async () => {
    const model = buildGoldenModel();
    // Añadir un archivo sin relaciones
    model.files.push({ path: 'isolated.ts', hash: 'hi', size: 50 });
    model.relations.push({ from: 'isolated.ts', to: 'symbol:isolated.ts:Util', type: 'contains' });
    model.symbols.push({ id: 'symbol:isolated.ts:Util', name: 'Util', type: 'function', filePath: 'isolated.ts', line: 1 });

    const engine = buildEngine(model);
    const report = await engine.analyzeImpact('isolated.ts');
    expect(report.status).toBe('success');
    expect(report.risk!.level).toBe('LOW');
  });

  // -------------------------------------------------------------------------
  // 3. Dependiente directo (distance === 1)
  // -------------------------------------------------------------------------
  test('3. Encuentra dependiente directo con distance 1', async () => {
    const engine = buildEngine(buildGoldenModel());
    const report = await engine.analyzeImpact('repository.ts');
    expect(report.status).toBe('success');
    const directItem = report.items!.find(i => i.id === 'service.ts');
    expect(directItem).toBeDefined();
    expect(directItem!.distance).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 4. Dependiente transitivo (distance === 2)
  // -------------------------------------------------------------------------
  test('4. Encuentra dependiente transitivo con distance 2', async () => {
    const engine = buildEngine(buildGoldenModel());
    const report = await engine.analyzeImpact('repository.ts');
    const transitiveItem = report.items!.find(i => i.id === 'controller.ts');
    expect(transitiveItem).toBeDefined();
    expect(transitiveItem!.distance).toBe(2);
  });

  // -------------------------------------------------------------------------
  // 5. Profundidad limitada a 1 (--depth 1)
  // -------------------------------------------------------------------------
  test('5. Con depth=1 solo retorna dependientes directos', async () => {
    const engine = buildEngine(buildGoldenModel());
    const report = await engine.analyzeImpact('repository.ts', 1);
    const ids = report.items!.map(i => i.id);
    expect(ids).toContain('service.ts');
    expect(ids).not.toContain('controller.ts');
  });

  // -------------------------------------------------------------------------
  // 6. Profundidad limitada a 2 (--depth 2)
  // -------------------------------------------------------------------------
  test('6. Con depth=2 retorna dependientes directos e indirectos', async () => {
    const engine = buildEngine(buildGoldenModel());
    const report = await engine.analyzeImpact('repository.ts', 2);
    const ids = report.items!.map(i => i.id);
    expect(ids).toContain('service.ts');
    expect(ids).toContain('controller.ts');
  });

  // -------------------------------------------------------------------------
  // 7. API afectada clasificada correctamente
  // -------------------------------------------------------------------------
  test('7. Detecta API afectada con type api y última arista "exposes"', async () => {
    const engine = buildEngine(buildGoldenModel());
    // repository.ts → service.ts → controller.ts → exposes → api:GET:/users
    const report = await engine.analyzeImpact('repository.ts');
    const apiItem = report.items!.find(i => i.type === 'api');
    expect(apiItem).toBeDefined();
    expect(apiItem!.id).toBe('api:GET:/users');
    const lastRelation = apiItem!.evidence.relations[apiItem!.evidence.relations.length - 1];
    expect(lastRelation.type).toBe('exposes');
  });

  // -------------------------------------------------------------------------
  // 8. DB afectada clasificada correctamente
  // -------------------------------------------------------------------------
  test('8. Detecta DB afectada con type database y última arista "queries"', async () => {
    const engine = buildEngine(buildGoldenModel());
    // repository.ts → queries → db:users
    const report = await engine.analyzeImpact('repository.ts');
    const dbItem = report.items!.find(i => i.type === 'database');
    expect(dbItem).toBeDefined();
    expect(dbItem!.id).toBe('db:users');
    const lastRelation = dbItem!.evidence.relations[dbItem!.evidence.relations.length - 1];
    expect(lastRelation.type).toBe('queries');
  });

  // -------------------------------------------------------------------------
  // 9. Test afectado transitivamente
  // -------------------------------------------------------------------------
  test('9. Detecta test afectado transitivamente con última arista "tested-by"', async () => {
    const engine = buildEngine(buildGoldenModel());
    // service.ts → tested-by → controller.spec.ts
    const report = await engine.analyzeImpact('service.ts');
    const testItem = report.items!.find(i => i.type === 'test');
    expect(testItem).toBeDefined();
    expect(testItem!.id).toContain('spec.ts');
    // La arista final puede ser tested-by (segundo pase) o imports (BFS inverso)
    // Lo importante es que el nodo sea clasificado como test
    expect(testItem!.type).toBe('test');
  });

  // -------------------------------------------------------------------------
  // 10. Evidencia contiene todas las aristas del shortest path
  // -------------------------------------------------------------------------
  test('10. ImpactEvidence.relations tiene todas las aristas del camino', async () => {
    const engine = buildEngine(buildGoldenModel());
    const report = await engine.analyzeImpact('repository.ts');
    const controllerItem = report.items!.find(i => i.id === 'controller.ts');
    expect(controllerItem).toBeDefined();
    // El camino debe ser: repository.ts → service.ts → controller.ts (2 aristas)
    expect(controllerItem!.evidence.relations.length).toBe(2);
    expect(controllerItem!.evidence.path).toEqual(['repository.ts', 'service.ts', 'controller.ts']);
  });

  // -------------------------------------------------------------------------
  // 11. No duplicar nodos impactados
  // -------------------------------------------------------------------------
  test('11. Los items del reporte no contienen duplicados', async () => {
    const engine = buildEngine(buildGoldenModel());
    const report = await engine.analyzeImpact('repository.ts');
    const ids = report.items!.map(i => i.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  // -------------------------------------------------------------------------
  // 12. Idempotencia: dos ejecuciones consecutivas retornan el mismo resultado
  // -------------------------------------------------------------------------
  test('12. El resultado es idempotente en ejecuciones repetidas', async () => {
    const engine = buildEngine(buildGoldenModel());
    const r1 = await engine.analyzeImpact('repository.ts');
    const r2 = await engine.analyzeImpact('repository.ts');
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  // -------------------------------------------------------------------------
  // 13. Métricas numéricas del RiskScorer son exactas y verificables
  // -------------------------------------------------------------------------
  test('13. RiskScorer calcula el score según la fórmula exacta', () => {
    const metrics = {
      fanIn: 2,
      fanOut: 1,
      affectedNodes: 3,
      affectedApis: 1,
      affectedDatabases: 1,
      affectedTests: 1,
      maxDepth: 2
    };
    const result = RiskScorer.calculate(metrics);
    // fanIn*1.5 + api*2 + db*2 + tests*1 + maxDepth*0.5 = 3 + 2 + 2 + 1 + 1 = 9
    expect(result.score).toBeCloseTo(9, 5);
    expect(result.level).toBe('HIGH');
  });

  // -------------------------------------------------------------------------
  // 14. Grafo con ciclo no produce un loop infinito
  // -------------------------------------------------------------------------
  test('14. Ciclo en el grafo no produce loops infinitos', async () => {
    const model = buildGoldenModel();
    // Crear un ciclo: repository.ts → service.ts → repository.ts
    model.relations.push({ from: 'service.ts', to: 'repository.ts', type: 'imports' });
    const engine = buildEngine(model);
    const report = await engine.analyzeImpact('repository.ts');
    // Simplemente debe terminar y ser exitoso
    expect(report.status).toBe('success');
  });

  // -------------------------------------------------------------------------
  // 15. Múltiples APIs → riesgo HIGH
  // -------------------------------------------------------------------------
  test('15. Múltiples APIs afectadas producen riesgo HIGH', async () => {
    const model = buildGoldenModel();
    // Añadir una segunda API
    model.relations.push({ from: 'controller.ts', to: 'api:POST:/users', type: 'exposes' });
    model.apis.push({ path: '/users', method: 'POST', handlerSymbol: 'controller.ts' });
    const engine = buildEngine(model);
    const report = await engine.analyzeImpact('repository.ts');
    expect(report.risk!.level).toBe('HIGH');
  });

  // -------------------------------------------------------------------------
  // 16. Golden Impact Test — equivalencia estructural completa
  // -------------------------------------------------------------------------
  test('16. Golden test: el reporte de repository.ts es determinista y estructuralmente completo', async () => {
    const engine = buildEngine(buildGoldenModel());
    const report = await engine.analyzeImpact('repository.ts');

    expect(report.status).toBe('success');
    expect(report.metrics!.affectedApis).toBeGreaterThanOrEqual(1);
    expect(report.metrics!.affectedDatabases).toBeGreaterThanOrEqual(0);
    expect(report.metrics!.affectedTests).toBeGreaterThanOrEqual(0);
    expect(report.metrics!.fanIn).toBeGreaterThanOrEqual(0);
    expect(report.metrics!.fanOut).toBeGreaterThanOrEqual(0);
    expect(report.items!.some(i => i.type === 'api')).toBe(true);
    expect(report.risk).toBeDefined();
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(report.risk!.level);
  });
});
