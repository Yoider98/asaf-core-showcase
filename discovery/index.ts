import * as fs from 'fs';
import * as path from 'path';
import { LanguageAdapter } from './core/adapter';
import { TypeScriptAdapter } from './languages/typescript-adapter';
import { PythonAdapter } from './languages/python-adapter';

export interface ClassMetadata {
  name: string;
  methods: string[];
  decorators: string[];
  injectedDependencies: string[]; // Tipos inyectados en el constructor
  implementsInterfaces: string[];
}

export interface DependencyNode {
  id: string;
  type: 'file' | 'package' | 'external';
  language?: string;
  size?: number;
  imports: string[];
  classes: ClassMetadata[];
}

export interface DependencyGraph {
  nodes: { [key: string]: DependencyNode };
  metadata: {
    projectPath: string;
    detectedLanguages: string[];
    dependencies: { [key: string]: string };
    devDependencies: { [key: string]: string };
  };
}

export class DiscoveryEngine {
  private projectPath: string;
  private excludeList: string[];
  private graph: DependencyGraph;
  private adapters: LanguageAdapter[];

  constructor(projectPath: string, exclude: string[] = ['node_modules', 'dist', '.git']) {
    this.projectPath = projectPath;
    this.excludeList = exclude;
    this.graph = {
      nodes: {},
      metadata: {
        projectPath,
        detectedLanguages: [],
        dependencies: {},
        devDependencies: {}
      }
    };
    this.adapters = [
      new TypeScriptAdapter(),
      new PythonAdapter()
    ];
  }

  public analyze(): DependencyGraph {
    this.analyzePackageJson();
    this.scanDirectory(this.projectPath);
    return this.graph;
  }

  private analyzePackageJson() {
    const pkgPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        this.graph.metadata.dependencies = pkg.dependencies || {};
        this.graph.metadata.devDependencies = pkg.devDependencies || {};
      } catch (err) {
        console.error('Error parsing package.json:', err);
      }
    }
  }

  private scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    const languages = new Set<string>();

    for (const file of files) {
      if (this.excludeList.includes(file)) continue;

      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.scanDirectory(fullPath);
      } else {
        const ext = path.extname(file).toLowerCase();
        let language = '';
        if (ext === '.ts') language = 'TypeScript';
        else if (ext === '.js') language = 'JavaScript';
        else if (ext === '.json') language = 'JSON';
        else if (ext === '.md') language = 'Markdown';
        else if (ext === '.yml' || ext === '.yaml') language = 'YAML';
        else if (ext === '.py') language = 'Python';

        if (language) {
          languages.add(language);
        }

        // Buscar un adaptador capaz de analizar el archivo
        const adapter = this.adapters.find(a => a.canAnalyze(file));
        if (adapter) {
          const relativePath = path.relative(this.projectPath, fullPath).replace(/\\/g, '/');
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          try {
            const parsed = adapter.analyze(fullPath, content);
            this.graph.nodes[relativePath] = {
              id: relativePath,
              type: 'file',
              language,
              size: stat.size,
              imports: parsed.imports,
              classes: parsed.classes
            };
          } catch (err) {
            console.error(`Error analyzing file ${relativePath}:`, err);
          }
        }
      }
    }

    // Combinar lenguajes detectados
    languages.forEach(lang => {
      if (!this.graph.metadata.detectedLanguages.includes(lang)) {
        this.graph.metadata.detectedLanguages.push(lang);
      }
    });
  }
}
