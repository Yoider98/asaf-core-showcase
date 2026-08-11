import * as fs from 'fs';
import * as path from 'path';
import { ExecutionJournal } from './execution-journal';
import { FileOperation } from './file-operation';

describe('ExecutionJournal Tests (INV-006 & INV-012)', () => {
  const tempDir = path.resolve(__dirname, 'temp_journal_project');
  let fileOp: FileOperation;
  const sessionId = 'session_journal_123';

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

  beforeEach(() => {
    // Eliminar carpeta de snapshots del journal para la sesión
    const snapshotDir = path.join(tempDir, '.asaf', 'snapshots', `exec_${sessionId}`);
    if (fs.existsSync(snapshotDir)) {
      fs.rmSync(snapshotDir, { recursive: true, force: true });
    }

    // Limpiar archivos de prueba
    if (fileOp.existsSync('src/code.ts')) {
      fileOp.deleteFileSync('src/code.ts');
    }
    if (fileOp.existsSync('src/other.ts')) {
      fileOp.deleteFileSync('src/other.ts');
    }
  });

  test('should backup existing files and write journal.json', () => {
    const file = 'src/code.ts';
    const content = 'original content';
    fileOp.writeFileSync(file, content);

    const journal = new ExecutionJournal(tempDir, sessionId);
    journal.backupFile(file, 'MODIFY');

    // Verificar que existe la copia de seguridad
    const snapshotDir = path.join(tempDir, '.asaf', 'snapshots', `exec_${sessionId}`);
    expect(fs.existsSync(snapshotDir)).toBe(true);
    expect(fs.existsSync(path.join(snapshotDir, 'journal.json'))).toBe(true);

    const entries = journal.getEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].path).toBe(file);
    expect(entries[0].operation).toBe('MODIFY');
    expect(entries[0].hashBefore).not.toBeNull();
  });

  test('should perform rollback restoring modified files and deleting created ones (INV-006)', () => {
    const fileModify = 'src/code.ts';
    const contentModify = 'original content modify';
    fileOp.writeFileSync(fileModify, contentModify);

    const journal = new ExecutionJournal(tempDir, sessionId);

    // Registrar MODIFY
    journal.backupFile(fileModify, 'MODIFY');
    fileOp.writeFileSync(fileModify, 'modified content');

    // Registrar CREATE
    const fileCreate = 'src/other.ts';
    journal.backupFile(fileCreate, 'CREATE');
    fileOp.writeFileSync(fileCreate, 'new code');

    // Verificar que están en disco modificados y creados
    expect(fileOp.readFileSync(fileModify)).toBe('modified content');
    expect(fileOp.existsSync(fileCreate)).toBe(true);

    // Disparar Rollback
    const result = journal.rollback();
    expect(result.restored).toContain(fileModify);
    expect(result.deleted).toContain(fileCreate);

    // Comprobar restauración
    expect(fileOp.readFileSync(fileModify)).toBe(contentModify);
    expect(fileOp.existsSync(fileCreate)).toBe(false);

    // La carpeta de snapshots debe haber sido eliminada tras finalizar
    const snapshotDir = path.join(tempDir, '.asaf', 'snapshots', `exec_${sessionId}`);
    expect(fs.existsSync(snapshotDir)).toBe(false);
  });
});
