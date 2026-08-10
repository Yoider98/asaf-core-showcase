import * as fs from 'fs';
import * as path from 'path';

export class FileScanner {
  private excludeDirs = new Set(['node_modules', 'dist', 'build', '.git', '.asaf', 'coverage', 'showcase-dist']);

  public async scan(projectPath: string): Promise<string[]>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

  private scanRecursive(dirPath: string, rootPath: string, filesList: string[])  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } else {
        const ext = path.extname(item).toLowerCase();
        if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
          filesList.push(relativePath);
        }
      }
    }
  }
}
