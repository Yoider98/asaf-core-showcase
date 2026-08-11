import { ChangeGraphBuilder } from './change-graph';
import { ChangeItem } from '../reasoning/types';

describe('ChangeGraphBuilder', () => {
  let builder: ChangeGraphBuilder;

  beforeEach(() => {
    builder = new ChangeGraphBuilder();
  });

  test('1. Debería construir un grafo con un nodo aislado', () => {
    const items: ChangeItem[] = [
      {
        path: 'src/user/user.service.ts',
        action: 'MODIFY',
        priority: 1,
        reason: 'test',
        dependencies: [],
        evidence: []
      }
    ];

    const graph = builder.build(items);
    expect(graph.nodes.length).toBe(1);
    expect(graph.nodes[0].id).toBe('src/user/user.service.ts');
    expect(graph.hasCycle).toBe(false);
    expect(graph.topologicalOrder).toEqual(['src/user/user.service.ts']);
  });

  test('2. Debería construir dependencias orientadas correctamente (Service antes que Controller)', () => {
    const items: ChangeItem[] = [
      {
        path: 'src/user/user.controller.ts',
        action: 'MODIFY',
        priority: 2,
        reason: 'depende de service',
        dependencies: ['src/user/user.service.ts'],
        evidence: []
      },
      {
        path: 'src/user/user.service.ts',
        action: 'CREATE',
        priority: 1,
        reason: 'nuevo service',
        dependencies: [],
        evidence: []
      }
    ];

    const graph = builder.build(items);
    expect(graph.hasCycle).toBe(false);
    // El orden topológico debe garantizar que la dependencia (Service) va antes que el dependiente (Controller)
    expect(graph.topologicalOrder).toEqual([
      'src/user/user.service.ts',
      'src/user/user.controller.ts'
    ]);

    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].from).toBe('src/user/user.service.ts');
    expect(graph.edges[0].to).toBe('src/user/user.controller.ts');
  });

  test('3. Debería desempatar determinísticamente si no hay dependencias directas', () => {
    // Desempate: priority DESC -> action ASC -> path ASC -> id ASC
    const items: ChangeItem[] = [
      {
        path: 'src/b.ts',
        action: 'CREATE',
        priority: 2,
        reason: 'alta prioridad',
        dependencies: [],
        evidence: []
      },
      {
        path: 'src/a.ts',
        action: 'MODIFY',
        priority: 2,
        reason: 'alta prioridad pero MODIFY',
        dependencies: [],
        evidence: []
      },
      {
        path: 'src/c.ts',
        action: 'CREATE',
        priority: 1,
        reason: 'baja prioridad',
        dependencies: [],
        evidence: []
      }
    ];

    const graph = builder.build(items);
    expect(graph.hasCycle).toBe(false);
    // Desempate esperado:
    // 1. src/b.ts (prioridad 2, action CREATE)
    // 2. src/a.ts (prioridad 2, action MODIFY)
    // 3. src/c.ts (prioridad 1)
    expect(graph.topologicalOrder).toEqual([
      'src/b.ts',
      'src/a.ts',
      'src/c.ts'
    ]);
  });

  test('4. Debería detectar un ciclo directo', () => {
    const items: ChangeItem[] = [
      {
        path: 'src/a.ts',
        action: 'MODIFY',
        priority: 1,
        reason: 'A depende de B',
        dependencies: ['src/b.ts'],
        evidence: []
      },
      {
        path: 'src/b.ts',
        action: 'MODIFY',
        priority: 1,
        reason: 'B depende de A',
        dependencies: ['src/a.ts'],
        evidence: []
      }
    ];

    const graph = builder.build(items);
    expect(graph.hasCycle).toBe(true);
    expect(graph.cycleNodes).toContain('src/a.ts');
    expect(graph.cycleNodes).toContain('src/b.ts');
    expect(graph.topologicalOrder).toEqual([]);
  });

  test('5. Debería detectar un ciclo indirecto de 3 nodos', () => {
    const items: ChangeItem[] = [
      {
        path: 'src/a.ts',
        action: 'MODIFY',
        priority: 1,
        reason: 'ciclo A',
        dependencies: ['src/b.ts'],
        evidence: []
      },
      {
        path: 'src/b.ts',
        action: 'MODIFY',
        priority: 1,
        reason: 'ciclo B',
        dependencies: ['src/c.ts'],
        evidence: []
      },
      {
        path: 'src/c.ts',
        action: 'MODIFY',
        priority: 1,
        reason: 'ciclo C',
        dependencies: ['src/a.ts'],
        evidence: []
      }
    ];

    const graph = builder.build(items);
    expect(graph.hasCycle).toBe(true);
    expect(graph.cycleNodes.length).toBe(3);
    expect(graph.cycleNodes).toContain('src/a.ts');
    expect(graph.cycleNodes).toContain('src/b.ts');
    expect(graph.cycleNodes).toContain('src/c.ts');
    expect(graph.topologicalOrder).toEqual([]);
  });
});
