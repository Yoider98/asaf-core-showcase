import { ProjectModel } from '../../domain/project-model';
import { ImpactEngine, ImpactReport, ImpactItem, ImpactMetrics, ImpactEdge } from '../../domain/impact';
import { DeterministicGraphQueryEngine } from '../graph/query-engine';
import { RiskScorer } from './risk-scorer';
import { GitChangeDetector } from '../git/git-change-detector';
import { ArchitectureGovernanceEngine } from '../governance/governance-engine';
import { DeterministicADRIntelligenceEngine } from '../adr/adr-intelligence-engine';

export class DeterministicImpactEngine implements ImpactEngine {
  private model: ProjectModel;
  private graphEngine: DeterministicGraphQueryEngine;

  constructor(model: ProjectModel)  { /* Constructor del motor ASAF */ }

  public async analyzeImpact(targetId: string, depth: number | 'all' = 'all'): Promise<ImpactReport>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  };
      }

      throw new Error(`El nodo target "${targetId}" no existe en el grafo del proyecto.`);
    }

    const queryOptions: { depth?: number | 'all' } = depth === 'all' ? { depth: 'all' } : { depth };
    const dependents = this.graphEngine.getDependents(targetId, queryOptions);
    const items: ImpactItem[] = [];
    const seenIds = new Set<string>();

    // 1. Clasificar e indexar los dependientes con evidencia invertida del shortest path.
    //    El grafo tiene aristas: depId → (imports) → targetId
    //    findPath(depId, targetId) encuentra el camino en dirección forward.
    //    Invertimos la ruta para producir evidencia desde el target al dependiente.
    dependents.forEach(depId => {
      if (seenIds.has(depId)) return;
      seenIds.add(depId);

      const depNode = this.graphEngine.getNode(depId);
      if (!depNode) return;

      // Encontrar camino en dirección forward (depId → … → targetId) y revertirlo
      const pathResult = this.graphEngine.findPath(depId, targetId);
      let pathNodes: string[];
      let relations: ImpactEdge[];

      if (pathResult)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  })).reverse();
      } else {
        pathNodes = [targetId, depId];
        relations = [];
      }

      let type: ImpactItem['type'] = 'file';
      if (depId.startsWith('api:')) {
        type = 'api';
      } else if (depId.startsWith('db:')) {
        type = 'database';
      } else if (depId.endsWith('.test.ts') || depId.endsWith('.spec.ts') || depId.endsWith('.test.js')) {
        type = 'test';
      } else if (depNode.type === 'symbol')  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

      items.push({
        id: depId,
        type,
        distance: relations.length || 1,
        evidence: {
          from: targetId,
          to: depId,
          distance: relations.length || 1,
          path: pathNodes,
          relations
        }
      });
    });

    // 2. Segundo pase: detectar APIs y DBs como aristas salientes (exposes/queries)
    //    de los nodos afectados (el target y sus dependientes).
    const allAffectedIds = new Set([targetId, ...dependents]);

    this.model.relations.forEach(r => {
      if (!allAffectedIds.has(r.from)) return;
      if (r.type !== 'exposes' && r.type !== 'queries') return;
      if (seenIds.has(r.to)) return;
      seenIds.add(r.to);

      const type: ImpactItem['type'] = r.type === 'exposes' ? 'api' : 'database';

      // Construir evidencia: camino desde targetId hasta r.from (el nodo que expone/queries),
      // luego añadir la arista final al API/DB.
      const pathResult = this.graphEngine.findPath(r.from, targetId);
      let pathNodes: string[];
      let edgesBefore: ImpactEdge[];

      if (pathResult)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  })).reverse();
      } else {
        pathNodes = r.from === targetId ? [] : [targetId, r.from];
        edgesBefore = r.from === targetId ? [] : [];
      }

      const finalEdge: ImpactEdge = { from: r.from, to: r.to, type: r.type };
      const fullPath = [...pathNodes, r.to];
      const fullRelations = [...edgesBefore, finalEdge];

      items.push({
        id: r.to,
        type,
        distance: fullRelations.length,
        evidence: {
          from: targetId,
          to: r.to,
          distance: fullRelations.length,
          path: fullPath,
          relations: fullRelations
        }
      });
    });

    const graphMetrics = this.graphEngine.calculateMetrics();
    const fanIn = graphMetrics.fanIn[targetId] || 0;
    const fanOut = graphMetrics.fanOut[targetId] || 0;

    const affectedApis = items.filter(i => i.type === 'api').length;
    const affectedDatabases = items.filter(i => i.type === 'database').length;
    const affectedTests = items.filter(i => i.type === 'test').length;

    const structuralItems = items.filter(i => i.type === 'file' || i.type === 'symbol' || i.type === 'test');
    const maxDepth = structuralItems.length > 0 ? Math.max(...structuralItems.map(i => i.distance)) : 0;

    const metrics: ImpactMetrics = {
      fanIn, fanOut,
      affectedNodes: dependents.length,
      affectedApis,
      affectedDatabases,
      affectedTests,
      maxDepth
    };

    const risk = RiskScorer.calculate(metrics);

    const govEngine = new ArchitectureGovernanceEngine(this.model, this.model.project.path);
    const architectureBoundariesCrossed = govEngine.findAffectedBoundaries(targetId, dependents);

    const adrEngine = new DeterministicADRIntelligenceEngine(this.model);
    const affectedADRs = adrEngine.findAffectedADRs(targetId, dependents);

    return { target: targetId, status: 'success', metrics, items, risk, architectureBoundariesCrossed, affectedADRs };
  }
}
