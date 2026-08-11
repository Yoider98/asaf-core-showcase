import * as fs from 'fs';
import * as path from 'path';
import { LockManager } from './lock-manager';

describe('LockManager Concurrency Tests (INV-013)', () => {
  const tempDir = path.resolve(__dirname, 'temp_lock_project');
  let lockManager: LockManager;

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
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
    // Limpiar directorio de locks antes de cada test
    const locksDir = path.join(tempDir, '.asaf', 'locks');
    if (fs.existsSync(locksDir)) {
      const files = fs.readdirSync(locksDir);
      for (const file of files)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
    }
  });

  test('should acquire and release lock successfully', () => {
    const sessionId = 'session_1';
    const filePath = 'src/service.ts';
    const expiresAt = new Date(Date.now() + 5000).toISOString();

    const acquired = lockManager.acquireLock(sessionId, filePath, expiresAt);
    expect(acquired).toBe(true);

    // Reentrante para la misma sesión
    const reentered = lockManager.acquireLock(sessionId, filePath, expiresAt);
    expect(reentered).toBe(true);

    // Liberar
    lockManager.releaseLock(sessionId, filePath);
    
    // Otra sesión debería poder adquirirlo ahora
    const acquiredByOther = lockManager.acquireLock('session_2', filePath, expiresAt);
    expect(acquiredByOther).toBe(true);
  });

  test('should deny lock acquisition if active for another session', () => {
    const filePath = 'src/controller.ts';
    const expiresAt = new Date(Date.now() + 5000).toISOString();

    const s1Acquired = lockManager.acquireLock('session_1', filePath, expiresAt);
    expect(s1Acquired).toBe(true);

    const s2Acquired = lockManager.acquireLock('session_2', filePath, expiresAt);
    expect(s2Acquired).toBe(false);
  });

  test('should clean expired locks', async () => {
    const filePath = 'src/stale.ts';
    // Expira en el pasado
    const expiresAt = new Date(Date.now() - 1000).toISOString();

    // Adquiere lock expirado
    const s1Acquired = lockManager.acquireLock('session_1', filePath, expiresAt);
    expect(s1Acquired).toBe(true);

    // Limpieza
    lockManager.cleanExpiredLocks();

    // session_2 debería poder adquirirlo ahora porque expiró y fue limpiado
    const s2Acquired = lockManager.acquireLock('session_2', filePath, new Date(Date.now() + 5000).toISOString());
    expect(s2Acquired).toBe(true);
  });

  test('should release all locks for a session', () => {
    const sessionId = 'session_1';
    const file1 = 'src/f1.ts';
    const file2 = 'src/f2.ts';
    const expiresAt = new Date(Date.now() + 5000).toISOString();

    lockManager.acquireLock(sessionId, file1, expiresAt);
    lockManager.acquireLock(sessionId, file2, expiresAt);

    // Liberar todos
    lockManager.releaseAllLocks(sessionId);

    // s2 puede adquirir ambos
    expect(lockManager.acquireLock('session_2', file1, expiresAt)).toBe(true);
    expect(lockManager.acquireLock('session_2', file2, expiresAt)).toBe(true);
  });
});
