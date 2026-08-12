import { VerificationLoop } from './verification-loop';
import { PatchGenerator, GenerationProposal } from './patch-generator';
import { ProposalSimulationEngine } from '../planning/proposal-simulation-engine';
import { LLMGenerationError } from './types';
import { ChangePlan } from '../reasoning/types';
import { ProjectModel } from '../domain/project-model';

describe('VerificationLoop Tests', () => {
  let mockGenerator: jest.Mocked<PatchGenerator>;
  let mockSimulationEngine: jest.Mocked<ProposalSimulationEngine>;

  const changePlanMock = {} as ChangePlan;
  const projectModelMock = {} as ProjectModel;

  beforeEach(() => {
    mockGenerator = {
      generateProposal: jest.fn()
    } as any;

    mockSimulationEngine = {
      simulateProposal: jest.fn()
    } as any;
  });

  test('Should return immediately if the first proposal passes simulation', async () => {
    const mockProposal: GenerationProposal = {
      id: 'prop-1',
      changePlanTask: 'test',
      contextHash: 'hash',
      promptVersion: 'v1',
      provider: 'mock',
      model: 'm1',
      patches: [],
      warnings: [],
      createdAt: ''
    };

    mockGenerator.generateProposal.mockResolvedValue(mockProposal);
    mockSimulationEngine.simulateProposal.mockReturnValue({
      isValid: true,
      delta: {} as any,
      violationsIntroduced: [],
      errors: [],
      dependenciesAdded: [],
      dependenciesRemoved: [],
      affectedFiles: [],
      scopeViolations: []
    });

    const loop = new VerificationLoop(mockGenerator, mockSimulationEngine);
    const result = await loop.run(changePlanMock, projectModelMock);

    expect(result).toBe(mockProposal);
    expect(mockGenerator.generateProposal).toHaveBeenCalledTimes(1);
    expect(mockSimulationEngine.simulateProposal).toHaveBeenCalledTimes(1);
  });

  test('Should retry and succeed on second attempt after simulation failure', async () => {
    const mockProposalFail: GenerationProposal = {
      id: 'prop-fail',
      changePlanTask: 'test',
      contextHash: 'hash',
      promptVersion: 'v1',
      provider: 'mock',
      model: 'm1',
      patches: [{ filePath: 'src/bad.ts', action: 'MODIFY', expectedHashBefore: null, content: 'bad' }],
      warnings: [],
      createdAt: ''
    };

    const mockProposalSuccess: GenerationProposal = {
      id: 'prop-success',
      changePlanTask: 'test',
      contextHash: 'hash',
      promptVersion: 'v1',
      provider: 'mock',
      model: 'm1',
      patches: [{ filePath: 'src/good.ts', action: 'MODIFY', expectedHashBefore: null, content: 'good' }],
      warnings: [],
      createdAt: ''
    };

    // Primera llamada devuelve propuesta mala, segunda llamada devuelve propuesta buena
    mockGenerator.generateProposal
      .mockResolvedValueOnce(mockProposalFail)
      .mockResolvedValueOnce(mockProposalSuccess);

    // Primera simulación falla, segunda simulación pasa
    mockSimulationEngine.simulateProposal
      .mockReturnValueOnce({
        isValid: false,
        delta: {} as any,
        violationsIntroduced: [],
        errors: ['Import rule violation'],
        dependenciesAdded: [],
        dependenciesRemoved: [],
        affectedFiles: [],
        scopeViolations: []
      })
      .mockReturnValueOnce({
        isValid: true,
        delta: {} as any,
        violationsIntroduced: [],
        errors: [],
        dependenciesAdded: [],
        dependenciesRemoved: [],
        affectedFiles: [],
        scopeViolations: []
      });

    const loop = new VerificationLoop(mockGenerator, mockSimulationEngine);
    const result = await loop.run(changePlanMock, projectModelMock);

    expect(result).toBe(mockProposalSuccess);
    expect(mockGenerator.generateProposal).toHaveBeenCalledTimes(2);
    expect(mockSimulationEngine.simulateProposal).toHaveBeenCalledTimes(2);

    // Comprobar que en el segundo intento se le pasó el previousErrors conteniendo el feedback
    expect(mockGenerator.generateProposal).toHaveBeenLastCalledWith(
      changePlanMock,
      projectModelMock,
      30000,
      ['Intento 1 falló validación estructural: Import rule violation']
    );
  });

  test('Should retry and succeed on second attempt after parsing/sanitizer failure in generator', async () => {
    const mockProposalSuccess: GenerationProposal = {
      id: 'prop-success',
      changePlanTask: 'test',
      contextHash: 'hash',
      promptVersion: 'v1',
      provider: 'mock',
      model: 'm1',
      patches: [],
      warnings: [],
      createdAt: ''
    };

    // Primera llamada lanza error de parsing, segunda llamada éxito
    mockGenerator.generateProposal
      .mockRejectedValueOnce(new LLMGenerationError('LLM_PARSE_ERROR', 'JSON malformed'))
      .mockResolvedValueOnce(mockProposalSuccess);

    mockSimulationEngine.simulateProposal.mockReturnValue({
      isValid: true,
      delta: {} as any,
      violationsIntroduced: [],
      errors: [],
      dependenciesAdded: [],
      dependenciesRemoved: [],
      affectedFiles: [],
      scopeViolations: []
    });

    const loop = new VerificationLoop(mockGenerator, mockSimulationEngine);
    const result = await loop.run(changePlanMock, projectModelMock);

    expect(result).toBe(mockProposalSuccess);
    expect(mockGenerator.generateProposal).toHaveBeenCalledTimes(2);

    // Comprobar inyección de feedback
    expect(mockGenerator.generateProposal).toHaveBeenLastCalledWith(
      changePlanMock,
      projectModelMock,
      30000,
      ['Intento 1 falló: JSON malformed']
    );
  });

  test('Should propagate infrastructure errors immediately without retrying', async () => {
    mockGenerator.generateProposal.mockRejectedValue(
      new LLMGenerationError('LLM_PROVIDER_UNAVAILABLE', 'Server offline')
    );

    const loop = new VerificationLoop(mockGenerator, mockSimulationEngine);

    await expect(loop.run(changePlanMock, projectModelMock)).rejects.toThrow(
      new LLMGenerationError('LLM_PROVIDER_UNAVAILABLE', 'Server offline')
    );

    expect(mockGenerator.generateProposal).toHaveBeenCalledTimes(1);
  });

  test('Should throw consolidated LLM_PARSE_ERROR when maximum attempts are exceeded', async () => {
    mockGenerator.generateProposal.mockRejectedValue(
      new LLMGenerationError('LLM_PARSE_ERROR', 'Truncated code detected')
    );

    const loop = new VerificationLoop(mockGenerator, mockSimulationEngine);

    try {
      await loop.run(changePlanMock, projectModelMock, 30000, 3);
      fail('Should have thrown');
    } catch (e: any)  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

    expect(mockGenerator.generateProposal).toHaveBeenCalledTimes(3);
  });
});
