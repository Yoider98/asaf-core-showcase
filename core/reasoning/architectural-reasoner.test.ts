import { ArchitecturalReasoner } from './architectural-reasoner';
import { ProjectModel } from '../domain/project-model';
import { TestImpactReport } from './test-impact-analyzer';

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
    { path: 'src/auth/auth.service.spec.ts', hash: 'h4', size: 90 }
  ],
  modules: [],
  symbols: [
    { id: 'symbol:AuthService', name: 'AuthService', type: 'class', filePath: 'src/auth/auth.service.ts', line: 1 },
    { id: 'symbol:AuthController', name: 'AuthController', type: 'class', filePath: 'src/auth/auth.controller.ts', line: 5 }
  ],
  relations: [
    { from: 'src/auth/auth.controller.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
    { from: 'src/auth/auth.service.ts', to: 'src/user/user.repository.ts', type: 'imports' },
    { from: 'src/auth/auth.service.spec.ts', to: 'src/auth/auth.service.ts', type: 'imports' }
  ],
  apis: [
    { method: 'POST', path: '/login', handlerSymbol: 'symbol:AuthController' }
  ],
  databases: [
    { file: 'src/user/user.repository.ts', table: 'users', operation: 'insert' }
  ],
  tests: [],
  dependencies: [],
  architecture: { layers: [] },
  decisions: [
    { id: 'ADR-002', title: 'Autenticación v2', status: 'accepted', file: 'docs/adr/002.md' }
  ],
  git: {
    indexedCommit: 'c1',
    headCommit: 'c1',
    changedFilesSinceLastIndex: [],
    indexTimestamp: new Date().toISOString(),
    isDirty: false
  }
};

