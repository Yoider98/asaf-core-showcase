import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

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

        if (['.ts', '.js', '.py'].includes(ext)) {
          const relativePath = path.relative(this.projectPath, fullPath).replace(/\\/g, '/');
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          let imports: string[] = [];
          let classes: ClassMetadata[] = [];

          if (ext === '.py') {
            const parsed = this.analyzePythonCode(content);
            imports = parsed.imports;
            classes = parsed.classes;
          } else {
            const parsed = this.analyzeAST(fullPath, content);
            imports = parsed.imports;
            classes = parsed.classes;
          }

          this.graph.nodes[relativePath] = {
            id: relativePath,
            type: 'file',
            language,
            size: stat.size,
            imports,
            classes
          };
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

  /**
   * Analiza el archivo usando el compilador de TypeScript (AST)
   */
  private analyzeAST(filePath: string, content: string): { imports: string[]; classes: ClassMetadata[] } {
    const imports: string[] = [];
    const classes: ClassMetadata[] = [];

    // Crear el archivo fuente AST
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const visit = (node: ts.Node) => {
      // 1. Capturar importaciones
      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          imports.push(node.moduleSpecifier.text);
        }
      }

      // 2. Capturar require/CommonJS
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
        const call = node.initializer;
        if (ts.isIdentifier(call.expression) && call.expression.text === 'require') {
          const arg = call.arguments[0];
          if (arg && ts.isStringLiteral(arg)) {
            imports.push(arg.text);
          }
        }
      }

      // 3. Capturar Clases y Estructuras Semánticas
      if (ts.isClassDeclaration(node)) {
        const className = node.name ? node.name.text : 'AnonymousClass';
        const methods: string[] = [];
        const decorators: string[] = [];
        const injectedDependencies: string[] = [];
        const implementsInterfaces: string[] = [];

        // Decorators de la clase
        if (node.modifiers) {
          node.modifiers.forEach(modifier => {
            if (ts.isDecorator(modifier)) {
              const expr = modifier.expression;
              if (ts.isIdentifier(expr)) {
                decorators.push(expr.text);
              } else if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
                decorators.push(expr.expression.text);
              }
            }
          });
        }

        // Interfaces implementadas (heritage clauses)
        if (node.heritageClauses) {
          node.heritageClauses.forEach(clause => {
            if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
              clause.types.forEach(t => {
                if (ts.isIdentifier(t.expression)) {
                  implementsInterfaces.push(t.expression.text);
                }
              });
            }
          });
        }

        // Métodos e inyección de dependencias
        node.members.forEach(member => {
          if (ts.isMethodDeclaration(member) && member.name) {
            if (ts.isIdentifier(member.name)) {
              methods.push(member.name.text);
            }
          }

          // Constructor para inyección de dependencias
          if (ts.isConstructorDeclaration(member)) {
            member.parameters.forEach(param => {
              if (param.type && ts.isTypeReferenceNode(param.type)) {
                if (ts.isIdentifier(param.type.typeName)) {
                  injectedDependencies.push(param.type.typeName.text);
                }
              }
            });
          }
        });

        classes.push({
          name: className,
          methods,
          decorators,
          injectedDependencies,
          implementsInterfaces
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return { imports, classes };
  }

  /**
   * Analiza de forma básica archivos Python utilizando expresiones regulares para extraer dependencias e información semántica
   */
  private analyzePythonCode(content: string): { imports: string[]; classes: ClassMetadata[] } {
    const imports: string[] = [];
    const classes: ClassMetadata[] = [];

    // 1. Extraer importaciones en Python: "import os", "from flask import Flask", "import numpy as np"
    const importRegex = /^\s*(?:import\s+([\w\d_, ]+)|from\s+([\w\d_.]+)\s+import\s+([\w\d_, *()]+))/gm;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        // "import X, Y"
        match[1].split(',').forEach(imp => imports.push(imp.trim()));
      } else if (match[2]) {
        // "from X import Y"
        imports.push(match[2].trim());
      }
    }

    // 2. Extraer clases e identificar métodos indentados en Python
    const classLines = content.split('\n');
    let currentClass: ClassMetadata | null = null;

    classLines.forEach(line => {
      // Detección de clases: "class User(BaseModel):" o "class Order:"
      const classMatch = line.match(/^\s*class\s+([\w\d_]+)(?:\(([\w\d_, ]+)\))?\s*:/);
      if (classMatch) {
        if (currentClass) {
          classes.push(currentClass);
        }
        currentClass = {
          name: classMatch[1],
          methods: [],
          decorators: [],
          injectedDependencies: [],
          implementsInterfaces: classMatch[2] ? classMatch[2].split(',').map(i => i.trim()) : []
        };
      }

      // Detección de métodos indentados dentro de la clase actual
      if (currentClass) {
        const methodMatch = line.match(/^\s+def\s+([\w\d_]+)\s*\(/);
        if (methodMatch) {
          currentClass.methods.push(methodMatch[1]);
        }
      }
    });

    if (currentClass) {
      classes.push(currentClass);
    }

    return { imports, classes };
  }
}
