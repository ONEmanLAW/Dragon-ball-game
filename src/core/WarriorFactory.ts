// src/core/WarriorFactory.ts
/**
 * Pattern : FACTORY
 * ------------------------------------------------------------------
 * Rôle :
 *  - Centraliser la création des guerriers (type, name, description).
 *  - Éviter les `new` éparpillés et rester ouvert à l’extension via `register`.
 *
 */

import {Warrior, WarriorType, WarriorStats, SaiyanWarrior, NamekianWarrior, AndroidWarrior} from "../models/Warrior";

//#region Types

interface WarriorClassConstructor {
  new (
    name: string,
    description: string,
    statsOverride?: Partial<WarriorStats>
  ): Warrior;
}

// -- Registre typé des constructeurs par type. -- //
type ConstructorsMap = Record<WarriorType, WarriorClassConstructor>;

//#endregion

//#region Factory
export class WarriorFactory {

  private static constructorsByType: ConstructorsMap = {
    Saiyan: SaiyanWarrior,
    Namekian: NamekianWarrior,
    Android: AndroidWarrior,
  };

  public static create(
    warriorType: WarriorType,
    warriorName: string,
    description: string,
    statsOverride?: Partial<WarriorStats>
  ): Warrior {
    const Ctor = this.constructorsByType[warriorType];
    if (!Ctor) {
      throw new Error(`Unknown warrior type: ${warriorType}`);
    }
    return new Ctor(warriorName, description, statsOverride);
  }

  public static register(
    warriorType: WarriorType,
    constructorFunction: WarriorClassConstructor
  ): void {
    this.constructorsByType[warriorType] = constructorFunction;
  }
}

//#endregion
