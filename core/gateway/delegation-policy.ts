import { ASAFIntent } from './types';

export enum DelegationMode {
  ASAF_FIRST = 'ASAF_FIRST',
  ASAF_REQUIRED = 'ASAF_REQUIRED',
  ASAF_OPTIONAL = 'ASAF_OPTIONAL',
  IDE_ONLY = 'IDE_ONLY'
}

export class DelegationPolicy {
  public static shouldDelegate(intent: ASAFIntent, mode: DelegationMode = DelegationMode.ASAF_FIRST): boolean  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
    if (mode === DelegationMode.ASAF_REQUIRED)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
    if (mode === DelegationMode.ASAF_OPTIONAL)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

    // ASAF_FIRST (Default): Delegar todo conocimiento de arquitectura, impacto y plan del proyecto
    return true;
  }
}
