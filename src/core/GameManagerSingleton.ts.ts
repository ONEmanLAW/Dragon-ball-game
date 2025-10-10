// src/core/GameManagerSingleton.ts
/**
 * Pattern : Singleton
 * -------------------------------------------------------------
 * Rôle :
 *   - Fournir UNE SEULE instance qui centralise la "base" du jeu :
 *     registre des guerriers, accès, listage, orchestration globale.
 *
 * Important :
 *   - Le Singleton NE CRÉE PAS les guerriers → c’est la Factory.
 *   - Il se contente d’enregistrer, de récupérer et d’orchestrer.
 *
 * Avantages :
 *   - Accès global contrôlé, état unique, évite les duplications.
 *
 * Anti-patterns à éviter :
 *   - Mettre de la logique de création ici.
 *   - Coupler trop fortement le Singleton avec des classes concrètes.
 */

import { Warrior } from "../models/Warrior";

export class GameManager {
  private static instance: GameManager;
  private warriors: Map<string, Warrior> = new Map();

  private constructor() {}

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public registerWarrior(warrior: Warrior): void {
    if (this.warriors.has(warrior.name)) {
      console.log(`${warrior.name} existe already, replacement...`);
    }
    this.warriors.set(warrior.name, warrior);
    console.log(`Existing Warrior: ${warrior.summary()}`);
  }

  public getWarrior(name: string): Warrior | undefined {
    return this.warriors.get(name);
  }

  public listWarriors(): void {
    console.log("List of all warriors :");
    for (const warriors of this.warriors.values()) {
      console.log(" -", warriors.summary());
    }
  }
}
