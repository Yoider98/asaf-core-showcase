import { IDEBridge, IDECapabilities } from '../types';

export class IDEBridgeRegistry {
  private static bridges: Record<string, new () => IDEBridge> = {};

  public static register(id: string, bridgeClass: new () => IDEBridge): void {
    this.bridges[id.toLowerCase()] = bridgeClass;
  }

  public static getRegisteredBridges(): string[]  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }

  public static createBridge(id: string): IDEBridge | null  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
}
