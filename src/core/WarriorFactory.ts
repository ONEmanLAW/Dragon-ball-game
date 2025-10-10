// src/core/WarriorFactory.ts
/**
 * Pattern : Factory (Simple Factory / Factory Method-like)
 * ------------------------------------------------------------------
 * Rôle :
 *   - Centraliser la création des guerriers (Saiyan, Namekian, Android).
 *   - Éviter les 'new' éparpillés.
 *   - Être ouverte à l’extension via un registre.
 *
 * À NE PAS FAIRE :
 *   - Stocker/orchestrer le jeu c’est le rôle du Singleton.
 *   - Gérer le cycle de vie/combat → State/Observer/Decorator plus tard.
 *
 * Extension :
 *   WarriorFactory.register("NouvelleRace", NouvelleClasseGuerrier)
 *   WarriorFactory.create("NouvelleRace", "Nom")
 */

import {Warrior, WarriorType, SaiyanWarrior, NamekianWarrior, AndroidWarrior,
} from "../models/Warrior";


interface WarriorClassConstructor {
  new (name: string): Warrior;
}

export class WarriorFactory {
  private static registeredConstructorsByType: Record<WarriorType, WarriorClassConstructor> = {
    Saiyan: SaiyanWarrior,
    Namekian: NamekianWarrior,
    Android: AndroidWarrior,
  };

  public static create(warriorType: WarriorType, warriorName: string): Warrior {
    const ConstructorForType = this.registeredConstructorsByType[warriorType];
    if (!ConstructorForType) {
      throw new Error(`Type of warrior unkown ${warriorType}`);
    }
    return new ConstructorForType(warriorName);
  }

  public static register(warriorType: WarriorType, constructorFunction: WarriorClassConstructor): void {
    this.registeredConstructorsByType[warriorType] = constructorFunction;
  }
}
