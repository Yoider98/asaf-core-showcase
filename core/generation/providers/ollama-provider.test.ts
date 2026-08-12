import { LLMProviderFactory } from '../llm-provider';
import { OllamaProvider } from './ollama-provider';
import { LLMGenerationError } from '../types';

describe('OllamaProvider & LLMProviderFactory Tests', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('Should be registered in LLMProviderFactory', () => {
    const provider = LLMProviderFactory.create({
      provider: 'ollama',
      model: 'qwen2.5-coder:7b'
    });
    expect(provider).toBeInstanceOf(OllamaProvider);
    expect(provider.getConfig().model).toBe('qwen2.5-coder:7b');
  });

  test('ping() should return true if host is reachable and model exists', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: 'qwen2.5-coder:7b' },
          { name: 'llama3:latest' }
        ]
      })
    });

    const provider = LLMProviderFactory.create({
      provider: 'ollama',
      model: 'qwen2.5-coder:7b'
    });

    const active = await provider.ping();
    expect(active).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:11434/api/tags', expect.any(Object));
  });

  test('ping() should return false if host is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

    const provider = LLMProviderFactory.create({
      provider: 'ollama',
      model: 'qwen2.5-coder:7b'
    });

    const active = await provider.ping();
    expect(active).toBe(false);
  });

  test('ping() should return false if model is not downloaded', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: 'llama3:latest' }
        ]
      })
    });

    const provider = LLMProviderFactory.create({
      provider: 'ollama',
      model: 'qwen2.5-coder:7b'
    });

    const active = await provider.ping();
    expect(active).toBe(false);
  });

  test('generate() should throw LLM_PROVIDER_UNAVAILABLE if tag check fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));

    const provider = LLMProviderFactory.create({
      provider: 'ollama',
      model: 'qwen2.5-coder:7b'
    });

    try {
      await provider.generate('Hello');
      fail('Should have thrown LLMGenerationError');
    } catch (e: any)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('generate() should throw LLM_MODEL_NOT_FOUND if model is missing in tags', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: 'llama3:latest' }
        ]
      })
    });

    const provider = LLMProviderFactory.create({
      provider: 'ollama',
      model: 'qwen2.5-coder:7b'
    });

    try {
      await provider.generate('Hello');
      fail('Should have thrown LLMGenerationError');
    } catch (e: any)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('generate() should throw LLM_TIMEOUT if request aborts', async () => {
    // Primera llamada (tags) exitosa, segunda llamada (generate) falla por timeout (AbortError)
    const mockFetch = jest.fn();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: [{ name: 'qwen2.5-coder:7b' }]
      })
    });
    
    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);
    
    global.fetch = mockFetch;

    const provider = LLMProviderFactory.create({
      provider: 'ollama',
      model: 'qwen2.5-coder:7b',
      timeoutMs: 100
    });

    try {
      await provider.generate('Hello');
      fail('Should have thrown LLMGenerationError');
    } catch (e: any)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
  });

  test('generate() should return structured text and usage on success', async () => {
    const mockFetch = jest.fn();
    // 1. tags call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: [{ name: 'qwen2.5-coder:7b' }]
      })
    });
    // 2. generate call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: 'Generated Code Response',
        prompt_eval_count: 50,
        eval_count: 150
      })
    });

    global.fetch = mockFetch;

    const provider = LLMProviderFactory.create({
      provider: 'ollama',
      model: 'qwen2.5-coder:7b'
    });

    const response = await provider.generate('Generate function', 'You are a coder');
    expect(response.text).toBe('Generated Code Response');
    expect(response.usage).toEqual({
      promptTokens: 50,
      completionTokens: 150
    });

    expect(mockFetch).toHaveBeenLastCalledWith(
      'http://127.0.0.1:11434/api/generate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'qwen2.5-coder:7b',
          prompt: 'Generate function',
          stream: false,
          options: { temperature: 0.2 },
          system: 'You are a coder'
        })
      })
    );
  });

  test('generate() should throw LLM_INVALID_RESPONSE if response text is empty', async () => {
    const mockFetch = jest.fn();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: [{ name: 'qwen2.5-coder:7b' }]
      })
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: '   '
      })
    });

    global.fetch = mockFetch;

    const provider = LLMProviderFactory.create({
      provider: 'ollama',
      model: 'qwen2.5-coder:7b'
    });

    await expect(provider.generate('Hello')).rejects.toThrow(
      new LLMGenerationError('LLM_INVALID_RESPONSE', 'Ollama generation request returned an empty text response.')
    );
  });
});
