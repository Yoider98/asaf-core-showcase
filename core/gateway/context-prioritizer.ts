import { SliceLevel } from '../context/context-types';
import * as path from 'path';

export interface CodeSliceCandidate {
  filePath: string;
  content: string;
  level: SliceLevel;
  size: number;
}

export interface PrioritizedSlice extends CodeSliceCandidate {
  priority: number; // 0 (menor) a 100 (mayor)
  category: 'TARGET' | 'DIRECT_DEPENDENCY' | 'HIGH_IMPACT' | 'STRUCTURAL_SUPPORT' | 'INDIRECT_DEPENDENCY' | 'TEST' | 'OTHER';
}

export class ContextPrioritizer {
  public static prioritize(
    slices: CodeSliceCandidate[],
    targets: string[],
    dependencies: string[],
    impactFiles: string[],
    testFiles: string[]
  ): PrioritizedSlice[]  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } else if (depSet.has(filePath)) {
        priority = 85;
        category = 'DIRECT_DEPENDENCY';
      } else if (impactSet.has(filePath)) {
        priority = 70;
        category = 'HIGH_IMPACT';
      } else if (base.includes('interface') || base.includes('type') || base.includes('config') || base.includes('mapper')) {
        priority = 55;
        category = 'STRUCTURAL_SUPPORT';
      } else if (testSet.has(filePath) || base.endsWith('.test.ts') || base.endsWith('.spec.ts') || base.endsWith('.test.js')) {
        priority = 20;
        category = 'TEST';
      } else {
        priority = 40;
        category = 'INDIRECT_DEPENDENCY';
      }

      return {
        ...slice,
        priority,
        category
      };
    });

    // Ordenar de forma determinista estable: primero por prioridad (descendente), luego por path alfabéticamente
    return prioritized.sort((a, b) => {
      if (b.priority !== a.priority)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
      return a.filePath.localeCompare(b.filePath);
    });
  }
}
