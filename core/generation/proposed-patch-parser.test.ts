import { ProposedPatchParser } from './proposed-patch-parser';
import { LLMGenerationError } from './types';

describe('ProposedPatchParser Tests', () => {
  test('Should parse direct JSON array of patches', () => {
    const output = `
    [
      {
        "filePath": "src/auth/service.ts",
        "action": "MODIFY",
        "content": "const jwt = require('jsonwebtoken');"
      },
      {
        "filePath": "src/auth/service.test.ts",
        "action": "CREATE",
        "content": "describe('auth', () => {});"
      }
    ]
    `;

    const patches = ProposedPatchParser.parse(output);
    expect(patches).toHaveLength(2);
    expect(patches[0]).toEqual({
      filePath: 'src/auth/service.ts',
      action: 'MODIFY',
      expectedHashBefore: null,
      content: "const jwt = require('jsonwebtoken');"
    });
    expect(patches[1]).toEqual({
      filePath: 'src/auth/service.test.ts',
      action: 'CREATE',
      expectedHashBefore: null,
      content: "describe('auth', () => {});"
    });
  });

  test('Should parse JSON wrapped in markdown code blocks', () => {
    const output = `
    Some conversational text from LLM...
    \`\`\`json
    [
      {
        "filePath": "src/main.ts",
        "action": "DELETE"
      }
    ]
    \`\`\`
    More conversational text.
    `;

    const patches = ProposedPatchParser.parse(output);
    expect(patches).toHaveLength(1);
    expect(patches[0]).toEqual({
      filePath: 'src/main.ts',
      action: 'DELETE',
      expectedHashBefore: null,
      content: undefined
    });
  });

  test('Should throw LLM_PARSE_ERROR if output is empty', () => {
    try {
      ProposedPatchParser.parse('   ');
      fail('Should have thrown LLMGenerationError');
    } catch (e: any)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('Should throw LLM_PARSE_ERROR if output does not contain JSON array', () => {
    const output = `
    Here is the code:
    \`\`\`typescript
    const a = 12;
    \`\`\`
    `;
    try {
      ProposedPatchParser.parse(output);
      fail('Should have thrown LLMGenerationError');
    } catch (e: any)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('Should throw LLM_PARSE_ERROR if json is malformed', () => {
    const output = `
    \`\`\`json
    [
      {
        "filePath": "src/main.ts",
        "action": "MODIFY",
        "content": "missing quote here
      }
    ]
    \`\`\`
    `;
    try {
      ProposedPatchParser.parse(output);
      fail('Should have thrown LLMGenerationError');
    } catch (e: any)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('Should throw LLM_PARSE_ERROR if item is not an object', () => {
    const output = `
    \`\`\`json
    [
      "just a string"
    ]
    \`\`\`
    `;
    try {
      ProposedPatchParser.parse(output);
      fail('Should have thrown LLMGenerationError');
    } catch (e: any)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('Should throw LLM_PARSE_ERROR if filePath is invalid', () => {
    const output = `
    \`\`\`json
    [
      {
        "filePath": 123,
        "action": "CREATE",
        "content": ""
      }
    ]
    \`\`\`
    `;
    try {
      ProposedPatchParser.parse(output);
      fail('Should have thrown LLMGenerationError');
    } catch (e: any)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('Should throw LLM_PARSE_ERROR if action is invalid', () => {
    const output = `
    \`\`\`json
    [
      {
        "filePath": "src/main.ts",
        "action": "UPDATE",
        "content": ""
      }
    ]
    \`\`\`
    `;
    try {
      ProposedPatchParser.parse(output);
      fail('Should have thrown LLMGenerationError');
    } catch (e: any)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('Should throw LLM_PARSE_ERROR if content is missing on CREATE/MODIFY', () => {
    const output = `
    \`\`\`json
    [
      {
        "filePath": "src/main.ts",
        "action": "MODIFY"
      }
    ]
    \`\`\`
    `;
    try {
      ProposedPatchParser.parse(output);
      fail('Should have thrown LLMGenerationError');
    } catch (e: any)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });
});
