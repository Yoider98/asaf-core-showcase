import { ProjectModel } from '../domain/project-model';
import { RiskItem, RiskOrigin, ContextEvidence } from './types';
import { DeterministicGraphQueryEngine } from '../infrastructure/graph/query-engine';
import { DeterministicImpactEngine } from '../infrastructure/impact/impact-engine';
import { ArchitectureGovernanceEngine } from '../infrastructure/governance/governance-engine';
import { TestImpactReport } from './test-impact-analyzer';

export const RISK_CONSTANTS = {
  BASE_SCORE: 20,
  FAN_IN_MAX: 20,
  FAN_IN_FACTOR: 2,
  FAN_OUT_MAX: 10,
  FAN_OUT_FACTOR: 1,
  DATABASE_PENALTY: 15,
  API_PENALTY: 15,
  BOUNDARY_PENALTY: 20,
  GOVERNANCE_PENALTY: 15,
  MISSING_TEST_PENALTY: 20,
  DIRECT_TEST_BONUS: 10,
  ADR_CONFLICT_PENALTY: 30
};

export interface RiskReport {
  items: RiskItem[];
  score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class RiskEngine {
  private model: ProjectModel;
  private graphEngine: DeterministicGraphQueryEngine;
  private impactEngine: DeterministicImpactEngine;
  private govEngine: ArchitectureGovernanceEngine;

  constructor(model: ProjectModel)  { /* Constructor del motor ASAF */ }

  /**
   * Calcula el riesgo asociado a un conjunto de targets de cambio.
   */
  public async analyze(
    targets: string[],
    testReport: TestImpactReport,
    primaryTargets: string[] = [] // Para deducir origin (modificado directamente = PROJECTED, dependencias = EXISTING)
  ): Promise<RiskReport> {
    const riskItems: RiskItem[] = [];
    let totalScore = RISK_CONSTANTS.BASE_SCORE;

    // Convertir targets a Set para búsquedas rápidas
    const targetsSet = new Set(targets);
    const primarySet = new Set(primaryTargets.length > 0 ? primaryTargets : targets);

    const sortedTargets = [...targets].sort();

    for (const target of sortedTargets)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }' importa a '${target}'`,
          sourceNode: dep,
          targetNode: target,
          relation: 'IMPORTS',
          distance: 1,
          confidence: 1.0
        }));

        riskItems.push({
          id: `risk-fan-in-${target}`,
          category: 'FAN_IN',
          score: totalScore,
          contribution,
          severity: this.getSeverityForScore(totalScore),
          reason: `El target tiene un alto Fan-in (${fanInCount} dependientes)`,
          origin,
          evidence
        });
      }

      // 2. Fan-out alto
      const dependencies = this.graphEngine.getDependencies(target);
      const fanOutCount = dependencies.length;
      if (fanOutCount > 8)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }' importa a la dependencia '${dep}'`,
          sourceNode: target,
          targetNode: dep,
          relation: 'IMPORTS',
          distance: 1,
          confidence: 1.0
        }));

        riskItems.push({
          id: `risk-fan-out-${target}`,
          category: 'FAN_OUT',
          score: totalScore,
          contribution,
          severity: this.getSeverityForScore(totalScore),
          reason: `El target tiene un alto Fan-out (${fanOutCount} dependencias)`,
          origin,
          evidence
        });
      }

      // 3. Acceso a base de datos
      const hasDbAccess = this.model.databases.some(db => db.file === target) ||
        this.model.relations.some(r => r.from === target && r.to.startsWith('db:'));
      if (hasDbAccess)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }' realiza operación '${db.operation}' en tabla/db '${db.table}'`,
          sourceNode: target,
          targetNode: `db:${db.table}`,
          relation: 'QUERIES',
          confidence: 1.0
        }));

        if (evidence.length === 0)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }' se conecta al nodo de base de datos en el grafo`,
            sourceNode: target,
            targetNode: 'database',
            confidence: 1.0
          });
        }

        riskItems.push({
          id: `risk-database-${target}`,
          category: 'DATABASE',
          score: totalScore,
          contribution,
          severity: this.getSeverityForScore(totalScore),
          reason: `El target interactúa directamente con la base de datos`,
          origin,
          evidence
        });
      }

      // 4. API expuesta
      const isApi = this.model.apis.some(api => api.handlerSymbol === target || this.model.symbols.some(s => s.filePath === target && s.id === api.handlerSymbol));
      if (isApi)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }' maneja el endpoint API ${api.method} ${api.path}`,
          sourceNode: target,
          targetNode: `api:${api.path}`,
          relation: 'EXPOSES',
          confidence: 1.0
        }));

        riskItems.push({
          id: `risk-api-${target}`,
          category: 'API',
          score: totalScore,
          contribution,
          severity: this.getSeverityForScore(totalScore),
          reason: `El target expone o maneja un endpoint de API público`,
          origin,
          evidence
        });
      }

      // 5. Cruzar boundaries
      let boundaryReport;
      try {
        boundaryReport = await this.impactEngine.analyzeImpact(target);
      } catch (e)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

      if (boundaryReport && boundaryReport.architectureBoundariesCrossed && boundaryReport.architectureBoundariesCrossed.length > 0)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }' cruza la frontera de arquitectura: ${b}`,
          nodeId: b,
          confidence: 1.0
        }));

        riskItems.push({
          id: `risk-boundary-${target}`,
          category: 'BOUNDARY',
          score: totalScore,
          contribution,
          severity: this.getSeverityForScore(totalScore),
          reason: `El target cruza fronteras/boundaries arquitectónicas del proyecto`,
          origin,
          evidence
        });
      }

      // 6. Violaciones de gobernanza
      let govReport;
      try {
        govReport = this.govEngine.checkRules();
      } catch (e)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

      if (govReport && govReport.violations)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }. Importa '${v.importedPath}'`,
            nodeId: v.rule,
            confidence: 1.0
          }));

          riskItems.push({
            id: `risk-governance-${target}`,
            category: 'GOVERNANCE',
            score: totalScore,
            contribution,
            severity: this.getSeverityForScore(totalScore),
            reason: `El target posee violaciones de gobernanza de arquitectura activas`,
            origin,
            evidence
          });
        }
      }

      // 7. Missing test vs Direct test bonus
      const isTest = target.toLowerCase().endsWith('.spec.ts') || target.toLowerCase().endsWith('.test.ts') || target.toLowerCase().endsWith('.spec.js') || target.toLowerCase().endsWith('.test.js');
      if (!isTest)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }`,
            category: 'MISSING_TEST',
            score: totalScore,
            contribution,
            severity: this.getSeverityForScore(totalScore),
            reason: `No se encontró evidencia de cobertura de test directo mediante el grafo explorado para '${target}'`,
            origin,
            evidence: []
          });
        } else {
          // Bonificación
          const contribution = -RISK_CONSTANTS.DIRECT_TEST_BONUS;
          totalScore += contribution;

          const directTest = testReport.affected.find(a => a.target === target && a.classification === 'DIRECT')!;
          
          riskItems.push({
            id: `risk-direct-test-bonus-${target}`,
            category: 'MISSING_TEST',
            score: totalScore,
            contribution,
            severity: this.getSeverityForScore(totalScore),
            reason: `El target posee cobertura de test directo por '${directTest.testFile}'`,
            origin,
            evidence: [{
              type: 'graph_relation',
              description: `El test '${directTest.testFile}' cubre directamente a '${target}'`,
              sourceNode: directTest.testFile,
              targetNode: target,
              relation: 'TESTS',
              distance: 1,
              confidence: 1.0
            }]
          });
        }
      }

      // 8. ADR conflict
      const adrConflictRels = this.model.relations.filter(
        r => r.from === target && r.type === 'governed-by' && r.to.startsWith('adr:')
      );

      for (const rel of adrConflictRels)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }-${adrId}`,
            category: 'ADR_CONFLICT',
            score: totalScore,
            contribution,
            severity: this.getSeverityForScore(totalScore),
            reason: `El target contradice la decisión de diseño activa o está gobernado por el ADR obsoleto '${adrId}'`,
            origin,
            evidence: [{
              type: 'adr_reference',
              description: `El target está gobernado por el ADR '${adrId}' (Status: ${adr?.status || 'desconocido'})`,
              nodeId: adrId,
              confidence: 1.0
            }]
          });
        }
      }
    }

    // Acotar el score total a [0, 100]
    const finalScore = Math.max(0, Math.min(totalScore, 100));

    // Orden determinista estable secundario para la reproducibilidad byte-for-byte
    riskItems.sort((a, b) => {
      const catCompare = a.category.localeCompare(b.category);
      if (catCompare !== 0) return catCompare;
      return a.id.localeCompare(b.id);
    });

    return {
      items: riskItems,
      score: finalScore,
      severity: this.getSeverityForScore(finalScore)
    };
  }

  private getSeverityForScore(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
}
