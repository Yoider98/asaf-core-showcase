import * as fs from 'fs';
import * as path from 'path';
import { AuditEngine } from './audit';

describe('AuditEngine - Security, Privacy and Malware Surface Tests', () => {
  const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'security_test');

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Archivo Flutter/Dart vulnerable a fuga de PII y SharedPreferences no cifrado
    fs.writeFileSync(
      path.join(testDir, 'sample_auth.dart'),
      `
      import 'package:shared_preferences/SharedPreferences.dart';
      void loginUser(String email, String password, String token)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  });
      }
      `,
      'utf-8'
    );

    // Archivo TS con eval(), secretos hardcoded y consulta SQL concatenada
    fs.writeFileSync(
      path.join(testDir, 'vulnerable_service.ts'),
      `
      const api_key = "secret_api_key_12345678";
      function executeCode(code: string)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
      function getUser(id: string)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
      `,
      'utf-8'
    );

    // Manifiesto Android con permisos inseguros
    fs.writeFileSync(
      path.join(testDir, 'AndroidManifest.xml'),
      `
      <manifest xmlns:android="http://schemas.android.com/apk/res/android">
        <application android:usesCleartextTraffic="true" android:allowBackup="true">
        </application>
      </manifest>
      `,
      'utf-8'
    );
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('debe detectar brechas de privacidad y almacenamiento no cifrado en Flutter/Dart', () => {
    const audit = new AuditEngine(testDir);
    const breaches = audit.runAudit(['sample_auth.dart']);

    const privacyBreaches = breaches.filter(b => b.type === 'privacidad');
    expect(privacyBreaches.length).toBeGreaterThan(0);
    expect(privacyBreaches.some(b => b.evidence.includes('PII'))).toBe(true);
    expect(privacyBreaches.some(b => b.evidence.includes('SharedPreferences'))).toBe(true);
  });

  it('debe detectar eval(), secretos hardcoded y consultas SQL concatenadas', () => {
    const audit = new AuditEngine(testDir);
    const breaches = audit.runAudit(['vulnerable_service.ts']);

    const secBreaches = breaches.filter(b => b.type === 'seguridad');
    expect(secBreaches.some(b => b.evidence.includes('eval'))).toBe(true);
    expect(secBreaches.some(b => b.evidence.includes('Secretos'))).toBe(true);
    expect(secBreaches.some(b => b.evidence.includes('SQL'))).toBe(true);
  });

  it('debe detectar configuraciones inseguras en AndroidManifest.xml', () => {
    const audit = new AuditEngine(testDir);
    const breaches = audit.runAudit(['AndroidManifest.xml']);

    const surfaceBreaches = breaches.filter(b => b.type === 'malware_superficie' || b.type === 'privacidad');
    expect(surfaceBreaches.some(b => b.evidence.includes('usesCleartextTraffic'))).toBe(true);
  });
});
