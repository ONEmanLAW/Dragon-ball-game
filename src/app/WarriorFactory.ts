// Pattern: Factory : instancie les Warriors par type (registry extensible).

import { Warrior, type WarriorType, type WarriorStats, SaiyanWarrior, NamekianWarrior, AndroidWarrior } from "../domain/Warrior";

//#region Types
interface WarriorConstructor {
  new (name: string, description: string, statsOverride?: Partial<WarriorStats>): Warrior;
}
type ConstructorsMap = Record<WarriorType, WarriorConstructor>;
//#endregion

export class WarriorFactory {
  //#region Registry
  private static constructorsByType: ConstructorsMap = {
    Saiyan: SaiyanWarrior,
    Namekian: NamekianWarrior,
    Android: AndroidWarrior,
  };
  //#endregion

  //#region API
  static create(
    type: WarriorType,
    name: string,
    description: string,
    statsOverride?: Partial<WarriorStats>
  ): Warrior {
    const Constructor = this.constructorsByType[type];
    if (!Constructor) throw new Error(`Unknown warrior type: ${type}`);
    return new Constructor(name, description, statsOverride);
  }

  static register(type: WarriorType, constructorFn: WarriorConstructor): void {
    this.constructorsByType[type] = constructorFn;
  }

  static registeredTypes(): WarriorType[] {
    return Object.keys(this.constructorsByType) as WarriorType[];
  }
  //#endregion
}
