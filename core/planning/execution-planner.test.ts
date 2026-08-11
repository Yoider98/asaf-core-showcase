import { ExecutionPlanner } from './execution-planner';
import { ChangeGraph, TestStrategy } from './types';

describe('ExecutionPlanner', () => {
  let planner: ExecutionPlanner;
  let mockGraph: ChangeGraph;
  let mockTestStrategy: TestStrategy;

  beforeEach(() => {
    planner = new ExecutionPlanner();

    mockGraph = {
      nodes: [
        {
          id: 'src/auth/auth.service.ts',
          path: 'src/auth/auth.service.ts',
          action: 'CREATE',
          priority: 2,
          dependencies: [],
          dependents: ['src/auth/auth.controller.ts'],
          evidence: []
        },
        {
          id: 'src/auth/auth.controller.ts',
          path: 'src/auth/auth.controller.ts',
          action: 'MODIFY',
          priority: 3,
          dependencies: ['src/auth/auth.service.ts'],
          dependents: [],
          evidence: []
        }
      ],
      edges: [],
      hasCycle: false,
      cycleNodes: [],
      topologicalOrder: ['src/auth/auth.service.ts', 'src/auth/auth.controller.ts']
    };

    mockTestStrategy = {
      mustRun: [
        {
          testFile: 'src/auth/auth.spec.ts',
          target: 'src/auth/auth.controller.ts',
          priority: 100,
          reason: 'direct',
          evidence: []
        }
      ],
      shouldRun: [],
      recommendedToCreate: [],
      missingCoverage: [],
      blocked: []
    };
  });

  test('1. Debería generar pasos secuenciales ordenados y pasos de test al final', () => {
    const plan = planner.plan(mockGraph, mockTestStrategy, []);

    expect(plan.hasCycle).toBe(false);
    expect(plan.steps.length).toBe(3); // 2 de cambios topológicos + 1 de test

    expect(plan.steps[0].target).toBe('src/auth/auth.service.ts');
    expect(plan.steps[0].action).toBe('CREATE');

    expect(plan.steps[1].target).toBe('src/auth/auth.controller.ts');
    expect(plan.steps[1].action).toBe('MODIFY');

    expect(plan.steps[2].target).toBe('src/auth/auth.spec.ts');
    expect(plan.steps[2].action).toBe('TEST');
  });

  test('2. Debería calcular parallelGroups de forma jerárquica correcta', () => {
    const plan = planner.plan(mockGraph, mockTestStrategy, []);

    // En mockGraph: AuthService no tiene dependencias (Nivel 0). AuthController depende de AuthService (Nivel 1).
    expect(plan.parallelGroups).toEqual([
      ['src/auth/auth.service.ts'],
      ['src/auth/auth.controller.ts']
    ]);
  });

  test('3. Debería bloquear el plan si hay ciclos en el grafo', () => {
    mockGraph.hasCycle = true;
    mockGraph.cycleNodes = ['src/a.ts', 'src/b.ts'];
    mockGraph.topologicalOrder = [];

    const plan = planner.plan(mockGraph, mockTestStrategy, []);

    expect(plan.hasCycle).toBe(true);
    expect(plan.steps.length).toBe(0);
    expect(plan.blocked).toContain('src/a.ts');
    expect(plan.blocked).toContain('src/b.ts');
  });
});
