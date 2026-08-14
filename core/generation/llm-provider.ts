import { LLMResponse, LLMConfig, ProviderDescriptor } from './types';

export interface LLMProvider {
  /**
   * Envía una petición de texto al LLM.
   */
  generate(prompt: string, systemPrompt?: string): Promise<LLMResponse>;

  /**
   * Comprueba si el proveedor y el modelo configurado están disponibles.
   */
  ping(): Promise<boolean>;

  /**
   * Obtiene la configuración del proveedor de LLM.
   */
  getConfig(): LLMConfig;

  /**
   * Realiza el auto-descubrimiento del proveedor en el entorno local.
   */
  discover(projectDir: string): Promise<ProviderDescriptor>;
}

export class LLMProviderFactory  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  };

  public static register(
    name: string,
    providerClass: new (config: LLMConfig) => LLMProvider
  ): void {
    this.registeredProviders[name.toLowerCase()] = providerClass;
  }

  public static getRegisteredProviders(): string[]  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

  public static getProviderClass(name: string): (new (config: LLMConfig) => LLMProvider) | undefined  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

  public static create(config: LLMConfig): LLMProvider  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }' is not registered or supported.`);
    }

    return new ProviderClass(config);
  }
}