describe('ArchitecturalReasoner', () => {
  const reasoner = new ArchitecturalReasoner(mockProjectModel);

  test('1. Debería generar un ChangePlan estructurado para una tarea válida', async () => {
    const plan = await reasoner.plan('Agregar login seguro', {
      explicitFiles: ['src/auth/auth.controller.ts']
    });
    expect(plan.task).toBe('Agregar login seguro');
    expect(plan.intent).toBeDefined();
    expect(plan.targets).toContain('src/auth/auth.controller.ts');
  });

  test('2. El plan de cambio debe contener el summary correcto', async () => {
    const plan = await reasoner.plan('Agregar login seguro', {
      explicitFiles: ['src/auth/auth.controller.ts']
    });
    expect(plan.summary.changeType).toBe('CREATE');
    expect(plan.summary.complexity).toBeDefined();
    expect(plan.summary.riskScore).toBeGreaterThanOrEqual(0);
  });

  test('3. Debería resolver targets semánticamente si no se provee entrada explícita', async () => {
    const plan = await reasoner.plan('Modificar el servicio auth.service');
    expect(plan.targets.length).toBeGreaterThan(0);
    const hasController = plan.targets.includes('src/auth/auth.controller.ts');
    const hasService = plan.targets.includes('src/auth/auth.service.ts');
    expect(hasController || hasService).toBe(true);
  });

  test('4. Debería generar items de cambio (changes) con la prioridad adecuada', async () => {
    const plan = await reasoner.plan('Agregar login seguro', {
      explicitFiles: ['src/auth/auth.controller.ts']
    });
    const controllerChange = plan.changes.find(c => c.path === 'src/auth/auth.controller.ts');
    expect(controllerChange).toBeDefined();
    expect(controllerChange?.priority).toBe(1); // explicit = 1
  });

  test('5. Debería sugerir acción MODIFY para archivos existentes modificados', async () => {
    const plan = await reasoner.plan('Agregar login seguro', {
      explicitFiles: ['src/auth/auth.controller.ts']
    });
    const controllerChange = plan.changes.find(c => c.path === 'src/auth/auth.controller.ts');
    expect(controllerChange?.action).toBe('MODIFY');
  });

  test('6. Debería sugerir acción TEST para archivos de pruebas unitarias', async () => {
    const plan = await reasoner.plan('Correr pruebas', {
      explicitFiles: ['src/auth/auth.service.spec.ts']
    });
    const specChange = plan.changes.find(c => c.path === 'src/auth/auth.service.spec.ts');
    expect(specChange?.action).toBe('TEST');
  });

  test('7. Debería sugerir acción REVIEW para targets agregados por expansión del grafo', async () => {
    const plan = await reasoner.plan('Agregar login seguro', {
      explicitFiles: ['src/auth/auth.controller.ts'],
      expandGraph: true
    });
    // auth.controller.ts importa a auth.service.ts, que debe agregarse como graph expansion
    const serviceChange = plan.changes.find(c => c.path === 'src/auth/auth.service.ts');
    expect(serviceChange).toBeDefined();
    expect(serviceChange?.action).toBe('REVIEW');
  });

  test('8. Debería calcular las dependencias correctas para cada ChangeItem', async () => {
    const plan = await reasoner.plan('Agregar login seguro', {
      explicitFiles: ['src/auth/auth.controller.ts']
    });
    const controllerChange = plan.changes.find(c => c.path === 'src/auth/auth.controller.ts');
    expect(controllerChange?.dependencies).toContain('src/auth/auth.service.ts');
  });

  test('9. Invariante: recomendación sin evidencia => nunca se emite', async () => {
    const plan = await reasoner.plan('Agregar login seguro', {
      explicitFiles: ['src/auth/auth.controller.ts']
    });
    for (const rec of plan.recommendations)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('10. Invariante de Determinismo: múltiples ejecuciones con mismo input deben producir idéntico JSON', async () => {
    const plan1 = await reasoner.plan('Agregar login seguro', {
      explicitFiles: ['src/auth/auth.controller.ts'],
      expandGraph: true
    });
    const plan2 = await reasoner.plan('Agregar login seguro', {
      explicitFiles: ['src/auth/auth.controller.ts'],
      expandGraph: true
    });

    const json1 = JSON.stringify(plan1);
    const json2 = JSON.stringify(plan2);
    expect(json1).toBe(json2);
  });

  test('11. Debería asociar el ADR gobernado al target', async () => {
    const customModel: ProjectModel = {
      ...mockProjectModel,
      relations: [
        ...mockProjectModel.relations,
        { from: 'src/auth/auth.service.ts', to: 'adr:ADR-002', type: 'governed-by' }
      ]
    };
    const tempReasoner = new ArchitecturalReasoner(customModel);
    const plan = await tempReasoner.plan('Afectar', {
      explicitFiles: ['src/auth/auth.service.ts']
    });
    const adrImpact = plan.architecture.affectedADRs.find(a => a.adrId === 'ADR-002');
    expect(adrImpact).toBeDefined();
    expect(adrImpact?.impactType).toBe('GOVERNS');
  });

  test('12. Debería marcar conflicto de ADR si el target está asociado a un ADR deprecado', async () => {
    const customModel: ProjectModel = {
      ...mockProjectModel,
      decisions: [
        { id: 'ADR-002', title: 'Autenticación', status: 'deprecated', file: 'docs/adr/002.md' }
      ],
      relations: [
        ...mockProjectModel.relations,
        { from: 'src/auth/auth.service.ts', to: 'adr:ADR-002', type: 'governed-by' }
      ]
    };
    const tempReasoner = new ArchitecturalReasoner(customModel);
    const plan = await tempReasoner.plan('Afectar', {
      explicitFiles: ['src/auth/auth.service.ts']
    });
    const adrImpact = plan.architecture.affectedADRs.find(a => a.adrId === 'ADR-002');
    expect(adrImpact?.impactType).toBe('CONFLICTS');
    expect(plan.architecture.conflicts).toContain('Conflicto con ADR obsoleto/contradictorio: ADR-002');
  });

  test('13. Debería incluir la penalización de ADR_CONFLICT en la lista de riesgos', async () => {
    const customModel: ProjectModel = {
      ...mockProjectModel,
      decisions: [
        { id: 'ADR-002', title: 'Autenticación', status: 'deprecated', file: 'docs/adr/002.md' }
      ],
      relations: [
        ...mockProjectModel.relations,
        { from: 'src/auth/auth.service.ts', to: 'adr:ADR-002', type: 'governed-by' }
      ]
    };
    const tempReasoner = new ArchitecturalReasoner(customModel);
    const plan = await tempReasoner.plan('Afectar', {
      explicitFiles: ['src/auth/auth.service.ts']
    });
    const riskItem = plan.risks.find(r => r.category === 'ADR_CONFLICT');
    expect(riskItem).toBeDefined();
    expect(riskItem?.contribution).toBe(30);
  });

  test('14. Debería mapear violaciones de gobernanza de v0.2.7 al reporte local', async () => {
    const customModel: ProjectModel = {
      ...mockProjectModel,
      architecture: { layers: ['core/domain', 'cli'] },
      files: [
        ...mockProjectModel.files,
        { path: 'core/domain/entity.ts', hash: 'e', size: 10 },
        { path: 'cli/index.ts', hash: 'i', size: 10 }
      ],
      relations: [
        { from: 'core/domain/entity.ts', to: 'cli/index.ts', type: 'imports' }
      ]
    };
    const tempReasoner = new ArchitecturalReasoner(customModel);
    const plan = await tempReasoner.plan('Verificar', {
      explicitFiles: ['core/domain/entity.ts']
    });
    expect(plan.architecture.violations.length).toBeGreaterThan(0);
    expect(plan.architecture.violations[0].ruleId).toBe('rule:Domain');
  });

  test('15. Debería emitir recomendación de gobernanza si existe evidencia física', async () => {
    const customModel: ProjectModel = {
      ...mockProjectModel,
      architecture: { layers: ['core/domain', 'cli'] },
      files: [
        ...mockProjectModel.files,
        { path: 'core/domain/entity.ts', hash: 'e', size: 10 },
        { path: 'cli/index.ts', hash: 'i', size: 10 }
      ],
      relations: [
        { from: 'core/domain/entity.ts', to: 'cli/index.ts', type: 'imports' }
      ]
    };
    const tempReasoner = new ArchitecturalReasoner(customModel);
    const plan = await tempReasoner.plan('Verificar', {
      explicitFiles: ['core/domain/entity.ts']
    });
    const rec = plan.recommendations.find(r => r.id.startsWith('rec-gov-violation-'));
    expect(rec).toBeDefined();
    expect(rec?.evidence[0].type).toBe('governance_rule');
  });

  test('16. Debería emitir recomendación para agregar tests si falta cobertura directa en target de alto riesgo', async () => {
    const customModel: ProjectModel = {
      ...mockProjectModel,
      // Forzar que el archivo sea de alto riesgo mediante Fan-in (varios dependientes)
      files: [
        ...mockProjectModel.files,
        ...Array.from({ length: 15 }, (_, i) => ({ path: `src/dep${i}.ts`, hash: 'h', size: 10 }))
      ],
      relations: [
        ...mockProjectModel.relations,
        ...Array.from({ length: 15 }, (_, i) => ({ from: `src/dep${i}.ts`, to: 'src/user/user.repository.ts', type: 'imports' as const }))
      ]
    };
    const tempReasoner = new ArchitecturalReasoner(customModel);
    const plan = await tempReasoner.plan('Refactorizar', {
      explicitFiles: ['src/user/user.repository.ts'] // no tiene test directo
    });
    // Debe tener riesgo alto y faltarle test directo
    const rec = plan.recommendations.find(r => r.id.startsWith('rec-missing-test-'));
    expect(rec).toBeDefined();
  });

  test('17. Debería emitir recomendación de refactorización si el Fan-in es crítico', async () => {
    const customModel: ProjectModel = {
      ...mockProjectModel,
      // 35 dependientes para forzar un score crítico (>80) y que la severidad sea CRITICAL
      files: [
        ...mockProjectModel.files,
        ...Array.from({ length: 35 }, (_, i) => ({ path: `src/dep${i}.ts`, hash: 'h', size: 10 }))
      ],
      relations: [
        ...mockProjectModel.relations,
        ...Array.from({ length: 35 }, (_, i) => ({ from: `src/dep${i}.ts`, to: 'src/auth/auth.service.ts', type: 'imports' as const }))
      ]
    };
    const tempReasoner = new ArchitecturalReasoner(customModel);
    const plan = await tempReasoner.plan('Refactorizar', {
      explicitFiles: ['src/auth/auth.service.ts']
    });
    const rec = plan.recommendations.find(r => r.id.startsWith('rec-refactor-fan-in-'));
    expect(rec).toBeDefined();
  });

  test('18. Debería retornar una lista vacía de tests recomendados si ningún test se ve afectado', async () => {
    const customModel: ProjectModel = {
      ...mockProjectModel,
      relations: []
    };
    const tempReasoner = new ArchitecturalReasoner(customModel);
    const plan = await tempReasoner.plan('Modificar repositorio', {
      explicitFiles: ['src/user/user.repository.ts']
    });
    expect(plan.tests.recommended).toEqual([]);
    expect(plan.tests.affected).toEqual([]);
  });

  test('19. Debería incluir y mapear de forma segura los boundaries cruzados del linter de impacto', async () => {
    const plan = await reasoner.plan('Agregar login seguro', {
      explicitFiles: ['src/auth/auth.controller.ts']
    });
    expect(plan.impact.boundariesCrossed).toBeDefined();
  });

  test('20. Debería ordenar los arrays internos de ChangePlan de manera determinista estable', async () => {
    const plan = await reasoner.plan('Agregar login seguro', {
      explicitFiles: ['src/auth/auth.controller.ts', 'src/user/user.repository.ts'],
      expandGraph: true
    });
    // Validar orden de changes
    const changesSorted = plan.changes.every((val, i, arr) => {
      if (!i) return true;
      const prio = arr[i - 1].priority - val.priority;
      if (prio !== 0) return prio <= 0;
      return arr[i - 1].path.localeCompare(val.path) <= 0;
    });
    expect(changesSorted).toBe(true);

    // Validar orden de recommendations
    const recsSorted = plan.recommendations.every((val, i, arr) => {
      if (!i) return true;
      const prio = arr[i - 1].priority - val.priority;
      if (prio !== 0) return prio <= 0;
      return arr[i - 1].id.localeCompare(val.id) <= 0;
    });
    expect(recsSorted).toBe(true);
  });
});
