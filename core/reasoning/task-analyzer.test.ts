import { TaskAnalyzer } from './task-analyzer';

describe('TaskAnalyzer', () => {
  test('1. Debería manejar tareas vacías o nulas', () => {
    const result = TaskAnalyzer.analyze('');
    expect(result.task).toBe('');
    expect(result.action).toBe('UNKNOWN');
    expect(result.concepts).toEqual([]);
    expect(result.confidence).toBe(0);
  });

  test('2. Debería detectar acción CREATE', () => {
    const result = TaskAnalyzer.analyze('Agregar un nuevo endpoint de login');
    expect(result.action).toBe('CREATE');
  });

  test('3. Debería detectar acción UPDATE', () => {
    const result = TaskAnalyzer.analyze('Modificar el esquema de base de datos de usuarios');
    expect(result.action).toBe('UPDATE');
  });

  test('4. Debería detectar acción DELETE', () => {
    const result = TaskAnalyzer.analyze('Eliminar controlador obsoleto de pagos');
    expect(result.action).toBe('DELETE');
  });

  test('5. Debería detectar acción REFACTOR', () => {
    const result = TaskAnalyzer.analyze('Refactorizar la estructura de carpetas de la API');
    expect(result.action).toBe('REFACTOR');
  });

  test('6. Debería detectar acción FIX', () => {
    const result = TaskAnalyzer.analyze('Arreglar bug de concurrencia en la autenticación jwt');
    expect(result.action).toBe('FIX');
  });

  test('7. Debería clasificar como UNKNOWN si no hay verbo reconocible', () => {
    const result = TaskAnalyzer.analyze('Estudio de la arquitectura del proyecto');
    expect(result.action).toBe('UNKNOWN');
  });

  test('8. Debería extraer conceptos excluyendo stopwords', () => {
    const result = TaskAnalyzer.analyze('Crear un servicio para gestionar las facturas de clientes');
    expect(result.concepts).toContain('servicio');
    expect(result.concepts).toContain('gestionar');
    expect(result.concepts).toContain('facturas');
    expect(result.concepts).toContain('clientes');
    expect(result.concepts).not.toContain('un');
    expect(result.concepts).not.toContain('para');
    expect(result.concepts).not.toContain('las');
    expect(result.concepts).not.toContain('de');
  });

  test('9. Debería detectar el área técnica auth', () => {
    const result = TaskAnalyzer.analyze('Añadir login seguro con token JWT');
    expect(result.technicalAreas).toContain('auth');
  });

  test('10. Debería detectar el área técnica api', () => {
    const result = TaskAnalyzer.analyze('Crear una ruta GET en el controlador de productos');
    expect(result.technicalAreas).toContain('api');
  });

  test('11. Debería detectar el área técnica database', () => {
    const result = TaskAnalyzer.analyze('Migración de base de datos Postgres para la entidad User');
    expect(result.technicalAreas).toContain('database');
  });

  test('12. Debería detectar el área técnica ui', () => {
    const result = TaskAnalyzer.analyze('Diseñar componente React de login con estilos CSS');
    expect(result.technicalAreas).toContain('ui');
  });

  test('13. Debería detectar el área técnica testing', () => {
    const result = TaskAnalyzer.analyze('Escribir test unitario de cobertura para el service');
    expect(result.technicalAreas).toContain('testing');
  });

  test('14. Debería extraer nombres de archivos explícitos con extensiones', () => {
    const result = TaskAnalyzer.analyze('Modificar el archivo src/auth/auth.service.ts y testear en auth.spec.ts');
    expect(result.probableArtifacts).toContain('src/auth/auth.service.ts');
    expect(result.probableArtifacts).toContain('auth.spec.ts');
  });

  test('15. Debería deducir artefactos probables heurísticamente si no hay explícitos', () => {
    const result = TaskAnalyzer.analyze('Crear el módulo de facturación');
    expect(result.probableArtifacts).toContain('facturación');
    expect(result.probableArtifacts).toContain('facturación.controller');
    expect(result.probableArtifacts).toContain('facturación.service');
  });

  test('16. Debería calcular confianza basada en la cantidad de metadatos extraídos', () => {
    const resultComplete = TaskAnalyzer.analyze('Crear api para base de datos en sql.ts');
    const resultIncomplete = TaskAnalyzer.analyze('Algo');
    expect(resultComplete.confidence).toBeGreaterThan(resultIncomplete.confidence);
  });
});
