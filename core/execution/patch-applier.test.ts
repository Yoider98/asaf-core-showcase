import * as fs from 'fs';
import * as path from 'path';
import { PatchApplier } from './patch-applier';
import { FileOperation } from './file-operation';
import { LockManager } from './lock-manager';

describe('PatchApplier Tests (INV-009 & INV-013)', () => {
  const tempDir = path.resolve(__dirname, 'temp_patch_project');
  let patchApplier: PatchApplier;
  let fileOp: FileOperation;
  let lockManager: LockManager;
  const sessionId = 'session_patch_1';
  const expiresAt = new Date(Date.now() + 10000).toISOString();

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    patchApplier = new PatchApplier(tempDir);
    fileOp = new FileOperation(tempDir);
    lockManager = new LockManager(tempDir);
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
    // Limpiar locks y archivos temporales
    const locksDir = path.join(tempDir, '.asaf', 'locks');
    if (fs.existsSync(locksDir)) {
      try {
        fs.rmSync(locksDir, { recursive: true, force: true });
      } catch (e)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
    }
    fs.mkdirSync(path.join(tempDir, '.asaf', 'locks'), { recursive: true });

    // Eliminar archivos creados
    const testFile = path.join(tempDir, 'src', 'code.ts');
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  test('should apply CREATE patch and return content hash', () => {
    const patch = {
      filePath: 'src/code.ts',
      action: 'CREATE' as const,
      expectedHashBefore: null,
      content: 'const a = 1;'
    };

    const nextHash = patchApplier.applyPatch(sessionId, patch, expiresAt);
    expect(nextHash).toBe(patchApplier.calculateHash(patch.content));
    expect(fileOp.existsSync(patch.filePath)).toBe(true);
    expect(fileOp.readFileSync(patch.filePath)).toBe(patch.content);
  });

  test('should throw conflict on CREATE if file already exists', () => {
    fileOp.writeFileSync('src/code.ts', 'existing');

    const patch = {
      filePath: 'src/code.ts',
      action: 'CREATE' as const,
      expectedHashBefore: null,
      content: 'const a = 1;'
    };

    expect(() => {
      patchApplier.applyPatch(sessionId, patch, expiresAt);
    }).toThrow(/already exists. Cannot execute CREATE/);
  });

  test('should apply MODIFY patch if pre-condition hash matches', () => {
    const originalContent = 'const val = 10;';
    fileOp.writeFileSync('src/code.ts', originalContent);
    const expectedHashBefore = patchApplier.calculateHash(originalContent);

    const patch = {
      filePath: 'src/code.ts',
      action: 'MODIFY' as const,
      expectedHashBefore,
      content: 'const val = 20;'
    };

    const nextHash = patchApplier.applyPatch(sessionId, patch, expiresAt);
    expect(nextHash).toBe(patchApplier.calculateHash(patch.content));
    expect(fileOp.readFileSync(patch.filePath)).toBe(patch.content);
  });

  test('should throw EXECUTION_CONFLICT on MODIFY if pre-condition hash mismatches (INV-009)', () => {
    const originalContent = 'const val = 10;';
    fileOp.writeFileSync('src/code.ts', originalContent);
    const wrongHashBefore = 'wronghash123';

    const patch = {
      filePath: 'src/code.ts',
      action: 'MODIFY' as const,
      expectedHashBefore: wrongHashBefore,
      content: 'const val = 20;'
    };

    expect(() => {
      patchApplier.applyPatch(sessionId, patch, expiresAt);
    }).toThrow(/has been modified externally/);
  });

  test('should apply DELETE patch if pre-condition hash matches', () => {
    const originalContent = 'const val = 10;';
    fileOp.writeFileSync('src/code.ts', originalContent);
    const expectedHashBefore = patchApplier.calculateHash(originalContent);

    const patch = {
      filePath: 'src/code.ts',
      action: 'DELETE' as const,
      expectedHashBefore
    };

    const nextHash = patchApplier.applyPatch(sessionId, patch, expiresAt);
    expect(nextHash).toBeNull();
    expect(fileOp.existsSync(patch.filePath)).toBe(false);
  });

  test('should throw conflict on execution if file is locked by other session', () => {
    const filePath = 'src/code.ts';
    // Bloquear archivo desde otra sesión
    lockManager.acquireLock('other_session', filePath, expiresAt);

    const patch = {
      filePath,
      action: 'CREATE' as const,
      expectedHashBefore: null,
      content: 'const a = 1;'
    };

    expect(() => {
      patchApplier.applyPatch(sessionId, patch, expiresAt);
    }).toThrow(/is locked by another active session/);
  });
});
