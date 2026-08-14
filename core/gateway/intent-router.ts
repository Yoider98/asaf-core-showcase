import { ASAFIntent, ASAFRequest } from './types';

export class ASAFIntentRouter {
  public static route(request: ASAFRequest): ASAFIntent  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

    const taskLower = request.task.toLowerCase();
    
    if (
      taskLower.includes('estructura') || 
      taskLower.includes('donde') || 
      taskLower.includes('dónde') || 
      taskLower.includes('funciona') || 
      taskLower.includes('explica')
    ) {
      return 'UNDERSTAND';
    }
    if (taskLower.includes('impacto') || taskLower.includes('romper') || taskLower.includes('rompe')) {
      return 'IMPACT_ANALYSIS';
    }
    if (taskLower.includes('plan') || taskLower.includes('como implementar') || taskLower.includes('cómo implementar')) {
      return 'PLAN';
    }
    if (taskLower.includes('implementa') || taskLower.includes('genera') || taskLower.includes('crea')) {
      return 'GENERATE';
    }
    if (taskLower.includes('valida') || taskLower.includes('comprueba') || taskLower.includes('verificar')) {
      return 'VALIDATE';
    }
    if (taskLower.includes('ejecuta') || taskLower.includes('aplica')) {
      return 'EXECUTE';
    }

    return 'ANALYZE';
  }
}
