import { CodeSlicer } from './context/code-slicer';
import { TokenEstimator } from './context/token-estimator';
import { ContextRanker } from './context/context-ranker';
import { ContextBudget } from './context/context-budget';
import { UnifiedContextEngine } from './context/context-engine';
import { ProjectModel } from './domain/project-model';
import * as fs from 'fs';
import * as path from 'path';

describe('Context Intelligence — Invariant & Regression Suite', () => {

  // ===========================================================================
  // 1. TokenEstimator (4 tests)
  // ===========================================================================
  describe('1. TokenEstimator', () => {
    test('1. Estimación básica de texto (4 caracteres por token)', () => {
      expect(TokenEstimator.estimate('1234')).toBe(1);
      expect(TokenEstimator.estimate('12345')).toBe(2);
    });

    test('2. Estimación de texto vacío retorna 0', () => {
      expect(TokenEstimator.estimate('')).toBe(0);
    });

    test('3. Estimación de archivo inexistente retorna 0', () => {
      expect(TokenEstimator.estimateFile('non-existent.ts', '/')).toBe(0);
    });

    test('4. Estimación de archivo real', () => {
      const mockFs = require('fs');
      const spyExist = jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      const spyRead = jest.spyOn(mockFs, 'readFileSync').mockReturnValue('class A {}');

      const tokens = TokenEstimator.estimateFile('a.ts', '/');
      expect(tokens).toBe(3); // 10 caracteres / 4 = 2.5 -> 3

      spyExist.mockRestore();
      spyRead.mockRestore();
    });
  });

  // ===========================================================================
  // 2. AST Slicer (14 tests)
  // ===========================================================================
  describe('2. AST CodeSlicer', () => {
    const mockFile = (content: string) => {
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      return jest.spyOn(mockFs, 'readFileSync').mockReturnValue(content);
    };

    afterEach(() => {
      const mockFs = require('fs');
      jest.restoreAllMocks();
    });

    test('5. FULL preserva todo el código', () => {
      const code = `class Test { method()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }`;
      mockFile(code);
      const res = CodeSlicer.slice('/', 'test.ts', 'FULL');
      expect(res.content).toBe(code);
    });

    test('6. EXCLUDE retorna contenido vacío', () => {
      mockFile('class A {}');
      const res = CodeSlicer.slice('/', 'test.ts', 'EXCLUDE');
      expect(res.content).toBe('');
      expect(res.slicedSize).toBe(0);
    });

    test('7. STRUCTURAL colapsa cuerpo de métodos de clase', () => {
      mockFile(`class Test { method()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }`);
      const res = CodeSlicer.slice('/', 'test.ts', 'STRUCTURAL');
      expect(res.content).toContain('/* ... código omitido por ASAF ... */');
    });

    test('8. STRUCTURAL colapsa cuerpo de funciones', () => {
      mockFile(`function doWork()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }`);
      const res = CodeSlicer.slice('/', 'test.ts', 'STRUCTURAL');
      expect(res.content).toContain('/* ... código omitido por ASAF ... */');
    });

    test('9. STRUCTURAL colapsa cuerpo de constructores', () => {
      mockFile(`class Test { constructor()  { /* Constructor del motor ASAF */ } }`);
      const res = CodeSlicer.slice('/', 'test.ts', 'STRUCTURAL');
      expect(res.content).toContain('/* ... código omitido por ASAF ... */');
    });

    test('10. STRUCTURAL colapsa cuerpo de arrow functions', () => {
      mockFile(`const fn = () => { doSomething(); }`);
      const res = CodeSlicer.slice('/', 'test.ts', 'STRUCTURAL');
      expect(res.content).toContain('/* ... código omitido por ASAF ... */');
    });

    test('11. SIGNATURE omite cuerpo de métodos de clase', () => {
      mockFile(`class Test { method(): number  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }`);
      const res = CodeSlicer.slice('/', 'test.ts', 'SIGNATURE');
      expect(res.content).toContain('method(): number;');
      expect(res.content).not.toContain('return 1;');
    });

    test('12. SIGNATURE omite cuerpo de funciones', () =>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }`);
      const res = CodeSlicer.slice('/', 'test.ts', 'SIGNATURE');
      expect(res.content).toContain('function run(a: string): void;');
      expect(res.content).not.toContain('execute()');
    });

    test('13. MINIMAL retorna representación de clases estructurada', () =>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }`);
      const res = CodeSlicer.slice('/', 'test.ts', 'MINIMAL');
      expect(res.content).toContain('UserService');
      expect(res.content).toContain('- createUser(name): User');
    });

    test('14. MINIMAL retorna representación de funciones estructurada', () =>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }`);
      const res = CodeSlicer.slice('/', 'test.ts', 'MINIMAL');
      expect(res.content).toBe('- auth(u): boolean');
    });

    test('15. Slicer preserva decoradores de clase', () =>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }) class Home {}`);
      const res = CodeSlicer.slice('/', 'test.ts', 'STRUCTURAL');
      expect(res.content).toContain('@Component');
      expect(res.content).toContain('class Home');
    });

    test('16. Slicer preserva tipos e interfaces', () => {
      mockFile(`export interface Repo { save(): void; }`);
      const res = CodeSlicer.slice('/', 'test.ts', 'STRUCTURAL');
      expect(res.content).toContain('export interface Repo');
    });

    test('17. Slicer colapsa constructores multilínea', () =>  { /* Constructor del motor ASAF */ } }`);
      const res = CodeSlicer.slice('/', 'test.ts', 'STRUCTURAL');
      expect(res.content).toContain('/* ... código omitido por ASAF ... */');
    });

    test('18. Slicer no se rompe con código TS genérico', () => {
      mockFile(`class Generic<T> { process(item: T): T  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }`);
      const res = CodeSlicer.slice('/', 'test.ts', 'SIGNATURE');
      expect(res.content).toContain('class Generic<T>');
      expect(res.content).toContain('process(item: T): T;');
    });
  });

  // ===========================================================================
  // 3. Graph BFS (6 tests)
  // ===========================================================================
  describe('3. Graph BFS', () =>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  },
      indexMetadata: { schemaVersion: 1, indexerVersion: '', createdAt: '', updatedAt: '', diagnostics: [] },
      files: [
        { path: 'A.ts', hash: '', size: 100 },
        { path: 'B.ts', hash: '', size: 100 },
        { path: 'C.ts', hash: '', size: 100 },
        { path: 'D.ts', hash: '', size: 100 }
      ],
      modules: [], symbols: [],
      relations: [
        { from: 'A.ts', to: 'B.ts', type: 'imports' },
        { from: 'B.ts', to: 'C.ts', type: 'imports' },
        { from: 'C.ts', to: 'D.ts', type: 'imports' },
        { from: 'A.ts', to: 'adr:ADR-001', type: 'governed-by' }
      ],
      apis: [], databases: [], tests: [], dependencies: [],
      architecture: { layers: [] }, decisions: [],
      git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
    });

    test('19. getDependenciesWithDistance retorna distancias correctas', () => {
      const { DeterministicGraphQueryEngine } = require('./infrastructure/graph/query-engine');
      const engine = new DeterministicGraphQueryEngine(mockModel());
      const deps = engine.getDependenciesWithDistance('A.ts');

      expect(deps.find((d: any) => d.id === 'B.ts').distance).toBe(1);
      expect(deps.find((d: any) => d.id === 'C.ts').distance).toBe(2);
      expect(deps.find((d: any) => d.id === 'D.ts').distance).toBe(3);
    });

    test('20. getDependentsWithDistance retorna distancias correctas en sentido inverso', () => {
      const { DeterministicGraphQueryEngine } = require('./infrastructure/graph/query-engine');
      const engine = new DeterministicGraphQueryEngine(mockModel());
      const deps = engine.getDependentsWithDistance('D.ts');

      expect(deps.find((d: any) => d.id === 'C.ts').distance).toBe(1);
      expect(deps.find((d: any) => d.id === 'B.ts').distance).toBe(2);
      expect(deps.find((d: any) => d.id === 'A.ts').distance).toBe(3);
    });

    test('21. BFS excluye expandir a través de nodos virtuales adr:', () => {
      const { DeterministicGraphQueryEngine } = require('./infrastructure/graph/query-engine');
      const engine = new DeterministicGraphQueryEngine(mockModel());
      const deps = engine.getDependenciesWithDistance('A.ts');
      // adr:ADR-001 no debe propagar/expandir dependencias
      const adrNode = deps.find((d: any) => d.id === 'adr:ADR-001');
      expect(adrNode).toBeDefined();
    });

    test('22. BFS maneja ciclos sin bucles infinitos', () => {
      const model = mockModel();
      model.relations.push({ from: 'D.ts', to: 'A.ts', type: 'imports' });

      const { DeterministicGraphQueryEngine } = require('./infrastructure/graph/query-engine');
      const engine = new DeterministicGraphQueryEngine(model);
      const deps = engine.getDependenciesWithDistance('A.ts');
      expect(deps.length).toBe(4); // A -> B -> C -> D -> A (ya visitado)
    });

    test('23. BFS calcula caminos físicos exactos', () => {
      const { DeterministicGraphQueryEngine } = require('./infrastructure/graph/query-engine');
      const engine = new DeterministicGraphQueryEngine(mockModel());
      const deps = engine.getDependenciesWithDistance('A.ts');
      const target = deps.find((d: any) => d.id === 'C.ts');
      expect(target.path).toEqual(['A.ts', 'B.ts', 'C.ts']);
    });

    test('24. BFS devuelve dependencias vacías para nodos aislados', () => {
      const { DeterministicGraphQueryEngine } = require('./infrastructure/graph/query-engine');
      const engine = new DeterministicGraphQueryEngine(mockModel());
      const deps = engine.getDependenciesWithDistance('D.ts');
      expect(deps.length).toBe(0);
    });
  });

  // ===========================================================================
  // 4. Ranking (7 tests)
  // ===========================================================================
  describe('4. Context Ranking', () => {
    test('25. Targets obtienen prioridad máxima de 100', () => {
      const ranked = ContextRanker.rank(['target.ts'], [], [], [], [], []);
      expect(ranked[0].priority).toBe(100);
      expect(ranked[0].source).toBe('target');
    });

    test('26. Dependencias directas obtienen prioridad 90', () => {
      const ranked = ContextRanker.rank([], [{ id: 'dep.ts', distance: 1 }], [], [], [], []);
      expect(ranked[0].priority).toBe(90);
    });

    test('27. Dependencias con distancia 2 obtienen prioridad penalizada (75)', () => {
      const ranked = ContextRanker.rank([], [{ id: 'dep.ts', distance: 2 }], [], [], [], []);
      expect(ranked[0].priority).toBe(75);
    });

    test('28. Desempate determinista alfabético si prioridades son iguales', () => {
      const ranked = ContextRanker.rank([], [{ id: 'B.ts', distance: 1 }, { id: 'A.ts', distance: 1 }], [], [], [], []);
      expect(ranked[0].id).toBe('A.ts');
      expect(ranked[1].id).toBe('B.ts');
    });

    test('29. deduplicación prioriza el rol con mayor prioridad', () => {
      // Si A.ts es target (100) y también se pasa como dependencia (90), debe figurar una sola vez como target
      const ranked = ContextRanker.rank(['A.ts'], [{ id: 'A.ts', distance: 1 }], [], [], [], []);
      expect(ranked.length).toBe(1);
      expect(ranked[0].priority).toBe(100);
    });

    test('30. Símbolos, Tests y ADRs obtienen pesos estables intermedios', () => {
      const ranked = ContextRanker.rank([], [], [], ['symbol:s1'], ['test.spec.ts'], ['ADR-001']);
      // Símbolo = 80, Test = 75, ADR = 70
      expect(ranked.find((r: any) => r.type === 'symbol')?.priority).toBe(80);
      expect(ranked.find((r: any) => r.id === 'test.spec.ts')?.priority).toBe(75);
      expect(ranked.find((r: any) => r.type === 'adr')?.priority).toBe(70);
    });

    test('31. explain contiene razones descriptivas legibles', () => {
      const ranked = ContextRanker.rank(['target.ts'], [], [], [], [], []);
      expect(ranked[0].reason).toContain('Target directo');
    });
  });

  // ===========================================================================
  // 5. Budget (8 tests)
  // ===========================================================================
  describe('5. Context Budget', () => {
    const mockFile = (content: string) => {
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      return jest.spyOn(mockFs, 'readFileSync').mockReturnValue(content);
    };

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('32. Budget respeta el límite estricto de tokens', () => {
      const ranked = [{ id: 'a.ts', type: 'file' as const, priority: 100, reason: '', source: 'target' as const }];
      mockFile('class A { method()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }'); // 35 chars -> ~9 tokens

      const { slices, estimatedAfterSlicing } = ContextBudget.enforce(ranked, 15, '/', {});
      expect(estimatedAfterSlicing).toBeLessThanOrEqual(15);
      expect(slices.length).toBe(1);
    });

    test('33. Degradación a STRUCTURAL cuando FULL excede el budget', () => {
      const ranked = [{ id: 'a.ts', type: 'file' as const, priority: 100, reason: '', source: 'target' as const }];
      // FULL cuesta ~20 tokens. STRUCTURAL cuesta menos
      mockFile(`class A {\n  longMethod()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }\n}`);

      const { slices } = ContextBudget.enforce(ranked, 30, '/', {});
      expect(slices[0].level).toBe('STRUCTURAL');
    });

    test('34. Exclusión de archivo si excede incluso en MINIMAL', () => {
      const ranked = [{ id: 'a.ts', type: 'file' as const, priority: 100, reason: '', source: 'target' as const }];
      mockFile('class A { foo()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }'); // MINIMAL costará ~6 tokens

      const { slices } = ContextBudget.enforce(ranked, 2, '/', {});
      expect(slices.length).toBe(0); // Excluido por exceder el budget
    });

    test('35. Prioridad respetada al distribuir el budget restante', () => {
      const ranked = [
        { id: 'A.ts', type: 'file' as const, priority: 100, reason: '', source: 'target' as const },
        { id: 'B.ts', type: 'file' as const, priority: 50, reason: '', source: 'dependency' as const }
      ];
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockImplementation((p: any) => {
        if (p.includes('A.ts')) return 'class A {}'; // ~3 tokens
        return 'class B {}'; // ~3 tokens
      });

      const { slices } = ContextBudget.enforce(ranked, 3, '/', {});
      // Solo cabe uno en el budget total, debe ser el de mayor prioridad (A.ts)
      expect(slices.map((s: any) => s.filePath)).toContain('A.ts');
      expect(slices.map((s: any) => s.filePath)).not.toContain('B.ts');
    });

    test('36. Budget enorme incluye todo en nivel FULL', () => {
      const ranked = [{ id: 'a.ts', type: 'file' as const, priority: 100, reason: '', source: 'target' as const }];
      mockFile('class A {}');
      const { slices } = ContextBudget.enforce(ranked, 99999, '/', {});
      expect(slices[0].level).toBe('FULL');
    });

    test('37. Budget = 0 excluye todos los archivos', () => {
      const ranked = [{ id: 'a.ts', type: 'file' as const, priority: 100, reason: '', source: 'target' as const }];
      mockFile('class A {}');
      const { slices } = ContextBudget.enforce(ranked, 0, '/', {});
      expect(slices.length).toBe(0);
    });

    test('38. Planificador maneja múltiples archivos de forma recursiva', () => {
      const ranked = [
        { id: 'A.ts', type: 'file' as const, priority: 100, reason: '', source: 'target' as const },
        { id: 'B.ts', type: 'file' as const, priority: 90, reason: '', source: 'dependency' as const }
      ];
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockImplementation((p: any) => {
        return 'class T {}'; // ~3 tokens
      });

      const { slices } = ContextBudget.enforce(ranked, 10, '/', {});
      expect(slices.length).toBe(2);
    });

    test('39. Slicing progresivo de múltiples candidatos para caber en budget', () => {
      const ranked = [
        { id: 'A.ts', type: 'file' as const, priority: 100, reason: '', source: 'target' as const },
        { id: 'B.ts', type: 'file' as const, priority: 90, reason: '', source: 'dependency' as const }
      ];
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockImplementation((p: any) => {
        return 'class T { method()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }';
      });

      const { slices } = ContextBudget.enforce(ranked, 15, '/', {});
      // Al no caber ambos en FULL, se degrada a nivel estructural o inferior
      expect(slices.some((s: any) => s.level !== 'FULL')).toBe(true);
    });
  });

  // ===========================================================================
  // 6. UnifiedContextEngine (5 tests)
  // ===========================================================================
  describe('6. UnifiedContextEngine Facade', () => {
    const mockModel = (): ProjectModel => ({
      project: { name: 'GoldenProject', version: '0.1.0', path: '/' },
      indexMetadata: { schemaVersion: 1, indexerVersion: '', createdAt: '', updatedAt: '', diagnostics: [] },
      files: [
        { path: 'src/auth/auth.service.ts', hash: 'h1', size: 100 },
        { path: 'src/auth/auth.controller.ts', hash: 'h2', size: 100 }
      ],
      modules: [], symbols: [],
      relations: [
        { from: 'src/auth/auth.controller.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
        { from: 'src/auth/auth.service.ts', to: 'adr:ADR-003', type: 'governed-by' }
      ],
      apis: [], databases: [], tests: [], dependencies: [],
      architecture: { layers: [] },
      decisions: [
        { id: 'ADR-003', title: 'Usar JWT', status: 'accepted', file: '' }
      ],
      git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
    });

    test('40. buildContext mapea objetivos, dependencias e impactos reales', async () => {
      const engine = new UnifiedContextEngine(mockModel());
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockReturnValue('class AuthService {}');

      const ctx = await engine.buildContext({ files: ['src/auth/auth.service.ts'] });
      expect(ctx.target.files).toContain('src/auth/auth.service.ts');
      expect(ctx.decisions.map((d: any) => d.id)).toContain('ADR-003');
    });

    test('41. Opción explain agrega el reporte explicativo del ranking', async () => {
      const engine = new UnifiedContextEngine(mockModel());
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockReturnValue('class AuthService {}');

      const ctx = await engine.buildContext({ files: ['src/auth/auth.service.ts'], explain: true });
      expect(ctx.explain).toBeDefined();
      expect(ctx.explain![0].priority).toBe(100);
    });

    test('42. explain expone razones coherentes por archivo', async () => {
      const engine = new UnifiedContextEngine(mockModel());
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockReturnValue('class AuthService {}');

      const ctx = await engine.buildContext({ files: ['src/auth/auth.service.ts'], explain: true });
      expect(ctx.explain![0].reason).toContain('Target directo');
    });

    test('43. explain registra distancias BFS correctas', async () => {
      const engine = new UnifiedContextEngine(mockModel());
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockReturnValue('class AuthService {}');

      const ctx = await engine.buildContext({ files: ['src/auth/auth.controller.ts'], explain: true });
      const depItem = ctx.explain!.find((i: any) => i.id === 'src/auth/auth.service.ts');
      expect(depItem!.distance).toBe(1);
    });

    test('44. Explain expone la fuente (source) exacta del candidato', async () => {
      const engine = new UnifiedContextEngine(mockModel());
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockReturnValue('class AuthService {}');

      const ctx = await engine.buildContext({ files: ['src/auth/auth.controller.ts'], explain: true });
      const depItem = ctx.explain!.find((i: any) => i.id === 'src/auth/auth.service.ts');
      expect(depItem!.source).toBe('dependency');
    });
  });

  // ===========================================================================
  // 7. Determinismo / Golden tests (6 tests)
  // ===========================================================================
  describe('7. Determinismo & Golden regression', () => {
    const mockModel = (): ProjectModel => ({
      project: { name: 'GoldenProject', version: '0.1.0', path: '/' },
      indexMetadata: { schemaVersion: 1, indexerVersion: '', createdAt: '', updatedAt: '', diagnostics: [] },
      files: [
        { path: 'src/auth/auth.service.ts', hash: 'h1', size: 100 },
        { path: 'src/auth/auth.controller.ts', hash: 'h2', size: 100 }
      ],
      modules: [], symbols: [],
      relations: [
        { from: 'src/auth/auth.controller.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
        { from: 'src/auth/auth.service.ts', to: 'adr:ADR-003', type: 'governed-by' }
      ],
      apis: [], databases: [], tests: [], dependencies: [],
      architecture: { layers: [] },
      decisions: [
        { id: 'ADR-003', title: 'Usar JWT', status: 'accepted', file: '' }
      ],
      git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('45. Contexto devuelto es 100% idéntico en ejecuciones consecutivas', async () => {
      const engine = new UnifiedContextEngine(mockModel());
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockReturnValue('class AuthService {}');

      const ctx1 = await engine.buildContext({ files: ['src/auth/auth.controller.ts'] });
      const ctx2 = await engine.buildContext({ files: ['src/auth/auth.controller.ts'] });
      expect(JSON.stringify(ctx1)).toBe(JSON.stringify(ctx2));
    });

    test('46. El orden de los targets es determinista e independiente de la entrada', async () => {
      const engine = new UnifiedContextEngine(mockModel());
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockReturnValue('class AuthService {}');

      const ctx1 = await engine.buildContext({ files: ['src/auth/auth.service.ts', 'src/auth/auth.controller.ts'] });
      const ctx2 = await engine.buildContext({ files: ['src/auth/auth.controller.ts', 'src/auth/auth.service.ts'] });
      expect(ctx1.target.files).toEqual(ctx2.target.files);
    });

    test('47. El budget no supera en absoluto la restricción solicitada', async () => {
      const engine = new UnifiedContextEngine(mockModel());
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockReturnValue('class AuthService {}');

      const ctx = await engine.buildContext({ files: ['src/auth/auth.controller.ts'], budget: 170 });
      const serializedText = JSON.stringify(ctx);
      const cost = TokenEstimator.estimate(serializedText);
      expect(cost).toBeLessThanOrEqual(170);
    });

    test('48. Slicing progresivo de múltiples candidatos para caber en budget estricto', async () => {
      const engine = new UnifiedContextEngine(mockModel());
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      const giantMethodCode = new Array(800).fill('console.log("giant-code-line-to-force-degradation-in-tests-with-huge-files-for-context-integrity");').join('\n');
      jest.spyOn(mockFs, 'readFileSync').mockReturnValue(`class AuthService { process()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }\n } }`);

      // Budget restrictivo para dos archivos gigantescos
      const ctx = await engine.buildContext({ files: ['src/auth/auth.controller.ts', 'src/auth/auth.service.ts'], budget: 1000 });
      expect(ctx.codeSlices.some((s: any) => s.level !== 'FULL')).toBe(true);
    });

    test('49. Búsqueda semántica (fallback por tarea) e integración correcta', async () => {
      const engine = new UnifiedContextEngine(mockModel());
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockReturnValue('class AuthService {}');

      const ctx = await engine.buildContext({ task: 'Implementar auth service JWT' });
      expect(ctx.target.files).toContain('src/auth/auth.service.ts');
    });

    test('50. explain ordena de forma estable e idéntica por prioridad, tipo e id', async () => {
      const engine = new UnifiedContextEngine(mockModel());
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'readFileSync').mockReturnValue('class AuthService {}');

      const ctx = await engine.buildContext({ files: ['src/auth/auth.controller.ts'], explain: true });
      const ids = ctx.explain!.map((i: any) => i.id);

      const sortedIds = [...ids].sort((a, b) => {
        const itemA = ctx.explain!.find((i: any) => i.id === a);
        const itemB = ctx.explain!.find((i: any) => i.id === b);
        return (
          itemB!.priority - itemA!.priority ||
          itemA!.type.localeCompare(itemB!.type) ||
          itemA!.id.localeCompare(itemB!.id)
        );
      });
      expect(ids).toEqual(sortedIds);
    });
  });
});
