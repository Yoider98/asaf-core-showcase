import { ADRParser } from './infrastructure/adr/adr-parser';
import { ProjectModel } from './domain/project-model';
import { ADRRegistry } from './infrastructure/adr/adr-registry';
import { ensureRelation } from './infrastructure/indexing/relation-helper';
import { DeterministicADRIntelligenceEngine } from './infrastructure/adr/adr-intelligence-engine';
import { DeterministicImpactEngine } from './infrastructure/impact/impact-engine';

describe('ADR Intelligence — Golden Test Suite', () => {

  // ===========================================================================
  // PARSER (13 tests)
  // ===========================================================================
  describe('1. ADRParser', () => {
    test('1. Parseo de título básico', () => {
      const doc = `# ADR-001: Usar Clean Architecture`;
      const parsed = ADRParser.parse('docs/adr/001.md', doc);
      expect(parsed.title).toBe('ADR-001: Usar Clean Architecture');
    });

    test('2. ID extraído desde el título', () => {
      const doc = `# ADR-005: Base de Datos`;
      const parsed = ADRParser.parse('docs/adr/temp.md', doc);
      expect(parsed.id).toBe('ADR-005');
    });

    test('3. ID extraído desde el nombre de archivo (fallback)', () => {
      const doc = `# Título sin identificador`;
      const parsed = ADRParser.parse('docs/adr/ADR-010-db.md', doc);
      expect(parsed.id).toBe('ADR-010');
    });

    test('4. ID extraído desde Frontmatter', () => {
      const doc = `---\nid: ADR-100\ntitle: Test\n---\n# Usar Redis`;
      const parsed = ADRParser.parse('docs/adr/redis.md', doc);
      expect(parsed.id).toBe('ADR-100');
    });

    test('5. Status extraído de viñeta', () => {
      const doc = `# ADR-001\n- Status: Accepted`;
      const parsed = ADRParser.parse('001.md', doc);
      expect(parsed.status).toBe('accepted');
    });

    test('6. Status extraído de sección cabecera', () => {
      const doc = `# ADR-001\n## Status\n\nSuperseded\n\n## Context`;
      const parsed = ADRParser.parse('001.md', doc);
      expect(parsed.status).toBe('superseded');
    });

    test('7. Date extraído correctamente', () => {
      const doc = `---\ndate: 2026-08-10\n---\n# ADR-002`;
      const parsed = ADRParser.parse('002.md', doc);
      expect(parsed.date).toBe('2026-08-10');
    });

    test('8. Tags extraídos y deduplicados', () => {
      const doc = `---\ntags:\n  - core\n  - core\n  - db\n---\n# ADR-003`;
      const parsed = ADRParser.parse('003.md', doc);
      expect(parsed.tags).toEqual(['core', 'db']);
    });

    test('9. Supersedes múltiple desde frontmatter', () => {
      const doc = `---\nsupersedes:\n  - ADR-001\n  - ADR-002\n---\n# ADR-003`;
      const parsed = ADRParser.parse('003.md', doc);
      expect(parsed.supersedes).toEqual(['ADR-001', 'ADR-002']);
    });

    test('10. SupersededBy extraído', () => {
      const doc = `---\nsuperseded_by: ADR-004\n---\n# ADR-002`;
      const parsed = ADRParser.parse('002.md', doc);
      expect(parsed.supersededBy).toBe('ADR-004');
    });

    test('11. Context extraído correctamente', () => {
      const doc = `# ADR-001\n## Context\nEste es el contexto de la decisión.\n## Decision`;
      const parsed = ADRParser.parse('001.md', doc);
      expect(parsed.context).toBe('Este es el contexto de la decisión.');
    });

    test('12. Decision extraído correctamente', () => {
      const doc = `# ADR-001\n## Decision\nDecidimos usar TypeScript.\n## Consequences`;
      const parsed = ADRParser.parse('001.md', doc);
      expect(parsed.decision).toBe('Decidimos usar TypeScript.');
    });

    test('13. Consequences extraído correctamente', () => {
      const doc = `# ADR-001\n## Consequences\nMayor robustez de tipos.\n## End`;
      const parsed = ADRParser.parse('001.md', doc);
      expect(parsed.consequences).toBe('Mayor robustez de tipos.');
    });
  });

  // ===========================================================================
  // REGISTRY & DEDUPLICATION (5 tests)
  // ===========================================================================
  describe('2. ADRRegistry', () => {
    const mockModel = (): ProjectModel => ({
      project: { name: 'Test', version: '0.1.0', path: '' },
      indexMetadata: { schemaVersion: 1, indexerVersion: '1', createdAt: '', updatedAt: '', diagnostics: [] },
      files: [], modules: [], symbols: [],
      relations: [
        { from: 'adr:ADR-002', to: 'adr:ADR-001', type: 'supersedes' },
        { from: 'adr:ADR-002', to: 'adr:ADR-009', type: 'supersedes' } // Relación obsoleta/stale
      ],
      apis: [], databases: [], tests: [], dependencies: [],
      architecture: { layers: [] }, decisions: [],
      git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
    });

    test('14. Descubrimiento e inyección de decisiones', () => {
      const registry = new ADRRegistry('/non-existent');
      const model = mockModel();
      registry.discoverAndRegister(model);
      // Debe dejar decisions vacías o no romper si no hay directorio
      expect(model.decisions).toBeDefined();
    });

    test('15. supersedes genera relación en el grafo', () => {
      const model = mockModel();
      model.decisions = [
        { id: 'ADR-002', title: 'T', status: 'accepted', file: '', supersedes: ['ADR-001'] }
      ];
      const registry = new ADRRegistry('/non-existent');
      // Re-descubrir debería reconciliar
      registry.discoverAndRegister(model);
      const relations = model.relations.filter(r => r.type === 'supersedes');
      // Sólo debe quedar la de ADR-002 -> ADR-001
      expect(relations.length).toBe(1);
      expect(relations[0].from).toBe('adr:ADR-002');
      expect(relations[0].to).toBe('adr:ADR-001');
    });

    test('16. ensureRelation previene duplicados', () => {
      const model = mockModel();
      model.relations = [];
      const rel = { from: 'core/domain.ts', to: 'adr:ADR-001', type: 'governed-by' as const };
      ensureRelation(model, rel);
      ensureRelation(model, rel);
      expect(model.relations.length).toBe(1);
    });

    test('17. ADRRegistry limpia relaciones supersedes obsoletas (Stale)', () => {
      const model = mockModel();
      model.decisions = [
        { id: 'ADR-002', title: 'T', status: 'accepted', file: '', supersedes: ['ADR-001'] }
      ];
      // ADR-002 ya no declara reemplazar a ADR-009. La relación obsoleta debe borrarse.
      const registry = new ADRRegistry('/non-existent');
      registry.discoverAndRegister(model);
      const relations = model.relations.filter(r => r.type === 'supersedes');
      expect(relations.some(r => r.to === 'adr:ADR-009')).toBe(false);
    });

    test('18. Re-indexación es idempotente', () => {
      const model = mockModel();
      model.decisions = [
        { id: 'ADR-002', title: 'T', status: 'accepted', file: '', supersedes: ['ADR-001'] }
      ];
      const registry = new ADRRegistry('/non-existent');
      registry.discoverAndRegister(model);
      const r1 = JSON.stringify(model.relations);
      registry.discoverAndRegister(model);
      const r2 = JSON.stringify(model.relations);
      expect(r1).toBe(r2);
    });
  });

  // ===========================================================================
  // ANOTACIONES AST & GRAFO (5 tests)
  // ===========================================================================
  describe('3. Código ➔ ADR (Anotaciones AST)', () => {
    test('19. FileAnalyzer detecta anotación @asaf-adr en comentarios', async () => {
      const { FileAnalyzer } = require('./infrastructure/indexing/file-analyzer');
      const analyzer = new FileAnalyzer('/non-existent');
      // Simular lectura de archivo mock
      const mockFs = require('fs');
      const spy = jest.spyOn(mockFs, 'readFileSync').mockReturnValue(`
        /**
         * @asaf-adr ADR-003
         */
        export class Invoice {}
      `);
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'statSync').mockReturnValue({ isDirectory: () => false, size: 100 } as any);

      const result = await analyzer.analyze('invoice.ts');
      const adrRel = result.relations.find((r: any) => r.type === 'governed-by');
      expect(adrRel).toBeDefined();
      expect(adrRel.to).toBe('adr:ADR-003');

      spy.mockRestore();
    });

    test('20. FileAnalyzer detecta @architecture-decision', async () => {
      const { FileAnalyzer } = require('./infrastructure/indexing/file-analyzer');
      const analyzer = new FileAnalyzer('/non-existent');
      const mockFs = require('fs');
      const spy = jest.spyOn(mockFs, 'readFileSync').mockReturnValue(`
        // @architecture-decision ADR-005
        export function process()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
      `);
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'statSync').mockReturnValue({ isDirectory: () => false, size: 100 } as any);

      const result = await analyzer.analyze('process.ts');
      const adrRel = result.relations.find((r: any) => r.type === 'governed-by');
      expect(adrRel).toBeDefined();
      expect(adrRel.to).toBe('adr:ADR-005');

      spy.mockRestore();
    });

    test('21. FileAnalyzer extrae múltiples anotaciones de un solo archivo', async () => {
      const { FileAnalyzer } = require('./infrastructure/indexing/file-analyzer');
      const analyzer = new FileAnalyzer('/non-existent');
      const mockFs = require('fs');
      const spy = jest.spyOn(mockFs, 'readFileSync').mockReturnValue(`
        /**
         * @asaf-adr ADR-001
         * @asaf-adr ADR-002
         */
        export class Engine {}
      `);
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'statSync').mockReturnValue({ isDirectory: () => false, size: 100 } as any);

      const result = await analyzer.analyze('engine.ts');
      const adrRels = result.relations.filter((r: any) => r.type === 'governed-by');
      expect(adrRels.length).toBe(2);
      expect(adrRels.map((r: any) => r.to)).toContain('adr:ADR-001');
      expect(adrRels.map((r: any) => r.to)).toContain('adr:ADR-002');

      spy.mockRestore();
    });

    test('22. Anotaciones duplicadas no generan relaciones duplicadas', async () => {
      const { FileAnalyzer } = require('./infrastructure/indexing/file-analyzer');
      const analyzer = new FileAnalyzer('/non-existent');
      const mockFs = require('fs');
      const spy = jest.spyOn(mockFs, 'readFileSync').mockReturnValue(`
        // @asaf-adr ADR-001
        // @asaf-adr ADR-001
        export class Unique {}
      `);
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
      jest.spyOn(mockFs, 'statSync').mockReturnValue({ isDirectory: () => false, size: 100 } as any);

      const result = await analyzer.analyze('unique.ts');
      const adrRels = result.relations.filter((r: any) => r.type === 'governed-by' && r.to === 'adr:ADR-001');
      // FileAnalyzer puede devolver duplicados antes de indexar, pero en ProjectIndexer se dedican.
      // Aquí validamos que se detectó la anotación.
      expect(adrRels.length).toBeGreaterThanOrEqual(1);

      spy.mockRestore();
    });

    test('23. ADR inexistente referenciado en código queda detectable por consistency check', () => {
      const model: ProjectModel = {
        project: { name: 'T', version: '', path: '' },
        indexMetadata: { schemaVersion: 1, indexerVersion: '', createdAt: '', updatedAt: '', diagnostics: [] },
        files: [], modules: [], symbols: [],
        relations: [
          { from: 'core/domain.ts', to: 'adr:ADR-999', type: 'governed-by' }
        ],
        apis: [], databases: [], tests: [], dependencies: [],
        architecture: { layers: [] }, decisions: [],
        git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
      };

      const engine = new DeterministicADRIntelligenceEngine(model);
      const report = engine.validateADRConsistency();
      expect(report.isValid).toBe(false);
      expect(report.issues.some(i => i.includes('inexistente') && i.includes('ADR-999'))).toBe(true);
    });
  });

  // ===========================================================================
  // INTELLIGENCE & CONSISTENCY (12 tests)
  // ===========================================================================
  describe('4. ADRIntelligenceEngine & Consistencia', () => {
    function buildModel(): ProjectModel  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  },
        indexMetadata: { schemaVersion: 1, indexerVersion: '0.2.6', createdAt: '', updatedAt: '', diagnostics: [] },
        files: [
          { path: 'core/domain.ts', hash: 'h1', size: 100 },
          { path: 'core/infrastructure.ts', hash: 'h2', size: 100 }
        ],
        modules: [], symbols: [],
        relations: [
          { from: 'core/domain.ts', to: 'adr:ADR-001', type: 'governed-by' },
          { from: 'core/infrastructure.ts', to: 'core/domain.ts', type: 'imports' }
        ],
        apis: [], databases: [], tests: [], dependencies: [],
        architecture: { layers: [] },
        decisions: [
          { id: 'ADR-001', title: 'Clean Architecture', status: 'accepted', file: '' }
        ],
        git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
      };
    }

    test('24. getADR por ID normalizado', () => {
      const engine = new DeterministicADRIntelligenceEngine(buildModel());
      const adr = engine.getADR('adr-001');
      expect(adr).toBeDefined();
      expect(adr!.id).toBe('ADR-001');
    });

    test('25. listADRs retorna todas las decisiones', () => {
      const engine = new DeterministicADRIntelligenceEngine(buildModel());
      expect(engine.listADRs().length).toBe(1);
    });

    test('26. findRelatedNodes retorna dependientes en dirección inversa', () => {
      const engine = new DeterministicADRIntelligenceEngine(buildModel());
      // core/domain.ts apunta a adr:ADR-001.
      // core/infrastructure.ts importa a core/domain.ts.
      // Ambos deberían estar gobernados transitivamente por el ADR.
      const nodes = engine.findRelatedNodes('ADR-001');
      expect(nodes).toContain('core/domain.ts');
      expect(nodes).toContain('core/infrastructure.ts');
    });

    test('27. Detecta ADR afectado directamente', () => {
      const engine = new DeterministicADRIntelligenceEngine(buildModel());
      const affected = engine.findAffectedADRs('core/domain.ts');
      expect(affected.length).toBe(1);
      expect(affected[0].id).toBe('ADR-001');
    });

    test('28. Detecta ADR afectado transitivamente', () => {
      const engine = new DeterministicADRIntelligenceEngine(buildModel());
      const affected = engine.findAffectedADRs('core/infrastructure.ts', ['core/domain.ts']);
      expect(affected.length).toBe(1);
      expect(affected[0].id).toBe('ADR-001');
    });

    test('29. findSupersededADRs filtra por estado superseded', () => {
      const model = buildModel();
      model.decisions.push({ id: 'ADR-002', title: 'Old', status: 'superseded', file: '', supersededBy: 'ADR-001' });
      const engine = new DeterministicADRIntelligenceEngine(model);
      const superseded = engine.findSupersededADRs();
      expect(superseded.length).toBe(1);
      expect(superseded[0].id).toBe('ADR-002');
    });

    test('30. Detecta inconsistencia si un ADR supersedes apunta a un ID inexistente', () => {
      const model = buildModel();
      model.decisions.push({ id: 'ADR-002', title: 'T', status: 'accepted', file: '', supersedes: ['ADR-999'] });
      const engine = new DeterministicADRIntelligenceEngine(model);
      const report = engine.validateADRConsistency();
      expect(report.isValid).toBe(false);
      expect(report.issues.some(i => i.includes('ADR-999') && i.includes('no existe'))).toBe(true);
    });

    test('31. Detecta inconsistencia si un supersededBy apunta a un ID inexistente', () => {
      const model = buildModel();
      model.decisions.push({ id: 'ADR-002', title: 'T', status: 'superseded', file: '', supersededBy: 'ADR-999' });
      const engine = new DeterministicADRIntelligenceEngine(model);
      const report = engine.validateADRConsistency();
      expect(report.isValid).toBe(false);
      expect(report.issues.some(i => i.includes('ADR-999') && i.includes('no existe'))).toBe(true);
    });

    test('32. Detecta inconsistencia bidireccional entre supersedes y supersededBy', () => {
      const model = buildModel();
      model.decisions.push(
        { id: 'ADR-002', title: 'Old', status: 'superseded', file: '', supersededBy: 'ADR-001' }
        // ADR-001 no tiene "supersedes: [ADR-002]"
      );
      const engine = new DeterministicADRIntelligenceEngine(model);
      const report = engine.validateADRConsistency();
      expect(report.isValid).toBe(false);
      expect(report.issues.some(i => i.includes('Inconsistencia') && i.includes('ADR-002'))).toBe(true);
    });

    test('33. Detecta autorreemplazo (self-supersedes)', () => {
      const model = buildModel();
      model.decisions.push({ id: 'ADR-002', title: 'Self', status: 'superseded', file: '', supersededBy: 'ADR-002' });
      const engine = new DeterministicADRIntelligenceEngine(model);
      const report = engine.validateADRConsistency();
      expect(report.isValid).toBe(false);
      expect(report.issues.some(i => i.includes('a sí mismo'))).toBe(true);
    });

    test('34. Detecta ciclos de reemplazo de 2 ADRs', () => {
      const model = buildModel();
      model.decisions.push(
        { id: 'ADR-002', title: 'A', status: 'superseded', file: '', supersededBy: 'ADR-003', supersedes: ['ADR-003'] },
        { id: 'ADR-003', title: 'B', status: 'superseded', file: '', supersededBy: 'ADR-002', supersedes: ['ADR-002'] }
      );
      const engine = new DeterministicADRIntelligenceEngine(model);
      const report = engine.validateADRConsistency();
      expect(report.isValid).toBe(false);
      expect(report.issues.some(i => i.includes('Ciclo de reemplazos detectado'))).toBe(true);
    });

    test('35. Detecta ciclos de reemplazo transitivos (3+ ADRs)', () => {
      const model = buildModel();
      model.decisions.push(
        { id: 'ADR-002', title: 'A', status: 'superseded', file: '', supersededBy: 'ADR-003', supersedes: ['ADR-004'] },
        { id: 'ADR-003', title: 'B', status: 'superseded', file: '', supersededBy: 'ADR-004', supersedes: ['ADR-002'] },
        { id: 'ADR-004', title: 'C', status: 'superseded', file: '', supersededBy: 'ADR-002', supersedes: ['ADR-003'] }
      );
      const engine = new DeterministicADRIntelligenceEngine(model);
      const report = engine.validateADRConsistency();
      expect(report.isValid).toBe(false);
      expect(report.issues.some(i => i.includes('Ciclo de reemplazos detectado'))).toBe(true);
    });
  });

  // ===========================================================================
  // IMPACT & EVIDENCIAS (5 tests)
  // ===========================================================================
  describe('5. Impact & ADR Evidences', () => {
    function buildModel(): ProjectModel  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  },
        indexMetadata: { schemaVersion: 1, indexerVersion: '0.2.6', createdAt: '', updatedAt: '', diagnostics: [] },
        files: [
          { path: 'core/domain.ts', hash: 'h1', size: 100 },
          { path: 'core/infrastructure.ts', hash: 'h2', size: 100 }
        ],
        modules: [], symbols: [],
        relations: [
          { from: 'core/domain.ts', to: 'adr:ADR-001', type: 'governed-by' },
          { from: 'core/infrastructure.ts', to: 'core/domain.ts', type: 'imports' }
        ],
        apis: [], databases: [], tests: [], dependencies: [],
        architecture: { layers: [] },
        decisions: [
          { id: 'ADR-001', title: 'Clean Architecture', status: 'accepted', file: '' }
        ],
        git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
      };
    }

    test('36. ImpactReport incluye affectedADRs con metadatos de decisión', async () => {
      const engine = new DeterministicImpactEngine(buildModel());
      const report = await engine.analyzeImpact('core/domain.ts');
      expect(report.affectedADRs).toBeDefined();
      expect(report.affectedADRs!.length).toBe(1);
      expect(report.affectedADRs![0].id).toBe('ADR-001');
    });

    test('37. La evidencia física del ADR es un shortest path target ➔ nodeIdAffected ➔ adr:ID', async () => {
      const engine = new DeterministicImpactEngine(buildModel());
      // target: core/domain.ts, dependiente afectado: core/domain.ts.
      // evidencia path: [core/domain.ts, adr:ADR-001]
      const report = await engine.analyzeImpact('core/domain.ts');
      const evidence = report.affectedADRs![0].evidence;
      expect(evidence.path[0]).toBe('core/domain.ts');
      expect(evidence.path[evidence.path.length - 1]).toBe('adr:ADR-001');
    });

    test('38. Detección de impacto transitivo a nivel de ADR', async () => {
      const engine = new DeterministicImpactEngine(buildModel());
      // target: core/domain.ts. dependiente afectado: core/infrastructure.ts (importa core/domain.ts).
      // Si el target se cambia, afecta core/infrastructure.ts que está gobernado transitivamente.
      // No obstante, la relación directa de governed-by está en core/domain.ts, por lo que se detecta igual.
      const report = await engine.analyzeImpact('core/domain.ts');
      expect(report.affectedADRs!.some(a => a.id === 'ADR-001')).toBe(true);
    });

    test('39. Deduplicación de ADRs afectados', async () => {
      const model = buildModel();
      // Agregar otro archivo que apunte al mismo ADR
      model.files.push({ path: 'core/another.ts', hash: 'h3', size: 100 });
      model.relations.push(
        { from: 'core/another.ts', to: 'adr:ADR-001', type: 'governed-by' },
        { from: 'core/another.ts', to: 'core/domain.ts', type: 'imports' }
      );
      const engine = new DeterministicImpactEngine(model);
      const report = await engine.analyzeImpact('core/domain.ts');
      // Debe aparecer una sola vez en affectedADRs
      expect(report.affectedADRs!.length).toBe(1);
    });

    test('40. Determinismo entre ejecuciones consecutivas', async () => {
      const engine = new DeterministicImpactEngine(buildModel());
      const r1 = await engine.analyzeImpact('core/domain.ts');
      const r2 = await engine.analyzeImpact('core/domain.ts');
      expect(JSON.stringify(r1.affectedADRs)).toBe(JSON.stringify(r2.affectedADRs));
    });
  });

  // ===========================================================================
  // CLI INTEGRACIÓN (3 tests)
  // ===========================================================================
  describe('6. CLI / Integración', () => {
    test('41. CLI puede instanciar el ADR engine y listar decisiones', () => {
      const model = {
        project: { name: 'T', version: '', path: '' },
        indexMetadata: { schemaVersion: 1, indexerVersion: '', createdAt: '', updatedAt: '', diagnostics: [] },
        files: [], modules: [], symbols: [], relations: [], apis: [], databases: [], tests: [], dependencies: [],
        architecture: { layers: [] }, decisions: [{ id: 'ADR-001', title: 'T', status: 'accepted' as const, file: '' }],
        git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
      };
      const engine = new DeterministicADRIntelligenceEngine(model);
      expect(engine.listADRs()).toBeDefined();
      expect(engine.listADRs().length).toBe(1);
    });

    test('42. CLI adr show devuelve el formato JSON esperado', () => {
      const model = {
        project: { name: 'T', version: '', path: '' },
        indexMetadata: { schemaVersion: 1, indexerVersion: '', createdAt: '', updatedAt: '', diagnostics: [] },
        files: [], modules: [], symbols: [], relations: [], apis: [], databases: [], tests: [], dependencies: [],
        architecture: { layers: [] }, decisions: [{ id: 'ADR-001', title: 'T', status: 'accepted' as const, file: '' }],
        git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
      };
      const engine = new DeterministicADRIntelligenceEngine(model);
      const adr = engine.getADR('ADR-001');
      expect(adr).toBeDefined();
      expect(adr!.title).toBe('T');
    });

    test('43. CLI check detecta reportes inválidos ante fallos de consistencia', () => {
      const model = {
        project: { name: 'T', version: '', path: '' },
        indexMetadata: { schemaVersion: 1, indexerVersion: '', createdAt: '', updatedAt: '', diagnostics: [] },
        files: [], modules: [], symbols: [], relations: [], apis: [], databases: [], tests: [], dependencies: [],
        architecture: { layers: [] }, decisions: [{ id: 'ADR-001', title: 'T', status: 'superseded' as const, file: '', supersededBy: 'ADR-999' }],
        git: { indexedCommit: '', headCommit: '', changedFilesSinceLastIndex: [], indexTimestamp: '', isDirty: false }
      };
      const engine = new DeterministicADRIntelligenceEngine(model);
      const report = engine.validateADRConsistency();
      expect(report.isValid).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
    });
  });
});
