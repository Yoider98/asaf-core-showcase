import { RiskEngine, RISK_CONSTANTS } from './risk-engine';
import { ProjectModel } from '../domain/project-model';
import { TestImpactReport } from './test-impact-analyzer';

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
    { path: 'src/auth/auth.service.ts', hash: 'h1', size: 100 },
    { path: 'src/auth/auth.controller.ts', hash: 'h2', size: 100 },
    { path: 'src/user/user.repository.ts', hash: 'h3', size: 100 },
    { path: 'src/db.ts', hash: 'h4', size: 100 },
    { path: 'src/api.ts', hash: 'h5', size: 100 }
  ],
  modules: [],
  symbols: [
    { id: 'symbol:AuthService', name: 'AuthService', type: 'class', filePath: 'src/auth/auth.service.ts', line: 1 }
  ],
  relations: [
    { from: 'src/auth/auth.controller.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
    { from: 'src/auth/auth.service.ts', to: 'src/user/user.repository.ts', type: 'imports' }
  ],
  apis: [
    { method: 'POST', path: '/login', handlerSymbol: 'symbol:AuthService' }
  ],
  databases: [
    { file: 'src/user/user.repository.ts', table: 'users', operation: 'insert' }
  ],
  tests: [],
  dependencies: [],
  architecture: { layers: [] },
  decisions: [
    { id: 'ADR-001', title: 'Autenticación', status: 'deprecated', file: 'docs/adr/001.md' }
  ],
  git: {
    indexedCommit: 'c1',
    headCommit: 'c1',
    changedFilesSinceLastIndex: [],
    indexTimestamp: new Date().toISOString(),
    isDirty: false
  }
};

