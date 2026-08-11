import * as fs from 'fs';
import * as path from 'path';
import { FileOperation } from './file-operation';

jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    realpathSync: jest.fn(originalFs.realpathSync)
  };
});

describe('FileOperation Security Tests', () => {
  const tempDir = path.resolve(__dirname, 'temp_project_root');
  let fileOp: FileOperation;

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fileOp = new FileOperation(tempDir);
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

  test('should write and read valid file within project root', () => {
    const testFile = 'src/test.txt';
    const content = 'Hello ASAF';
    fileOp.writeFileSync(testFile, content);

    expect(fileOp.existsSync(testFile)).toBe(true);
    expect(fileOp.readFileSync(testFile)).toBe(content);

    fileOp.deleteFileSync(testFile);
    expect(fileOp.existsSync(testFile)).toBe(false);
  });

  test('should throw error when accessing file outside project root (INV-010)', () => {
    const outsideFile = '../outside_file.txt';

    expect(() => {
      fileOp.writeFileSync(outsideFile, 'dangerous data');
    }).toThrow(/Security Violation/);

    expect(() => {
      fileOp.readFileSync(outsideFile);
    }).toThrow(/Security Violation/);

    expect(() => {
      fileOp.deleteFileSync(outsideFile);
    }).toThrow(/Security Violation/);
  });

  test('should prevent symlink escape (INV-014)', () => {
    const safeDir = path.join(tempDir, 'safe');
    const linkPath = path.join(tempDir, 'fake_link');
    const outsideTarget = path.resolve(tempDir, '../outside_dir');

    if (!fs.existsSync(safeDir)) {
      fs.mkdirSync(safeDir);
    }
    if (!fs.existsSync(outsideTarget)) {
      fs.mkdirSync(outsideTarget);
    }

    // Intentamos crear un symlink real. Si falla (por falta de privilegios en Windows),
    // mockeamos fs.realpathSync para ese test.
    let linkCreated = false;
    let tempDirCreatedForLink = false;
    try {
      fs.symlinkSync(outsideTarget, linkPath, 'dir');
      linkCreated = true;
    } catch (e)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
        const originalFs = jest.requireActual('fs');
        return originalFs.realpathSync(p);
      });
    }

    try {
      expect(() => {
        fileOp.resolveAndValidatePath('fake_link/target.txt');
      }).toThrow(/Security Violation/);
    } finally {
      if (linkCreated)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } else {
        if (tempDirCreatedForLink)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
        const originalFs = jest.requireActual('fs');
        (fs.realpathSync as unknown as jest.Mock).mockImplementation(originalFs.realpathSync);
      }
      fs.rmSync(outsideTarget, { recursive: true, force: true });
    }
  });
});
