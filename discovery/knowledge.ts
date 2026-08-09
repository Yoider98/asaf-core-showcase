import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { DependencyGraph } from './index';
import { SemanticGraph } from './semantic';

export interface FileGitMetadata {
  commitCount: number;
  lastModified: string;
  authors: string[];
}

export interface ADRMetadata {
  id: string;
  title: string;
  status: string;
  category: string;
  recommendation: string;
  file: string;
}

export interface KnowledgeGraph {
  semanticGraph: SemanticGraph;
  gitMetadata: { [filePath: string]: FileGitMetadata };
  adrs: ADRMetadata[];
  timestamp: string;
}

export class KnowledgeGraphBuilder {
  private projectPath: string;
  private baseGraph: DependencyGraph;
  private semanticGraph: SemanticGraph;

  constructor(projectPath: string, baseGraph: DependencyGraph, semanticGraph: SemanticGraph) {
    this.projectPath = projectPath;
    this.baseGraph = baseGraph;
    this.semanticGraph = semanticGraph;
  }

  public build(): KnowledgeGraph {
    const gitMetadata = this.collectGitMetadata();
    const adrs = this.collectADRMetadata();

    return {
      semanticGraph: this.semanticGraph,
      gitMetadata,
      adrs,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Recopila metadatos de Git sobre commits y autores para los archivos del proyecto
   */
  private collectGitMetadata(): { [filePath: string]: FileGitMetadata } {
    const metadata: { [filePath: string]: FileGitMetadata } = {};

    // Verificar si es repositorio Git
    let isGit = false;
    try {
      execSync('git rev-parse --is-inside-work-tree', { cwd: this.projectPath, stdio: 'ignore' });
      isGit = true;
    } catch {}

    if (!isGit) return metadata;

    for (const fileKey in this.baseGraph.nodes) {
      try {
        // Obtener cantidad de commits y última fecha de modificación
        const commitCountStr = execSync(`git rev-list --count HEAD -- "${fileKey}"`, {
          cwd: this.projectPath,
          encoding: 'utf-8'
        }).trim();

        const lastModified = execSync(`git log -1 --format=%cI -- "${fileKey}"`, {
          cwd: this.projectPath,
          encoding: 'utf-8'
        }).trim();

        // Autores del archivo
        const authorsStr = execSync(`git log --format="%an" -- "${fileKey}"`, {
          cwd: this.projectPath,
          encoding: 'utf-8'
        }).trim();

        const authors = authorsStr 
          ? Array.from(new Set(authorsStr.split('\n').map(a => a.trim().replace(/"/g, ''))))
          : [];

        metadata[fileKey] = {
          commitCount: parseInt(commitCountStr, 10) || 0,
          lastModified,
          authors
        };
      } catch {
        // Archivo nuevo o no trackeado
        metadata[fileKey] = {
          commitCount: 0,
          lastModified: new Date().toISOString(),
          authors: []
        };
      }
    }

    return metadata;
  }

  /**
   * Escanea docs/adr/ para extraer metadatos de las decisiones de arquitectura registradas
   */
  private collectADRMetadata(): ADRMetadata[] {
    const adrs: ADRMetadata[] = [];
    const adrDir = path.join(this.projectPath, 'docs', 'adr');

    if (!fs.existsSync(adrDir)) {
      return adrs;
    }

    try {
      const files = fs.readdirSync(adrDir);
      for (const file of files) {
        if (file.startsWith('ADR-') && file.endsWith('.md')) {
          const filePath = path.join(adrDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');

          const idMatch = file.match(/^ADR-(\d+)/);
          const id = idMatch ? idMatch[1] : '';

          const titleMatch = content.match(/# ADR-\d+:\s*(.+)/);
          const title = titleMatch ? titleMatch[1].trim() : file;

          const statusMatch = content.match(/\*\s+\*\*Estado\*\*:\s*(.+)/i);
          const status = statusMatch ? statusMatch[1].trim() : 'Desconocido';

          const categoryMatch = content.match(/\*\s+\*\*Decisión\*\*:\s*Se decide utilizar \*\*(.+)\*\* para la categoría de \*\*(.+)\*\*/i);
          const recommendation = categoryMatch ? categoryMatch[1].trim() : '';
          const category = categoryMatch ? categoryMatch[2].trim() : '';

          adrs.push({
            id,
            title,
            status,
            category,
            recommendation,
            file: path.relative(this.projectPath, filePath).replace(/\\/g, '/')
          });
        }
      }
    } catch (err) {
      console.error('Error recopilando ADRs:', err);
    }

    return adrs;
  }
}
