import * as fs from 'fs';
import * as path from 'path';
import { SpecsEngine } from '../core/specs';

describe('Specs & Indexing E2E Tests', () => {
  const testDir = path.join(__dirname, 'temp_test_project');
  const specsDir = path.join(testDir, 'docs', 'specs');
  let engine: SpecsEngine;

  beforeAll(() => {
    // Inicializar un directorio de proyecto de prueba
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    engine = new SpecsEngine(testDir);
  });

  afterAll(() => {
    // Limpieza
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('debería generar una especificación de módulo completa y registrar las funciones con análisis de seguridad', () => {
    const relativeModulePath = 'math.ts';
    const moduleContent = `
      /**
       * Suma dos números con seguridad básica.
       */
      export function sum(a: number, b: number): number  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

      export function insecureExec(command: string)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
    `;
    fs.writeFileSync(path.join(testDir, relativeModulePath), moduleContent, 'utf-8');

    engine.analyzeAndGenerateSpec(relativeModulePath);

    const specFile = path.join(specsDir, 'math.spec.md');
    expect(fs.existsSync(specFile)).toBe(true);

    const content = fs.readFileSync(specFile, 'utf-8');
    expect(content).toContain('# Especificación del Módulo: math');
    expect(content).toContain('## Función/Método: `sum`');
    expect(content).toContain('Suma dos números con seguridad básica.');
  });

  it('debería generar y actualizar el índice maestro README.md con la información recopilada', () => {
    engine.updateSpecsIndex();
    const indexFile = path.join(specsDir, 'README.md');
    expect(fs.existsSync(indexFile)).toBe(true);

    const content = fs.readFileSync(indexFile, 'utf-8');
    expect(content).toContain('# Índice Maestro de Especificaciones ASAF');
    expect(content).toContain('| **math** |');
  });
});
