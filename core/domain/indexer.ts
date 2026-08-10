import { ProjectModel } from './project-model';

export type FileChangeType = 'added' | 'modified' | 'deleted' | 'renamed';

export interface FileChange {
  type: FileChangeType;
  path: string;
  previousPath?: string;
}

export interface ProjectIndexer {
  index(): Promise<ProjectModel>;
  update(model: ProjectModel, changes: FileChange[]): Promise<ProjectModel>;
}

export interface SymbolResolver  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
