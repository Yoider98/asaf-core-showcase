import * as fs from 'fs';
import * as path from 'path';
import { HandoverEngine } from './handover';

describe('HandoverEngine Tests', () => {
  const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'handover_test');

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('debe generar el paquete de entrega final completo en docs/handover/', () => {
    const engine = new HandoverEngine(testDir);
    const files = engine.generateHandoverPackage({
      clientName: 'Cliente Corporativo Inc.',
      projectName: 'Proyecto E-Commerce Flutter',
      version: '1.2.0',
      author: 'ASAF Tech Team'
    });

    expect(files.length).toBe(6);

    const handoverDir = path.join(testDir, 'docs', 'handover');
    expect(fs.existsSync(path.join(handoverDir, '01_ACTA_DE_ENTREGA_Y_ACEPTACION.md'))).toBe(true);
    expect(fs.existsSync(path.join(handoverDir, '02_RESUMEN_EJECUTIVO_Y_TRAZABILIDAD.md'))).toBe(true);
    expect(fs.existsSync(path.join(handoverDir, '03_MANUAL_DE_ARQUITECTURA_Y_CODIGO.md'))).toBe(true);
    expect(fs.existsSync(path.join(handoverDir, '04_GUIA_DE_DESPLIEGUE_Y_OPERACION.md'))).toBe(true);
    expect(fs.existsSync(path.join(handoverDir, '05_CERTIFICADO_DE_CALIDAD_Y_SEGURIDAD.md'))).toBe(true);
    expect(fs.existsSync(path.join(handoverDir, 'README.md'))).toBe(true);

    const actaContent = fs.readFileSync(path.join(handoverDir, '01_ACTA_DE_ENTREGA_Y_ACEPTACION.md'), 'utf-8');
    expect(actaContent).toContain('Cliente Corporativo Inc.');
    expect(actaContent).toContain('Proyecto E-Commerce Flutter');
  });
});
