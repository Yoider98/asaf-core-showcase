import * as fs from 'fs';
import * as path from 'path';
import { AuditEngine } from '../core/audit';
import { TokenSaverEngine } from '../core/tokenSaver';

describe('Audit & TokenSaver E2E Tests', () => {
  const testDir = path.join(__dirname, 'temp_audit_project');
  let auditEngine: AuditEngine;
  let tokenSaver: TokenSaverEngine;

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    auditEngine = new AuditEngine(testDir);
    tokenSaver = new TokenSaverEngine(testDir);
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('debería detectar brechas de seguridad e ineficiencias de base de datos en los archivos del proyecto', () => {
    const dbFile = 'database.ts';
    const dbContent = `
      export function getUsers()  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

      export function batchGetUsers(ids: number[])  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } });
      }
    `;
    fs.writeFileSync(path.join(testDir, dbFile), dbContent, 'utf-8');

    const htmlFile = 'index.html';
    const htmlContent = `
      <html>
        <head></head>
        <body>
          <h1>Título 1</h1>
          <h1>Título 2 duplicado</h1>
        </body>
      </html>
    `;
    fs.writeFileSync(path.join(testDir, htmlFile), htmlContent, 'utf-8');

    const breaches = auditEngine.runAudit([dbFile, htmlFile]);

    // Verificar reporte
    const reportFile = path.join(testDir, 'docs', 'audit-report.md');
    expect(fs.existsSync(reportFile)).toBe(true);

    const reportContent = fs.readFileSync(reportFile, 'utf-8');
    expect(reportContent).toContain('SELECT * FROM');
    expect(reportContent).toContain('etiquetas <h1> detectadas');
  });

  it('debería calcular e identificar cambios incrementales usando TokenSaverEngine', () => {
    const file = 'moduleA.ts';
    const content = 'export const val = 42;';
    
    // Primer análisis
    const needsAnalysis1 = tokenSaver.checkNeedsAnalysis(file, content);
    expect(needsAnalysis1).toBe(true);
    tokenSaver.saveHashes();

    // Segundo análisis sin cambios
    const needsAnalysis2 = tokenSaver.checkNeedsAnalysis(file, content);
    expect(needsAnalysis2).toBe(false); // No ha cambiado, no requiere análisis
  });
});
