import { TestImpactAnalyzer } from './test-impact-analyzer';
import { ProjectModel } from '../domain/project-model';

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
    { path: 'src/auth/auth.controller.ts', hash: 'h2', size: 120 },
    { path: 'src/user/user.repository.ts', hash: 'h3', size: 150 },
    { path: 'src/auth/auth.service.spec.ts', hash: 'h4', size: 90 },
    { path: 'src/auth/auth.controller.spec.ts', hash: 'h5', size: 95 },
    { path: 'src/integration.test.ts', hash: 'h6', size: 110 }
  ],
  modules: [],
  symbols: [],
  relations: [
    // El test de servicio importa directamente el servicio
    { from: 'src/auth/auth.service.spec.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
    // El controlador importa el servicio
    { from: 'src/auth/auth.controller.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
    // El test de controlador importa el controlador
    { from: 'src/auth/auth.controller.spec.ts', to: 'src/auth/auth.controller.ts', type: 'imports' },
    // El servicio importa el repositorio
    { from: 'src/auth/auth.service.ts', to: 'src/user/user.repository.ts', type: 'imports' },
    // El test de integración importa el controlador
    { from: 'src/integration.test.ts', to: 'src/auth/auth.controller.ts', type: 'imports' }
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

describe('TestImpactAnalyzer', () => {
  const analyzer = new TestImpactAnalyzer(mockProjectModel);

  test('1. Debería identificar test directo (distancia 1)', () => {
    const report = analyzer.analyze(['src/auth/auth.service.ts']);
    
    expect(report.recommended).toContain('src/auth/auth.service.spec.ts');
    const impact = report.affected.find(a => a.testFile === 'src/auth/auth.service.spec.ts');
    expect(impact).toBeDefined();
    expect(impact?.classification).toBe('DIRECT');
    expect(impact?.distance).toBe(1);
    expect(impact?.confidence).toBe(1.0);
  });

  test('2. Debería identificar test indirecto a través de una relación transitiva (distancia 2)', () => {
    const report = analyzer.analyze(['src/auth/auth.service.ts']);
    // auth.controller.spec.ts -> auth.controller.ts -> auth.service.ts (distancia 2)
    const impact = report.affected.find(a => a.testFile === 'src/auth/auth.controller.spec.ts');
    expect(impact).toBeDefined();
    expect(impact?.classification).toBe('INDIRECT');
    expect(impact?.distance).toBe(2);
    expect(impact?.confidence).toBe(0.75);
  });

  test('3. Debería identificar test indirecto a distancia 3', () => {
    const report = analyzer.analyze(['src/user/user.repository.ts']);
    // auth.controller.spec.ts -> auth.controller.ts -> auth.service.ts -> user.repository.ts (distancia 3)
    const impact = report.affected.find(a => a.testFile === 'src/auth/auth.controller.spec.ts');
    expect(impact).toBeDefined();
    expect(impact?.classification).toBe('INDIRECT');
    expect(impact?.distance).toBe(3);
    expect(impact?.confidence).toBe(0.50);
  });

  test('4. Debería revertir correctamente el path para que vaya desde el test hacia el target', () => {
    const report = analyzer.analyze(['src/auth/auth.service.ts']);
    const impact = report.affected.find(a => a.testFile === 'src/auth/auth.controller.spec.ts');
    
    // Path original BFS: ['src/auth/auth.service.ts', 'src/auth/auth.controller.ts', 'src/auth/auth.controller.spec.ts']
    // Path revertido: ['src/auth/auth.controller.spec.ts', 'src/auth/auth.controller.ts', 'src/auth/auth.service.ts']
    expect(impact?.path).toEqual([
      'src/auth/auth.controller.spec.ts',
      'src/auth/auth.controller.ts',
      'src/auth/auth.service.ts'
    ]);
  });

  test('5. Debería rellenar los tests recomendados de forma única', () => {
    const report = analyzer.analyze(['src/auth/auth.service.ts', 'src/auth/auth.controller.ts']);
    // Ambos afectan a integration.test.ts e indirectamente a otros, pero deben ser únicos
    const occurrences = report.recommended.filter(r => r === 'src/integration.test.ts');
    expect(occurrences.length).toBe(1);
  });

  test('6. Debería identificar targets sin test directo como missing', () => {
    const report = analyzer.analyze(['src/user/user.repository.ts']);
    // user.repository.ts no tiene test directo (su spec directo no existe)
    expect(report.missing).toContain('src/user/user.repository.ts');
  });

  test('7. No debería marcar un target como missing si tiene test directo', () => {
    const report = analyzer.analyze(['src/auth/auth.service.ts']);
    // auth.service.ts tiene a auth.service.spec.ts (distancia 1)
    expect(report.missing).not.toContain('src/auth/auth.service.ts');
  });

  test('8. No debería marcar un archivo de test como missing', () => {
    const report = analyzer.analyze(['src/auth/auth.service.spec.ts']);
    expect(report.missing).not.toContain('src/auth/auth.service.spec.ts');
  });

  test('9. Debería devolver un reporte vacío si no hay targets', () => {
    const report = analyzer.analyze([]);
    expect(report.affected).toEqual([]);
    expect(report.recommended).toEqual([]);
    expect(report.missing).toEqual([]);
  });

  test('10. Debería ordenar los tests recomendados determinísticamente', () => {
    const report = analyzer.analyze(['src/auth/auth.service.ts']);
    const isSorted = report.recommended.every((val, i, arr) => !i || arr[i - 1] <= val);
    expect(isSorted).toBe(true);
  });

  test('11. Debería ordenar la lista de missing determinísticamente', () => {
    const report = analyzer.analyze(['src/user/user.repository.ts', 'src/auth/auth.controller.ts']);
    const isSorted = report.missing.every((val, i, arr) => !i || arr[i - 1] <= val);
    expect(isSorted).toBe(true);
  });

  test('12. Debería ordenar affectedImpacts determinísticamente', () => {
    const report = analyzer.analyze(['src/auth/auth.service.ts', 'src/auth/auth.controller.ts']);
    const isSorted = report.affected.every((val, i, arr) => {
      if (!i) return true;
      const fileCompare = arr[i - 1].testFile.localeCompare(val.testFile);
      if (fileCompare !== 0) return fileCompare < 0;
      return arr[i - 1].target.localeCompare(val.target) <= 0;
    });
    expect(isSorted).toBe(true);
  });

  test('13. Debería asignar confianza 0.30 para distancia 4', () => {
    // Si tuviéramos distancia 4 en el grafo
    // Supongamos: test -> A -> B -> C -> Target
    const complexProjectModel: ProjectModel = {
      ...mockProjectModel,
      files: [
        ...mockProjectModel.files,
        { path: 'src/nodeA.ts', hash: 'a', size: 10 },
        { path: 'src/nodeB.ts', hash: 'b', size: 10 },
        { path: 'src/nodeC.ts', hash: 'c', size: 10 },
        { path: 'src/target.ts', hash: 't', size: 10 },
        { path: 'src/test.spec.ts', hash: 's', size: 10 }
      ],
      relations: [
        { from: 'src/test.spec.ts', to: 'src/nodeA.ts', type: 'imports' },
        { from: 'src/nodeA.ts', to: 'src/nodeB.ts', type: 'imports' },
        { from: 'src/nodeB.ts', to: 'src/nodeC.ts', type: 'imports' },
        { from: 'src/nodeC.ts', to: 'src/target.ts', type: 'imports' }
      ]
    };

    const tempAnalyzer = new TestImpactAnalyzer(complexProjectModel);
    const report = tempAnalyzer.analyze(['src/target.ts']);
    const impact = report.affected.find(a => a.testFile === 'src/test.spec.ts');
    expect(impact?.distance).toBe(4);
    expect(impact?.confidence).toBe(0.30);
  });

  test('14. Debería asignar confianza 0.15 para distancia mayor a 4', () => {
    // test -> A -> B -> C -> D -> Target (distancia 5)
    const complexProjectModel: ProjectModel = {
      ...mockProjectModel,
      files: [
        ...mockProjectModel.files,
        { path: 'src/nodeA.ts', hash: 'a', size: 10 },
        { path: 'src/nodeB.ts', hash: 'b', size: 10 },
        { path: 'src/nodeC.ts', hash: 'c', size: 10 },
        { path: 'src/nodeD.ts', hash: 'd', size: 10 },
        { path: 'src/target.ts', hash: 't', size: 10 },
        { path: 'src/test.spec.ts', hash: 's', size: 10 }
      ],
      relations: [
        { from: 'src/test.spec.ts', to: 'src/nodeA.ts', type: 'imports' },
        { from: 'src/nodeA.ts', to: 'src/nodeB.ts', type: 'imports' },
        { from: 'src/nodeB.ts', to: 'src/nodeC.ts', type: 'imports' },
        { from: 'src/nodeC.ts', to: 'src/nodeD.ts', type: 'imports' },
        { from: 'src/nodeD.ts', to: 'src/target.ts', type: 'imports' }
      ]
    };

    const tempAnalyzer = new TestImpactAnalyzer(complexProjectModel);
    const report = tempAnalyzer.analyze(['src/target.ts']);
    const impact = report.affected.find(a => a.testFile === 'src/test.spec.ts');
    expect(impact?.distance).toBe(5);
    expect(impact?.confidence).toBe(0.15);
  });

  test('15. Debería incluir explicaciones razonables para el reporte de impactos de pruebas', () => {
    const report = analyzer.analyze(['src/auth/auth.service.ts']);
    const directImpact = report.affected.find(a => a.classification === 'DIRECT');
    const indirectImpact = report.affected.find(a => a.classification === 'INDIRECT');
    expect(directImpact?.reason).toContain('importa directamente');
    expect(indirectImpact?.reason).toContain('indirectamente a través de la cadena');
  });
});
