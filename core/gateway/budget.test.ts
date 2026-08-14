import { ContextPrioritizer, CodeSliceCandidate } from './context-prioritizer';
import { ContextBudgetManager, ContextBudgetConfig } from './context-budget-manager';
import { ContextChunker } from './context-chunker';
import * as fs from 'fs';
import * as path from 'path';

describe('ASAF Gate 11D - Context Budget & Chunking Tests', () => {
  const sandboxDir = path.resolve(__dirname, 'sandbox_budget_test');

  beforeAll(() => {
    if (!fs.existsSync(sandboxDir)) {
      fs.mkdirSync(sandboxDir, { recursive: true });
    }
    // Escribir archivos mock para el CodeSlicer
    fs.writeFileSync(path.join(sandboxDir, 'target.ts'), 'export class Target { run()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }');
    fs.writeFileSync(path.join(sandboxDir, 'dep.ts'), 'export class Dep { help()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }');
    fs.writeFileSync(path.join(sandboxDir, 'test.test.ts'), 'describe("test", () => {});');
  });

  afterAll(() => {
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  });

  test('Fase 1: ContextPrioritizer ordena deterministamente por categoría y peso', () => {
    const slices: CodeSliceCandidate[] = [
      { filePath: 'test.test.ts', content: 'describe()', level: 'FULL', size: 10 },
      { filePath: 'target.ts', content: 'class Target {}', level: 'FULL', size: 15 },
      { filePath: 'dep.ts', content: 'class Dep {}', level: 'FULL', size: 12 }
    ];

    const prioritized = ContextPrioritizer.prioritize(
      slices,
      ['target.ts'],
      ['dep.ts'],
      [],
      ['test.test.ts']
    );

    expect(prioritized[0].filePath).toBe('target.ts');
    expect(prioritized[0].category).toBe('TARGET');
    expect(prioritized[1].filePath).toBe('dep.ts');
    expect(prioritized[1].category).toBe('DIRECT_DEPENDENCY');
    expect(prioritized[2].filePath).toBe('test.test.ts');
    expect(prioritized[2].category).toBe('TEST');
  });

  test('Fase 2: ContextBudgetManager aplica degradación adaptativa sobre no-targets', () => {
    const config: ContextBudgetConfig = {
      maxTokens: 30, // Extremadamente pequeño
      reservedTokens: 5,
      maxChunks: 2
    };

    const slices: any[] = [
      { filePath: 'target.ts', content: 'class Target {}', level: 'FULL', size: 15, priority: 100, category: 'TARGET' },
      { filePath: 'dep.ts', content: 'class Dep { run()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }', level: 'FULL', size: 50, priority: 85, category: 'DIRECT_DEPENDENCY' }
    ];

    const baseTemplate = { task: 'test', target: { files: ['target.ts'] } };
    const result = ContextBudgetManager.enforce(slices, config, sandboxDir, baseTemplate);

    // El dep.ts debió degradarse a STRUCTURAL, SIGNATURE o MINIMAL para achicar los tokens
    expect(result.degradations.length).toBeGreaterThan(0);
    const depDegradation = result.degradations.find(d => d.filePath === 'dep.ts');
    expect(depDegradation).toBeDefined();
    expect(result.slices.find(s => s.filePath === 'dep.ts')?.level).not.toBe('FULL');
  });

  test('Fase 3: ContextChunker agrupa y pagina chunks controladamente', () => {
    const chunker = new ContextChunker(sandboxDir);
    chunker.clear();

    const config: ContextBudgetConfig = {
      maxTokens: 50,
      reservedTokens: 10,
      maxChunks: 3
    };

    const slices: any[] = [
      { filePath: 'target.ts', content: 'class Target { a()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }', level: 'FULL', size: 10, priority: 100, category: 'TARGET' },
      { filePath: 'dep.ts', content: 'class Dep { b()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } }', level: 'FULL', size: 80, priority: 85, category: 'DIRECT_DEPENDENCY' }
    ];

    const baseTemplate = { task: 'test' };
    const chunkResult = chunker.chunk(slices, config, 'fingerprint-123', baseTemplate);

    expect(chunkResult.totalChunks).toBeGreaterThanOrEqual(1);
    
    if (chunkResult.hasMore)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });
});
