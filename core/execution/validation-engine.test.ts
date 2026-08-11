import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ValidationEngine, ValidationContext } from './validation-engine';
import { FileOperation } from './file-operation';

jest.mock('child_process');

describe('ValidationEngine Tests', () => {
  const tempDir = path.resolve(__dirname, 'temp_validation_project');
  let fileOp: FileOperation;
  let validationEngine: ValidationEngine;
  const sessionId = 'session_val_1';

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fileOp = new FileOperation(tempDir);
    validationEngine = new ValidationEngine(tempDir);
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
    }
  });

  beforeEach(() => {
    jest.resetAllMocks();
    // Limpiar archivos de prueba
    if (fileOp.existsSync('src/code.ts')) {
      fileOp.deleteFileSync('src/code.ts');
    }
    if (fileOp.existsSync('src/unrelated.ts')) {
      fileOp.deleteFileSync('src/unrelated.ts');
    }
  });

  test('should pass validation when expected files match and compile succeeds', async () => {
    const file = 'src/code.ts';
    fileOp.writeFileSync(file, 'const val = 1;');
    
    const beforeHashes = {
      [file]: 'somehash123'
    };

    // Actualizar hash para que detecte modificación en la validación
    const content = fileOp.readFileSync(file);
    const mockHash = require('crypto').createHash('sha256').update(content).digest('hex');
    beforeHashes[file] = 'differenthash';

    (execSync as jest.Mock).mockReturnValue(''); // Simular compilación y tests exitosos

    const context: ValidationContext = {
      sessionId,
      before: {
        hashes: beforeHashes,
        violations: []
      },
      expectedChanges: [file]
    };

    const result = await validationEngine.validate(context);
    expect(result.passed).toBe(true);
    expect(result.checks.build).toBe(true);
    expect(result.checks.tests).toBe(true);
    expect(result.checks.scope).toBe(true);
  });

  test('should fail scope check (INV-007) when an undeclared file is modified physically', async () => {
    const file1 = 'src/code.ts';
    const file2 = 'src/unrelated.ts';
    fileOp.writeFileSync(file1, 'const val = 1;');
    fileOp.writeFileSync(file2, 'const other = 2;');

    const beforeHashes = {
      [file1]: 'differenthash1',
      [file2]: 'differenthash2'
    };

    const context: ValidationContext = {
      sessionId,
      before: {
        hashes: beforeHashes,
        violations: []
      },
      expectedChanges: [file1] // Sólo esperamos cambios en file1, pero file2 también cambió
    };

    const result = await validationEngine.validate(context);
    expect(result.passed).toBe(false);
    expect(result.checks.scope).toBe(false);
    expect(result.errors.some(e => e.includes('Scope safety violation'))).toBe(true);
  });

  test('should fail build and tests checks if compile/test tools throw error', async () => {
    const file = 'src/code.ts';
    fileOp.writeFileSync(file, 'const val = 1;');

    const beforeHashes = {
      [file]: 'differenthash'
    };

    // Forzar fallos en child_process
    (execSync as jest.Mock).mockImplementation((cmd: string) => {
      if (cmd.includes('tsc')) {
        throw new Error('Compilation Error');
      }
      if (cmd.includes('jest')) {
        throw new Error('Test Failures');
      }
      return '';
    });

    // Simular existencia de tsconfig
    const tsconfigPath = path.join(tempDir, 'tsconfig.json');
    fs.writeFileSync(tsconfigPath, '{}');

    const context: ValidationContext = {
      sessionId,
      before: {
        hashes: beforeHashes,
        violations: []
      },
      expectedChanges: [file]
    };

    try {
      const result = await validationEngine.validate(context);
      expect(result.passed).toBe(false);
      expect(result.checks.build).toBe(false);
      expect(result.checks.tests).toBe(false);
    } finally {
      fs.unlinkSync(tsconfigPath);
    }
  });
});
