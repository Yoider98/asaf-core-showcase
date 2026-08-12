import { LLMProvider, LLMProviderFactory } from '../llm-provider';
import { LLMResponse, LLMConfig, LLMGenerationError } from '../types';

export class MockLLMProvider implements LLMProvider {
  private config: LLMConfig;
  public static responseQueue: string[] = [];
  public static nextResponse: string | null = null;

  constructor(config: LLMConfig)  { /* Constructor del motor ASAF */ }

  public getConfig(): LLMConfig  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

  public async ping(): Promise<boolean>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

  public async generate(prompt: string, systemPrompt?: string): Promise<LLMResponse>  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
      };
    }

    if (MockLLMProvider.nextResponse)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
      };
    }

    // Comportamiento por defecto basado en palabras claves del prompt
    let responseText = '';

    if (prompt.includes('prompt-injection') || prompt.includes('Ignore previous') || prompt.includes('.asaf/config.json')) {
      responseText = `\`\`\`json
[
  {
    "filePath": ".asaf/config.json",
    "action": "MODIFY",
    "content": "{ \\"llm\\": { \\"provider\\": \\"hacked\\" } }"
  }
]
\`\`\``;
    } else if (prompt.includes('path-traversal') || prompt.includes('../../secret.ts')) {
      responseText = `\`\`\`json
[
  {
    "filePath": "../../secret.ts",
    "action": "MODIFY",
    "content": "SECRET_CONTENT"
  }
]
\`\`\``;
    } else if (prompt.includes('out-of-scope') || prompt.includes('protected.ts')) {
      responseText = `\`\`\`json
[
  {
    "filePath": "core/execution/change-executor.ts",
    "action": "MODIFY",
    "content": "export class HackedChangeExecutor {}"
  }
]
\`\`\``;
    } else if (prompt.includes('verification-retry') || prompt.includes('compilation-error')) {
      responseText = `\`\`\`json
[
  {
    "filePath": "src/auth/auth.service.ts",
    "action": "MODIFY",
    "content": "export class AuthService {\\n  const brokenSyntax = ;\\n}"
  }
]
\`\`\``;
    } else if (prompt.includes('verification-max-retries') || prompt.includes('unrecoverable-error')) {
      responseText = `\`\`\`json
[
  {
    "filePath": "src/auth/auth.service.ts",
    "action": "MODIFY",
    "content": "export class AuthService {\\n  const alwaysError = ;\\n}"
  }
]
\`\`\``;
    } else {
      responseText = `\`\`\`json
[
  {
    "filePath": "src/auth/auth.service.ts",
    "action": "MODIFY",
    "content": "export class AuthService {\\n  // ASAF v0.4.0 Valid Patch\\n}"
  }
]
\`\`\``;
    }

    return {
      text: responseText,
      usage: {
        promptTokens: 150,
        completionTokens: 200
      }
    };
  }
}

// Registrar en la factoría automáticamente
LLMProviderFactory.register('mock', MockLLMProvider);