describe('RiskEngine', () => {
  const defaultTestReport: TestImpactReport = {
    affected: [],
    recommended: [],
    missing: []
  };

  test('1. Debería retornar score base si no hay penalizaciones', async () => {
    const engine = new RiskEngine({
      ...mockProjectModel,
      apis: [],
      databases: [],
      relations: []
    });
    // Añadiremos un archivo de test en el reporte para evitar penalización de missing test
    const testReport: TestImpactReport = {
      affected: [{
        testFile: 'src/auth/auth.spec.ts',
        target: 'src/auth/auth.service.ts',
        classification: 'DIRECT',
        distance: 1,
        path: [],
        confidence: 1.0,
        reason: 'direct'
      }],
      recommended: [],
      missing: []
    };
    const report = await engine.analyze(['src/auth/auth.service.ts'], testReport);
    // score base = 20 - 10 (direct test bonus) = 10
    expect(report.score).toBe(10);
    expect(report.severity).toBe('LOW');
  });

  test('2. Debería aplicar penalización por Fan-in alto', async () => {
    const customModel: ProjectModel = {
      ...mockProjectModel,
      apis: [],
      databases: [],
      files: [
        ...mockProjectModel.files,
        { path: 'src/dep1.ts', hash: 'd1', size: 10 },
        { path: 'src/dep2.ts', hash: 'd2', size: 10 },
        { path: 'src/dep3.ts', hash: 'd3', size: 10 },
        { path: 'src/dep4.ts', hash: 'd4', size: 10 },
        { path: 'src/dep5.ts', hash: 'd5', size: 10 },
        { path: 'src/dep6.ts', hash: 'd6', size: 10 }
      ],
      relations: [
        { from: 'src/dep1.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
        { from: 'src/dep2.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
        { from: 'src/dep3.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
        { from: 'src/dep4.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
        { from: 'src/dep5.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
        { from: 'src/dep6.ts', to: 'src/auth/auth.service.ts', type: 'imports' }
      ]
    };
    const engine = new RiskEngine(customModel);
    const report = await engine.analyze(['src/auth/auth.service.ts'], defaultTestReport);
    
    // Base 20 + missing test 20 + fan-in 12 (6 dependents * 2) = 52
    expect(report.score).toBe(52);
    const fanInItem = report.items.find(i => i.category === 'FAN_IN');
    expect(fanInItem).toBeDefined();
    expect(fanInItem?.contribution).toBe(12);
  });

  test('3. Debería topar penalización de Fan-in a un máximo', async () => {
    const customRelations = Array.from({ length: 15 }, (_, i) => ({
      from: `src/dep${i}.ts`,
      to: 'src/auth/auth.service.ts',
      type: 'imports' as const
    }));
    const customModel: ProjectModel = {
      ...mockProjectModel,
      apis: [],
      databases: [],
      files: [
        ...mockProjectModel.files,
        ...Array.from({ length: 15 }, (_, i) => ({ path: `src/dep${i}.ts`, hash: 'h', size: 10 }))
      ],
      relations: customRelations
    };
    const engine = new RiskEngine(customModel);
    const report = await engine.analyze(['src/auth/auth.service.ts'], defaultTestReport);
    
    // Base 20 + missing test 20 + fan-in max 20 = 60
    expect(report.score).toBe(60);
    const fanInItem = report.items.find(i => i.category === 'FAN_IN');
    expect(fanInItem?.contribution).toBe(RISK_CONSTANTS.FAN_IN_MAX);
  });

  test('4. Debería aplicar penalización por Fan-out alto', async () => {
    const customRelations = Array.from({ length: 10 }, (_, i) => ({
      from: 'src/auth/auth.service.ts',
      to: `src/dep${i}.ts`,
      type: 'imports' as const
    }));
    const customModel: ProjectModel = {
      ...mockProjectModel,
      apis: [],
      databases: [],
      files: [
        ...mockProjectModel.files,
        ...Array.from({ length: 10 }, (_, i) => ({ path: `src/dep${i}.ts`, hash: 'h', size: 10 }))
      ],
      relations: customRelations
    };
    const engine = new RiskEngine(customModel);
    const report = await engine.analyze(['src/auth/auth.service.ts'], defaultTestReport);
    
    // Base 20 + missing test 20 + fan-out 10 (10 dependencies * 1) = 50
    expect(report.score).toBe(50);
  });

  test('5. Debería aplicar penalización por acceso a base de datos', async () => {
    const engine = new RiskEngine(mockProjectModel);
    const report = await engine.analyze(['src/user/user.repository.ts'], defaultTestReport);
    // Base 20 + missing test 20 + database 15 = 55
    expect(report.score).toBe(55);
    const dbItem = report.items.find(i => i.category === 'DATABASE');
    expect(dbItem).toBeDefined();
    expect(dbItem?.contribution).toBe(RISK_CONSTANTS.DATABASE_PENALTY);
  });

  test('6. Debería aplicar penalización por API expuesta', async () => {
    const engine = new RiskEngine(mockProjectModel);
    const report = await engine.analyze(['src/auth/auth.service.ts'], defaultTestReport);
    // Base 20 + missing test 20 + api 15 = 55
    expect(report.score).toBe(55);
  });

  test('7. Debería aplicar penalización por violación de gobernanza de arquitectura', async () => {
    // Simularemos una violación de gobernanza de acuerdo con las reglas por defecto
    const customModel: ProjectModel = {
      ...mockProjectModel,
      apis: [],
      databases: [],
      files: [
        ...mockProjectModel.files,
        { path: 'core/domain/entity.ts', hash: 'e1', size: 10 },
        { path: 'cli/index.ts', hash: 'i1', size: 10 }
      ],
      relations: [
        // Domain no puede importar de cli (regla por defecto)
         {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
      ]
    };
    
    const engine = new RiskEngine(customModel);
    const report = await engine.analyze(['core/domain/entity.ts'], defaultTestReport);
    // Debe incluir la penalización de gobernanza
    const govItem = report.items.find(i => i.category === 'GOVERNANCE');
    expect(govItem).toBeDefined();
  });

  test('8. Debería aplicar penalización por test faltante si no hay cobertura directa', async () => {
    const engine = new RiskEngine({ ...mockProjectModel, apis: [], databases: [] });
    const report = await engine.analyze(['src/auth/auth.service.ts'], defaultTestReport);
    const missingTestItem = report.items.find(i => i.category === 'MISSING_TEST' && i.contribution === RISK_CONSTANTS.MISSING_TEST_PENALTY);
    expect(missingTestItem).toBeDefined();
  });

  test('9. Debería restar bonificación por test directo', async () => {
    const testReport: TestImpactReport = {
      affected: [{
        testFile: 'src/auth/auth.service.spec.ts',
        target: 'src/auth/auth.service.ts',
        classification: 'DIRECT',
        distance: 1,
        path: [],
        confidence: 1.0,
        reason: 'direct'
      }],
      recommended: [],
      missing: []
    };
    const engine = new RiskEngine({ ...mockProjectModel, apis: [], databases: [] });
    const report = await engine.analyze(['src/auth/auth.service.ts'], testReport);
    // Base 20 - 10 (direct test bonus) = 10
    expect(report.score).toBe(10);
    const bonusItem = report.items.find(i => i.category === 'MISSING_TEST' && i.contribution === -RISK_CONSTANTS.DIRECT_TEST_BONUS);
    expect(bonusItem).toBeDefined();
  });

  test('10. Debería aplicar penalización por conflicto de ADR', async () => {
    const customModel: ProjectModel = {
      ...mockProjectModel,
      apis: [],
      databases: [],
      relations: [
        { from: 'src/auth/auth.service.ts', to: 'adr:ADR-001', type: 'governed-by' }
      ]
    };
    const engine = new RiskEngine(customModel);
    const report = await engine.analyze(['src/auth/auth.service.ts'], defaultTestReport);
    // ADR-001 está 'deprecated', por lo que debe penalizarse
    const adrItem = report.items.find(i => i.category === 'ADR_CONFLICT');
    expect(adrItem).toBeDefined();
    expect(adrItem?.contribution).toBe(RISK_CONSTANTS.ADR_CONFLICT_PENALTY);
  });

  test('11. Debería retornar severidad LOW para score < 30', async () => {
    const engine = new RiskEngine({ ...mockProjectModel, apis: [], databases: [], relations: [] });
    const testReport: TestImpactReport = {
      affected: [{
        testFile: 'src/spec.ts',
        target: 'src/auth/auth.service.ts',
        classification: 'DIRECT',
        distance: 1,
        path: [],
        confidence: 1.0,
        reason: 'direct'
      }],
      recommended: [],
      missing: []
    };
    const report = await engine.analyze(['src/auth/auth.service.ts'], testReport);
    expect(report.score).toBeLessThan(30);
    expect(report.severity).toBe('LOW');
  });

  test('12. Debería retornar severidad MEDIUM para score >= 30 y < 60', async () => {
    const engine = new RiskEngine({ ...mockProjectModel, apis: [], databases: [], relations: [] });
    const report = await engine.analyze(['src/auth/auth.service.ts'], defaultTestReport);
    // Base 20 + missing test 20 = 40
    expect(report.score).toBe(40);
    expect(report.severity).toBe('MEDIUM');
  });

  test('13. Debería retornar severidad HIGH para score >= 60 y < 80', async () => {
    const engine = new RiskEngine(mockProjectModel);
    const report = await engine.analyze(['src/auth/auth.service.ts'], defaultTestReport);
    // Base 20 + missing test 20 + api 15 + database 15 (de user.repository en cascada? no, es por target. auth.service tiene api 15. Total 55)
    // Agreguemos otro target para subir el score
    const reportMultiple = await engine.analyze(['src/auth/auth.service.ts', 'src/user/user.repository.ts'], defaultTestReport);
    // Base 20 + missing 20 (auth) + api 15 (auth) + missing 20 (user) + database 15 (user) = 90 (CRITICAL)
    // Si queremos exactamente HIGH (ej. 70): base 20 + missing 20 + api 15 + database 15 = 70
    const customModel: ProjectModel =  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }] // añade +15
    };
    const tempEngine = new RiskEngine(customModel);
    const reportHigh = await tempEngine.analyze(['src/auth/auth.service.ts'], defaultTestReport);
    // Base 20 + missing 20 + api 15 + db 15 = 70
    expect(reportHigh.score).toBe(70);
    expect(reportHigh.severity).toBe('HIGH');
  });

  test('14. Debería retornar severidad CRITICAL para score >= 80', async () => {
    const engine = new RiskEngine(mockProjectModel);
    const report = await engine.analyze(['src/auth/auth.service.ts', 'src/user/user.repository.ts'], defaultTestReport);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.severity).toBe('CRITICAL');
  });

  test('15. Debería clasificar el origen como PROJECTED para targets primarios', async () => {
    const engine = new RiskEngine({ ...mockProjectModel, apis: [], databases: [] });
    const report = await engine.analyze(['src/auth/auth.service.ts'], defaultTestReport, ['src/auth/auth.service.ts']);
    expect(report.items[0].origin).toBe('PROJECTED');
  });

  test('16. Debería clasificar el origen como EXISTING para dependencias secundarias en targets', async () => {
    const engine = new RiskEngine({ ...mockProjectModel, apis: [], databases: [] });
    // auth.service.ts es secundario (no listado en primaryTargets)
    const report = await engine.analyze(['src/auth/auth.service.ts'], defaultTestReport, ['src/auth/auth.controller.ts']);
    expect(report.items[0].origin).toBe('EXISTING');
  });

  test('17. Debería acotar el score a un máximo de 100', async () => {
    // Forzar acumulados gigantescos
    const customRelations = Array.from({ length: 20 }, (_, i) => ({
      from: `src/dep${i}.ts`,
      to: 'src/auth/auth.service.ts',
      type: 'imports' as const
    }));
    const customModel: ProjectModel = {
      ...mockProjectModel,
      files: [
        ...mockProjectModel.files,
        ...Array.from({ length: 20 }, (_, i) => ({ path: `src/dep${i}.ts`, hash: 'h', size: 10 }))
      ],
      relations: [
        ...customRelations,
        { from: 'src/auth/auth.service.ts', to: 'adr:ADR-001', type: 'governed-by' }
      ]
    };
    const engine = new RiskEngine(customModel);
    const report = await engine.analyze(['src/auth/auth.service.ts'], defaultTestReport);
    expect(report.score).toBe(100);
  });

  test('18. Debería acotar el score a un mínimo de 0', async () => {
    // Si tuviéramos un sistema que resta mucho score, nunca debe ser menor que 0
    const engine = new RiskEngine({ ...mockProjectModel, apis: [], databases: [], relations: [] });
    // Aunque no hay forma directa de hacerlo menor que 0 con bonos de -10 sobre base 20,
    // garantizamos que la lógica interna de acotación funcione
    const report = await engine.analyze([], defaultTestReport);
    expect(report.score).toBeGreaterThanOrEqual(0);
  });

  test('19. Debería incluir evidencias correctas en las penalizaciones de base de datos', async () => {
    const engine = new RiskEngine(mockProjectModel);
    const report = await engine.analyze(['src/user/user.repository.ts'], defaultTestReport);
    const dbItem = report.items.find(i => i.category === 'DATABASE')!;
    expect(dbItem.evidence[0].type).toBe('graph_relation');
    expect(dbItem.evidence[0].targetNode).toBe('db:users');
  });

  test('20. Debería ordenar los RiskItems determinísticamente', async () => {
    const engine = new RiskEngine(mockProjectModel);
    const report = await engine.analyze(['src/auth/auth.service.ts', 'src/user/user.repository.ts'], defaultTestReport);
    const isSorted = report.items.every((val, i, arr) => {
      if (!i) return true;
      const catCompare = arr[i - 1].category.localeCompare(val.category);
      if (catCompare !== 0) return catCompare <= 0;
      return arr[i - 1].id.localeCompare(val.id) <= 0;
    });
    expect(isSorted).toBe(true);
  });
});
