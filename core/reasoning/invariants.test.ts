import { ArchitecturalReasoner } from './architectural-reasoner';
import { ProjectModel } from '../domain/project-model';

const mockProjectModel: ProjectModel = {
  project: {
    name: 'test-project',
    version: '1.0.0',
    path: 'D:/GitHub/ASAF'
  },
  indexMetadata: {
    schemaVersion: 1,
    indexerVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    diagnostics: []
  },
  files: [
    { path: 'src/auth/auth.service.ts', hash: 'h1', size: 100 },
    { path: 'src/auth/auth.controller.ts', hash: 'h2', size: 120 },
    { path: 'src/user/user.repository.ts', hash: 'h3', size: 150 },
    { path: 'src/auth/auth.service.spec.ts', hash: 'h4', size: 90 },
    { path: 'core/domain/entity.ts', hash: 'h5', size: 10 },
    { path: 'cli/index.ts', hash: 'h6', size: 10 }
  ],
  modules: [],
  symbols: [
    { id: 'symbol:AuthService', name: 'AuthService', type: 'class', filePath: 'src/auth/auth.service.ts', line: 1 },
    { id: 'symbol:AuthController', name: 'AuthController', type: 'class', filePath: 'src/auth/auth.controller.ts', line: 5 }
  ],
  relations: [
    { from: 'src/auth/auth.controller.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
    { from: 'src/auth/auth.service.ts', to: 'src/user/user.repository.ts', type: 'imports' },
    { from: 'src/auth/auth.service.spec.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
    { from: 'core/domain/entity.ts', to: 'cli/index.ts', type: 'imports' }, // violación
    { from: 'src/auth/auth.service.ts', to: 'adr:ADR-002', type: 'governed-by' }
  ],
  apis: [
    { method: 'POST', path: '/login', handlerSymbol: 'symbol:AuthController' }
  ],
  databases: [
    { file: 'src/user/user.repository.ts', table: 'users', operation: 'insert' }
  ],
  tests: [],
  dependencies: [],
  architecture: { layers: ['core/domain', 'cli'] },
  decisions: [
    { id: 'ADR-002', title: 'Autenticación', status: 'deprecated', file: 'docs/adr/002.md' }
  ],
  git: {
    indexedCommit: 'c1',
    headCommit: 'c1',
    changedFilesSinceLastIndex: [],
    indexTimestamp: new Date().toISOString(),
    isDirty: false
  }
};

describe('Invariantes y Regresión v0.2.8', () => {
  const reasoner = new ArchitecturalReasoner(mockProjectModel);

  test('1. Invariante de Evidencia: Toda recomendación emitida debe tener evidencia no vacía', async () => {
    const plan = await reasoner.plan('Verificar violaciones de arquitectura en core/domain/entity.ts y src/auth/auth.service.ts', {
      explicitFiles: ['core/domain/entity.ts', 'src/auth/auth.service.ts']
    });

    expect(plan.recommendations.length).toBeGreaterThan(0);
    plan.recommendations.forEach(rec => {
      expect(rec.evidence).toBeDefined();
      expect(rec.evidence.length).toBeGreaterThan(0);
      
      // Comprobar que cada evidencia del array tiene los campos base
      rec.evidence.forEach(ev => {
        expect(ev.type).toBeDefined();
        expect(ev.description).toBeDefined();
      });
    });
  });

  test('2. Invariante de Evidencia: Si una recomendación no tiene evidencia asociada, se descarta y no se emite', async () => {
    const plan = await reasoner.plan('Modificar sin violaciones ni riesgos', {
      explicitFiles: ['src/auth/auth.service.spec.ts'] // no causará Fan-in, adr conflict ni gov rules
    });
    // No debería haber recomendaciones sobre gobernanza, ADRs ni Fan-in porque no hay evidencia de ello
    const badRec = plan.recommendations.find(
      r => r.id.includes('gov') || r.id.includes('adr') || r.id.includes('fan-in')
    );
    expect(badRec).toBeUndefined();
  });

  test('3. Invariante de Determinismo: Mismo proyecto, tarea, git y budget => JSON byte-por-byte idéntico en 5 ejecuciones consecutivas', async () => {
    const results: string[] = [];
    for (let i = 0; i < 5; i++)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  });
      results.push(JSON.stringify(plan));
    }

    // Comprobar que todas las ejecuciones produjeron exactamente el mismo string
    for (let i = 1; i < results.length; i++)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('4. Invariante de Determinismo: El ordenamiento del array de targets debe ser alfabético y estable', async () => {
    const plan = await reasoner.plan('Agregar', {
      explicitFiles: ['src/user/user.repository.ts', 'src/auth/auth.controller.ts'] // orden invertido
    });
    // Debe ordenarlos como: ['src/auth/auth.controller.ts', 'src/user/user.repository.ts']
    expect(plan.targets[0]).toBe('src/auth/auth.controller.ts');
    expect(plan.targets[1]).toBe('src/user/user.repository.ts');
  });

  test('5. Invariante de Determinismo: El ordenamiento de las recomendaciones debe ser por prioridad y luego por id', async () => {
    const plan = await reasoner.plan('Revisar core/domain/entity.ts y src/auth/auth.service.ts', {
      explicitFiles: ['core/domain/entity.ts', 'src/auth/auth.service.ts']
    });

    const isSorted = plan.recommendations.every((val, i, arr) => {
      if (!i) return true;
      const prio = arr[i - 1].priority - val.priority;
      if (prio !== 0) return prio < 0;
      return arr[i - 1].id.localeCompare(val.id) <= 0;
    });
    expect(isSorted).toBe(true);
  });

  test('6. Invariante de Determinismo: El ordenamiento de las evidencias de ChangePlan debe ser estable', async () => {
    const plan = await reasoner.plan('Revisar core/domain/entity.ts y src/auth/auth.service.ts', {
      explicitFiles: ['core/domain/entity.ts', 'src/auth/auth.service.ts']
    });

    const isSorted = plan.evidence.every((val, i, arr) => {
      if (!i) return true;
      const typeComp = arr[i - 1].type.localeCompare(val.type);
      if (typeComp !== 0) return typeComp < 0;
      return arr[i - 1].description.localeCompare(val.description) <= 0;
    });
    expect(isSorted).toBe(true);
  });

  test('7. Invariante de Determinismo: El ordenamiento de los ChangeItems en changes debe ser por prioridad y luego por path', async () => {
    const plan = await reasoner.plan('Modificar', {
      explicitFiles: ['src/user/user.repository.ts', 'src/auth/auth.controller.ts'],
      expandGraph: true
    });

    const isSorted = plan.changes.every((val, i, arr) => {
      if (!i) return true;
      const prio = arr[i - 1].priority - val.priority;
      if (prio !== 0) return prio < 0;
      return arr[i - 1].path.localeCompare(val.path) <= 0;
    });
    expect(isSorted).toBe(true);
  });

  test('8. Determinismo bajo diferentes budgets: La consistencia estructural debe mantenerse', async () => {
    const planLow = await reasoner.plan('Modificar auth.service', {
      explicitFiles: ['src/auth/auth.service.ts'],
      budget: 2000
    });
    const planHigh = await reasoner.plan('Modificar auth.service', {
      explicitFiles: ['src/auth/auth.service.ts'],
      budget: 15000
    });

    // Cambiará el presupuesto del AIContext de v0.2.7 e implicará diferente disponibilidad,
    // pero el plan y recomendaciones estructurales del changePlan deben ser lógicamente consistentes.
    expect(planLow.summary.riskScore).toBe(planHigh.summary.riskScore);
    expect(planLow.summary.complexity).toBe(planHigh.summary.complexity);
  });

  test('9. Regresión: v0.2.7 no debe verse afectado por el modulo reasoning', () => {
    // Verificar que UnifiedContextEngine siga disponible
    const { UnifiedContextEngine } = require('../context/context-engine');
    expect(UnifiedContextEngine).toBeDefined();
    const engine = new UnifiedContextEngine(mockProjectModel);
    expect(engine.buildContext).toBeDefined();
  });

  test('10. Invariante: Toda evidencia registrada debe tener trazabilidad de tipo', async () => {
    const plan = await reasoner.plan('Verificar', {
      explicitFiles: ['core/domain/entity.ts']
    });
    plan.evidence.forEach(ev => {
      expect(['graph_relation', 'git_change', 'semantic_match', 'governance_rule', 'adr_reference']).toContain(ev.type);
    });
  });
});
