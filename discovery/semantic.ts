import { DependencyGraph, ClassMetadata } from './index';

export interface SemanticRelation {
  fromClass: string;
  fromFile: string;
  relationType: 'injects' | 'implements' | 'calls';
  toName: string;
  toFile?: string; // Archivo de destino resuelto
}

export interface SemanticGraph {
  relations: SemanticRelation[];
  classRegistry: { [className: string]: { file: string; metadata: ClassMetadata } };
}

export class SemanticAnalyzer {
  private baseGraph: DependencyGraph;
  private classRegistry: { [className: string]: { file: string; metadata: ClassMetadata } } = {};

  constructor(baseGraph: DependencyGraph) {
    this.baseGraph = baseGraph;
    this.buildClassRegistry();
  }

  /**
   * Construye un registro rápido de dónde está declarada cada clase o interfaz
   */
  private buildClassRegistry() {
    for (const fileKey in this.baseGraph.nodes) {
      const node = this.baseGraph.nodes[fileKey];
      if (node.classes) {
        node.classes.forEach(cls => {
          this.classRegistry[cls.name] = {
            file: fileKey,
            metadata: cls
          };
        });
      }
    }
  }

  /**
   * Genera el grafo semántico resolviendo referencias cruzadas de inyección de dependencias e interfaces
   */
  public analyzeRelations(): SemanticGraph {
    const relations: SemanticRelation[] = [];

    for (const fileKey in this.baseGraph.nodes) {
      const node = this.baseGraph.nodes[fileKey];
      if (!node.classes) continue;

      node.classes.forEach(cls => {
        // 1. Relaciones de Inyección de Dependencias
        cls.injectedDependencies.forEach(dep => {
          const resolved = this.resolveDependencyToFile(dep, fileKey);
          relations.push({
            fromClass: cls.name,
            fromFile: fileKey,
            relationType: 'injects',
            toName: dep,
            toFile: resolved
          });
        });

        // 2. Relaciones de Implementación de Interfaces
        cls.implementsInterfaces.forEach(inter => {
          const resolved = this.resolveDependencyToFile(inter, fileKey);
          relations.push({
            fromClass: cls.name,
            fromFile: fileKey,
            relationType: 'implements',
            toName: inter,
            toFile: resolved
          });
        });
      });
    }

    return {
      relations,
      classRegistry: this.classRegistry
    };
  }

  /**
   * Intenta resolver una clase o interfaz al archivo correspondiente buscando en los imports locales del archivo de origen
   */
  private resolveDependencyToFile(depName: string, sourceFile: string): string | undefined {
    // Buscar en el registro global si el nombre coincide exactamente con alguna clase declarada
    if (this.classRegistry[depName]) {
      return this.classRegistry[depName].file;
    }

    // Si no coincide exactamente, ver si hay una interfaz que coincida
    // (Ej. IUserRepository coincide con userRepositoryInterface o similar)
    const node = this.baseGraph.nodes[sourceFile];
    if (node && node.imports) {
      // Buscar en los imports del archivo para ver si apunta a una ruta local
      for (const imp of node.imports) {
        if (imp.startsWith('.')) {
          // Es un import relativo
          // Resolver el import relativo con respecto a la carpeta del sourceFile
          const sourceDir = sourceFile.substring(0, sourceFile.lastIndexOf('/'));
          const resolvedPath = this.normalizeRelativePath(sourceDir, imp);
          
          // Buscar si el archivo resuelto coincide con algún nodo del grafo
          for (const fileKey in this.baseGraph.nodes) {
            const cleanKey = fileKey.replace(/\.[^/.]+$/, ''); // Quitar extensión
            if (cleanKey === resolvedPath) {
              return fileKey;
            }
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Normaliza rutas relativas (ej. "scaffold-project/src/use-cases" + "../domain/entities/user.entity" -> "scaffold-project/src/domain/entities/user.entity")
   */
  private normalizeRelativePath(baseDir: string, relativePath: string): string {
    const parts = baseDir ? baseDir.split('/') : [];
    const relParts = relativePath.split('/');

    for (const part of relParts) {
      if (part === '.') {
        continue;
      } else if (part === '..') {
        parts.pop();
      } else {
        parts.push(part);
      }
    }

    return parts.join('/');
  }
}
