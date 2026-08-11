import { RiskLevel } from './types';

export interface ExecutionPolicyConfig {
  requireCleanRepo: boolean;
  requireManualApproval: boolean;
  forceDryRun: boolean;
  runPreValidationTests: boolean;
  runPostValidationTests: boolean;
}

export class ExecutionPolicy {
  public static getPolicyForRisk(riskLevel: RiskLevel): ExecutionPolicyConfig  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  };
      case 'HIGH':
        return {
          requireCleanRepo: true,
          requireManualApproval: true,
          forceDryRun: false,
          runPreValidationTests: true,
          runPostValidationTests: true
        };
      case 'MEDIUM':
        return {
          requireCleanRepo: true,
          requireManualApproval: false,
          forceDryRun: false,
          runPreValidationTests: false,
          runPostValidationTests: true
        };
      case 'LOW':
        return {
          requireCleanRepo: false,
          requireManualApproval: false,
          forceDryRun: false,
          runPreValidationTests: false,
          runPostValidationTests: false
        };
      default:
        return {
          requireCleanRepo: true,
          requireManualApproval: true,
          forceDryRun: true,
          runPreValidationTests: true,
          runPostValidationTests: true
        };
    }
  }
}
