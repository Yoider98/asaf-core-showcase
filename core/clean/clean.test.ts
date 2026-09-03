import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CleanEngine } from './clean-engine';
import { DependencyGraph } from '../../discovery';

describe('CleanEngine Unit Tests', () => {
  let tmpDir: string;
  let cleanEngine: CleanEngine;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asaf-clean-test-'));
    
    // Crear archivos de prueba
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), 'import { used } from "./used";\nused();');
    fs.writeFileSync(path.join(tmpDir, 'src', 'used.ts'), 'export function used()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }');
    fs.writeFileSync(path.join(tmpDir, 'src', 'orphan.ts'), 'export function deadCode()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }');
    fs.writeFileSync(path.join(tmpDir, 'debug.log'), 'test log content');

    cleanEngine = new CleanEngine(tmpDir);
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('Should detect orphan files and bloat files in audit mode', () => {
    const mockGraph: DependencyGraph = {
      nodes: {
        'src/index.ts': {
          id: 'src/index.ts',
          type: 'file',
          imports: ['./used'],
          classes: []
        },
        'src/used.ts': {
          id: 'src/used.ts',
          type: 'file',
          imports: [],
          classes: []
        },
        'src/orphan.ts': {
          id: 'src/orphan.ts',
          type: 'file',
          imports: [],
          classes: []
        }
      },
      metadata: {
        projectPath: tmpDir,
        detectedLanguages: ['TypeScript'],
        dependencies: {},
        devDependencies: {}
      }
    };

    const report = cleanEngine.runAudit(mockGraph);

    expect(report.orphanFiles).toContain('src/orphan.ts');
    expect(report.orphanFiles).not.toContain('src/index.ts');
    expect(report.orphanFiles).not.toContain('src/used.ts');
    expect(report.bloatFiles.some(b => b.file === 'debug.log')).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'docs', 'cleanup-report.md'))).toBe(true);
  });

  test('Should move orphan files to quarantine and restore them cleanly', () => {
    const mockGraph: DependencyGraph = {
      nodes: {
        'src/index.ts': { id: 'src/index.ts', type: 'file', imports: ['./used'], classes: [] },
        'src/used.ts': { id: 'src/used.ts', type: 'file', imports: [], classes: [] },
        'src/orphan.ts': { id: 'src/orphan.ts', type: 'file', imports: [], classes: [] }
      },
      metadata: { projectPath: tmpDir, detectedLanguages: ['TypeScript'], dependencies: {}, devDependencies: {} }
    };

    // Forzar auditoría previa
    cleanEngine.runAudit(mockGraph);

    // Ejecutar cuarentena
    const { sessionId, quarantinedFiles } = cleanEngine.quarantine(['src/orphan.ts']);

    expect(quarantinedFiles).toContain('src/orphan.ts');
    expect(fs.existsSync(path.join(tmpDir, 'src', 'orphan.ts'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, '.asaf', 'quarantine', sessionId, 'session.json'))).toBe(true);

    // Restaurar
    const { restoredFiles, status } = cleanEngine.restore(sessionId);
    expect(status).toBe('RESTORED');
    expect(restoredFiles).toContain('src/orphan.ts');
    expect(fs.existsSync(path.join(tmpDir, 'src', 'orphan.ts'))).toBe(true);
  });
});
