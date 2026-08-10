import { RankedContextItem } from './context-types';

export class ContextRanker {
  public static rank(
    targets: string[],
    dependencies: { id: string; distance: number }[],
    dependents: { id: string; distance: number }[],
    symbols: string[],
    tests: string[],
    adrs: string[]
  ): RankedContextItem[]  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }:${id}`;
      if (!added.has(key)) {
        added.add(key);
        items.push({
          id,
          type,
          priority: basePriority,
          reason,
          distance,
          source: source || 'target'
        });
      }
    };

    // Targets: 100
    targets.forEach(t => add(t, 'file', 100, 'Target directo (modificado o seleccionado)', 0, 'target'));

    // Dependencias con penalización por distancia en el grafo
    dependencies.forEach(d => {
      const priority = Math.max(40, 90 - (d.distance - 1) * 15);
      add(d.id, 'file', priority, `Dependencia indirecta a distancia ${d.distance}`, d.distance, 'dependency');
    });

    // Dependientes con penalización por distancia en el grafo
    dependents.forEach(d => {
      const priority = Math.max(30, 85 - (d.distance - 1) * 15);
      add(d.id, 'file', priority, `Dependiente indirecto a distancia ${d.distance}`, d.distance, 'dependent');
    });

    // Símbolos directamente afectados
    symbols.forEach(s => add(s, 'symbol', 80, 'Símbolo afectado por la firma de importación', 1, 'symbol'));

    // Tests afectados
    tests.forEach(t => add(t, 'file', 75, 'Test que cubre el componente afectado', 1, 'test'));

    // ADRs vinculados
    adrs.forEach(a => add(a, 'adr', 70, 'Decisión de Arquitectura (ADR) que gobierna el componente', 1, 'adr'));

    // Ordenamiento determinista estable (desempate alfabético)
    return items.sort((a, b) =>
      b.priority - a.priority ||
      a.type.localeCompare(b.type) ||
      a.id.localeCompare(b.id)
    );
  }
}
