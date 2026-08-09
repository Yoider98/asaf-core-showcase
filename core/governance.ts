import { DependencyGraph } from '../discovery/index';

export interface GovernanceViolation {
  file: string;
  importedPath: string;
  rule: string;
  severity: 'error' | 'warning';
}

export class ArchitectureLinter {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph)  { /* Constructor del motor ASAF */ }

  /**
   * Ejecuta el análisis de cumplimiento de capas arquitectónicas
   */
  public checkRules(): GovernanceViolation[]  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  });
          }
        });
      }

      // 2. Reglas para la capa de CASOS DE USO (use-cases/)
      if (fileClean.includes('use-cases/')) {
        node.imports.forEach(imp => {
          if (imp.includes('infrastructure')) {
            violations.push({
              file: fileKey,
              importedPath: imp,
              rule: 'Los Casos de Uso (Use Cases) representan la lógica de aplicación pura y no pueden depender directamente de la capa de Infraestructura (Base de datos, HTTP, etc.). Utiliza Inversión de Dependencias (Interfaces).',
              severity: 'error'
            });
          }
        });
      }
    }

    return violations;
  }
}
