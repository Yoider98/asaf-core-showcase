import { LLMProvider } from './llm-provider';
import { ProviderDescriptor, ProviderDiagnostic, RecoveryAction } from './types';

export enum AgentTransport {
  CLI = 'CLI',
  HTTP = 'HTTP',
  GRPC = 'GRPC',
  MCP = 'MCP',
  SOCKET = 'SOCKET',
  CUSTOM = 'CUSTOM'
}

export interface IDEAgentConfig {
  endpoint?: string;
  transport?: AgentTransport;
  workspaceId?: string;
  projectId?: string;
  customParams?: Record<string, string>;
}

export interface IDEAgentProvider extends LLMProvider {
  getTransport(): AgentTransport;
  configure(config: IDEAgentConfig): Promise<void>;
  validateConfiguration(): Promise< {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }>;
  diagnose(projectDir: string): Promise<ProviderDiagnostic>;
  getRecoveryActions(projectDir: string): Promise<RecoveryAction[]>;
}

export class IDEAgentRegistry  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  };

  public static register(id: string, providerClass: new (config: any) => IDEAgentProvider): void {
    this.registeredAgents[id.toLowerCase()] = providerClass;
  }

  public static getRegisteredAgents(): string[]  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

  public static getAgentClass(id: string): (new (config: any) => IDEAgentProvider) | null  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

  public static createAgent(id: string, config: any): IDEAgentProvider | null  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
}
