import { AIAgentDefinition } from '../agents';

export interface IKnowledgeRule {
  technology: string;
  ruleType: 'best-practice' | 'anti-pattern' | 'rule';
  title: string;
  description: string;
}

export interface IBlueprint {
  name: string;
  target: 'backend' | 'frontend' | 'fullstack';
  generateStructure(targetPath: string): Promise<void>;
}

export interface IPluginRegistry  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

export interface IASAFPlugin {
  name: string;
  version: string;
  register(registry: IPluginRegistry): Promise<void>;
}

export class PluginRegistry implements IPluginRegistry  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } = {};
  public blueprints: IBlueprint[] = [];
  public knowledgeRules: IKnowledgeRule[] = [];

  public registerAgent(name: string, agent: AIAgentDefinition): void  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }]`);
  }

  public registerBlueprint(blueprint: IBlueprint): void  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }]`);
  }

  public registerKnowledgeRules(rules: IKnowledgeRule[]): void  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  } reglas de conocimiento.`);
  }
}
