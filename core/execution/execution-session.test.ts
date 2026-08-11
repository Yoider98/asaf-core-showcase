import * as fs from 'fs';
import * as path from 'path';
import { ExecutionSessionManager } from './execution-session';
import { LockManager } from './lock-manager';

describe('ExecutionSessionManager Tests', () => {
  const tempDir = path.resolve(__dirname, 'temp_sessions_project');
  let manager: ExecutionSessionManager;
  let lockManager: LockManager;

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    manager = new ExecutionSessionManager(tempDir);
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
    // Limpiar sesiones
    const sessionsDir = path.join(tempDir, '.asaf', 'sessions');
    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir);
      for (const file of files)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
    }
    // Limpiar locks
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

  test('should create and load session', () => {
    const session = manager.createSession('MEDIUM', 50, false);
    expect(session.sessionId).toBeDefined();
    expect(session.status).toBe('CREATED');
    expect(session.riskLevel).toBe('MEDIUM');
    expect(session.dryRun).toBe(false);

    const loaded = manager.loadSession(session.sessionId);
    expect(loaded).not.toBeNull();
    expect(loaded?.sessionId).toBe(session.sessionId);
  });

  test('should expire session and release locks', () => {
    const session = manager.createSession('HIGH', 70, false);
    
    // Adquirir un lock para la sesión
    lockManager.acquireLock(session.sessionId, 'src/code.ts', session.expiresAt);

    // Forzar expiración editando el archivo de sesión directamente en disco
    const filePath = path.join(tempDir, '.asaf', 'sessions', `exec_${session.sessionId}.json`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    parsed.expiresAt = new Date(Date.now() - 1000).toISOString(); // Expira en el pasado
    fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');

    // Cargar sesión (debería disparar expiración)
    const loaded = manager.loadSession(session.sessionId);
    expect(loaded?.status).toBe('ROLLED_BACK');
    expect(loaded?.rollbackAvailable).toBe(false);

    // El lock debería haber sido liberado
    const otherAcquired = lockManager.acquireLock('session_other', 'src/code.ts', new Date(Date.now() + 5000).toISOString());
    expect(otherAcquired).toBe(true);
  });
});
