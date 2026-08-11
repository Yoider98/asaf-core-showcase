import { ProjectModel } from '../domain/project-model';
import { 
  ChangePlan, 
  TaskIntent, 
  ResolvedTarget, 
  ContextEvidence, 
  ChangeItem, 
  RiskItem, 
  ADRAffect, 
  GovernanceViolation, 
  Recommendation 
} from './types';
import { TaskAnalyzer } from './task-analyzer';
import { TargetResolver, TargetResolverOptions } from './target-resolver';
import { TestImpactAnalyzer } from './test-impact-analyzer';
import { RiskEngine } from './risk-engine';
import { UnifiedContextEngine } from '../context/context-engine';
import * as path from 'path';

export class ArchitecturalReasoner {
  private model: ProjectModel;
  private contextEngine: UnifiedContextEngine;
  private testAnalyzer: TestImpactAnalyzer;
  private riskEngine: RiskEngine;
  private targetResolver: TargetResolver;

  constructor(model: ProjectModel)  { /* Constructor del motor ASAF */ }

  /**
   * Genera un ChangePlan estructurado y determinista para la tarea dada.
   */
  public async plan(task: string, options: TargetResolverOptions & { budget?: number } = {}): Promise<ChangePlan>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  });

    const targets = resolvedTargets.map(rt => rt.id).sort();

    // 3. Obtener el AIContext unificado (slicing, gobernanza real, ADRs) de v0.2.7
    // Pasamos los archivos resueltos para alimentar el UnifiedContextEngine
    const aiContext = await this.contextEngine.buildContext({
      task,
      files: targets.filter(t => !t.startsWith('symbol:')),
      budget: options.budget || 10000
    });

    // 4. Analizar impacto en pruebas
    const testReport = this.testAnalyzer.analyze(targets);
    const affectedNodes = Array.from(new Set([
      ...targets,
      ...testReport.affected.map(t => t.target)
    ]));

    // 5. Analizar riesgos matemáticos auditables
    const primaryTargets = resolvedTargets.filter(rt => rt.source !== 'graph').map(rt => rt.id);
    const riskReport = await this.riskEngine.analyze(targets, testReport, primaryTargets);

    // 6. Ensamblar evidencias universales
    const evidenceMap = new Map<string, ContextEvidence>();

    // Agregar evidencias de los resolved targets
    resolvedTargets.forEach(rt => {
      if (rt.evidence)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }|${ev.nodeId || ''}|${ev.sourceNode || ''}|${ev.targetNode || ''}`;
          evidenceMap.set(key, ev);
        });
      }
    });

    // Agregar evidencias de ADRs
    aiContext.evidence.forEach((ev: any) => {
      evidenceMap.set(`adr_reference|${ev.claim}`, {
        type: 'adr_reference',
        description: ev.claim,
        path: ev.path,
        confidence: 1.0
      });
    });

    // Agregar evidencias de riesgos
    riskReport.items.forEach(item => {
      item.evidence.forEach(ev => {
        const key = `${ev.type}|${ev.nodeId || ''}|${ev.sourceNode || ''}|${ev.targetNode || ''}`;
        evidenceMap.set(key, ev);
      });
    });

    // 7. Mapear violaciones de gobernanza de v0.2.7 a la interfaz local
    const violations: GovernanceViolation[] = aiContext.architecture.violations.map((v: any) => {
      const description = `Violación de regla: ${v.rule}. Archivo '${v.file}' importa de forma prohibida a '${v.importedPath}'`;
      const ruleEvidence: ContextEvidence = {
        type: 'governance_rule',
        description,
        nodeId: v.rule,
        sourceNode: v.file,
        targetNode: v.importedPath,
        relation: 'IMPORTS',
        path: v.evidence?.path || [v.file, v.importedPath],
        confidence: 1.0
      };
      // Registrar evidencia
      evidenceMap.set(`governance_rule|${v.rule}|${v.file}|${v.importedPath}`, ruleEvidence);

      return {
        ruleId: v.rule,
        description,
        severity: v.severity === 'error' ? 'error' : 'warning',
        target: v.file,
        reason: `El linter detectó un acoplamiento prohibido gobernado por la regla de capas '${v.rule}'`
      };
    });

    // 8. Mapear decisiones de arquitectura (ADRs) afectadas
    const affectedADRs: ADRAffect[] = aiContext.decisions.map((dec: any) => {
      // Determinar si hay conflicto basándose en si existe una penalización en riskReport para este ADR
      const hasConflict = riskReport.items.some(
        item => item.category === 'ADR_CONFLICT' && item.id.includes(dec.id)
      );

      return {
        adrId: dec.id,
        title: dec.title,
        status: dec.status,
        reason: hasConflict 
          ? `El target contradice activamente la directriz del ADR '${dec.id}'` 
          : `El target está gobernado o influenciado por el ADR '${dec.id}'`,
        impactType: hasConflict ? 'CONFLICTS' : 'GOVERNS'
      };
    });

    const conflicts = affectedADRs
      .filter(adr => adr.impactType === 'CONFLICTS')
      .map(adr => `Conflicto con ADR obsoleto/contradictorio: ${adr.adrId}`);

    // 9. Generar items de cambio (ChangeItem[])
    const changes: ChangeItem[] = resolvedTargets.map(rt => {
      // Determinar acción
      let action: ChangeItem['action'] = 'MODIFY';
      if (rt.id.endsWith('.spec.ts') || rt.id.endsWith('.test.ts') || rt.id.endsWith('.spec.js') || rt.id.endsWith('.test.js')) {
        action = 'TEST';
      } else if (rt.source === 'graph')  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } else if (intent.action === 'CREATE' && rt.source !== 'git')  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } else if (intent.action === 'DELETE')  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

      // Prioridad: explicit = 1, git = 2, semantic = 3, graph = 4
      let priority = 3;
      if (rt.source === 'explicit') priority = 1;
      else if (rt.source === 'git') priority = 2;
      else if (rt.source === 'graph') priority = 4;

      // Obtener dependencias inmediatas en el grafo
      const dependencies = this.model.relations
        .filter(r => r.from === rt.id && r.type === 'imports')
        .map(r => r.to)
        .sort();

      const reason = rt.source === 'explicit' 
        ? `Archivo modificado/especificado directamente en la solicitud`
        : rt.source === 'git'
          ? `Archivo modificado en el estado Git local`
          : rt.source === 'semantic'
            ? `Detectado por coincidencia semántica con conceptos: ${intent.concepts.join(', ')}`
            : `Detectado mediante expansión del grafo desde un target principal`;

      return {
        path: rt.id,
        action,
        priority,
        reason,
        dependencies,
        evidence: rt.evidence || []
      };
    });

    // 10. Generar recomendaciones estructuradas sustentadas estrictamente por evidencias
    const recommendations: Recommendation[] = [];

    // Recomendación A: Resolver violaciones de gobernanza
    violations.forEach(v => {
      const isTargetOrAffected = targets.includes(v.target) || affectedNodes.includes(v.target);
      if (isTargetOrAffected)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }-${v.ruleId}`,
            text: `Resolver la dependencia prohibida en '${v.target}' que infringe la regla de capas '${v.ruleId}'.`,
            priority: 1,
            evidence: [ev]
          });
        }
      }
    });

    // Recomendación B: Resolver conflictos de ADRs
    affectedADRs.forEach(adr => {
      if (adr.impactType === 'CONFLICTS')  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }`,
            text: `Migrar o reestructurar dependencias asociadas a '${adr.adrId}' debido a que está obsoleto o deprecado.`,
            priority: 2,
            evidence: [ev]
          });
        }
      }
    });

    // Recomendación C: Agregar cobertura de pruebas (missing tests)
    testReport.missing.forEach(target => {
      // Solo sugerimos test si el target es de riesgo medio a crítico
      const targetRisks = riskReport.items.filter(i => i.id.includes(target));
      const hasHighRisk = targetRisks.some(r => r.severity === 'HIGH' || r.severity === 'CRITICAL');
      
      if (hasHighRisk)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }' no posee cobertura de pruebas directas en el grafo`,
          nodeId: target,
          confidence: 1.0
        }] : [];

        // Asegurar que haya evidencia asociada
        const finalEvList = evList.filter(Boolean) as ContextEvidence[];
        if (finalEvList.length > 0)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }`,
            text: `Agregar cobertura de pruebas unitarias directas para el componente crítico modificado: '${target}'.`,
            priority: 2,
            evidence: finalEvList
          });
        }
      }
    });

    // Recomendación D: Refactorización por acoplamiento alto (Fan-in)
    riskReport.items.forEach(item => {
      if (item.category === 'FAN_IN' && item.contribution >= 15)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }`,
          text: `Evaluar refactorización o desacoplamiento de '${targetId}' debido a un alto nivel de dependientes de entrada (Fan-in alto).`,
          priority: 3,
          evidence: item.evidence
        });
      }
    });

    // 11. Consolidar el plan y ordenar determinísticamente todas las colecciones para reproducibilidad byte-for-byte
    const complexity = riskReport.score < 30 ? 'LOW' : riskReport.score < 60 ? 'MEDIUM' : riskReport.score < 80 ? 'HIGH' : 'CRITICAL';
    const changeType = intent.action === 'FIX' ? 'UPDATE' as const : intent.action;

    // Ordenamiento determinista estable final
    changes.sort((a, b) => {
      const prio = a.priority - b.priority;
      if (prio !== 0) return prio;
      return a.path.localeCompare(b.path);
    });

    const finalEvidence = Array.from(evidenceMap.values()).sort((a, b) => {
      const typeComp = a.type.localeCompare(b.type);
      if (typeComp !== 0) return typeComp;
      return a.description.localeCompare(b.description);
    });

    recommendations.sort((a, b) => {
      const prio = a.priority - b.priority;
      if (prio !== 0) return prio;
      return a.id.localeCompare(b.id);
    });

    violations.sort((a, b) => {
      const targetComp = a.target.localeCompare(b.target);
      if (targetComp !== 0) return targetComp;
      return a.ruleId.localeCompare(b.ruleId);
    });

    affectedADRs.sort((a, b) => a.adrId.localeCompare(b.adrId));
    conflicts.sort();

    const missingMapped = testReport.missing.map(
      m => `No se encontró evidencia de cobertura de test mediante el grafo explorado para '${m}'`
    ).sort();

    return {
      task,
      intent,
      targets,
      summary: {
        changeType,
        complexity,
        riskScore: riskReport.score
      },
      changes,
      impact: {
        affectedNodes: aiContext.impact.items.map((i: any) => i.id).sort(),
        dependencies: aiContext.dependencies.dependencies,
        dependents: aiContext.dependencies.dependents,
        boundariesCrossed: aiContext.architecture.boundariesCrossed
      },
      tests: {
        affected: testReport.affected,
        recommended: testReport.recommended,
        missing: missingMapped
      },
      risks: riskReport.items,
      architecture: {
        violations,
        affectedADRs,
        conflicts
      },
      evidence: finalEvidence,
      recommendations
    };
  }
}
