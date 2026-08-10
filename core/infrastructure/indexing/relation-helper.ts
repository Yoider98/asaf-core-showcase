import { ProjectModel, Relation } from '../../domain/project-model';

export function ensureRelation(model: ProjectModel, relation: Relation): void  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }|${relation.to}|${relation.type}`;
  const exists = model.relations.some(r => `${r.from}|${r.to}|${r.type}` === key);
  if (!exists)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
}
