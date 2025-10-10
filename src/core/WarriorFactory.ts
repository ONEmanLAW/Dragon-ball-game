// src/core/WarriorFactory.ts
/**
 * Pattern : Factory
 * - Crée un guerrier (type, name, description) avec option de statsOverride.
 */
import { Warrior, WarriorType, WarriorStats, SaiyanWarrior, NamekianWarrior, AndroidWarrior,
} from "../models/Warrior";

interface WarriorClassConstructor {
  new (name: string, description: string, statsOverride?: Partial<WarriorStats>): Warrior;
}

export class WarriorFactory {
  private static constructorsByType: Record<WarriorType, WarriorClassConstructor> = {
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
    if (!Ctor) throw new Error(`Unknown warrior type: ${warriorType}`);
      return new Ctor(warriorName, description, statsOverride);
  }

  public static register(
    warriorType: WarriorType,
    constructorFunction: WarriorClassConstructor
  ): void {
    this.constructorsByType[warriorType] = constructorFunction;
  }
}
