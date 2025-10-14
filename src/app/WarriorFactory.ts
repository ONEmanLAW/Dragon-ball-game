// WarriorFactory — Factory
// Instancie les Warriors concrets par type (extensible via register).

import { Warrior, type WarriorType, type WarriorStats, SaiyanWarrior, NamekianWarrior, AndroidWarrior } from "../domain/Warrior";

//#region Types
interface WarriorCtor {
  new (
    name: string,
    description: string,
    statsOverride?: Partial<WarriorStats>
  ): Warrior;
}
type ConstructorsMap = Record<WarriorType, WarriorCtor>;
//#endregion

export class WarriorFactory {
  //#region Registry
  private static constructorsByType: ConstructorsMap = {
    Saiyan:   SaiyanWarrior,
    Namekian: NamekianWarrior,
    Android:  AndroidWarrior,
  };
  //#endregion

  //#region API
  // Source unique d’instanciation
  public static create(
    type: WarriorType,
    name: string,
    description: string,
    statsOverride?: Partial<WarriorStats>
  ): Warrior {
    const Ctor = this.constructorsByType[type];
    if (!Ctor) throw new Error(`Unknown warrior type: ${type}`);
    return new Ctor(name, description, statsOverride);
  }

  // Ajoute/remplace un constructeur pour un type
  public static register(type: WarriorType, ctor: WarriorCtor): void {
    this.constructorsByType[type] = ctor;
  }

  // Types actuellement enregistrés
  public static registeredTypes(): WarriorType[] {
    return Object.keys(this.constructorsByType) as WarriorType[];
  }
  //#endregion
}
