// src/core/GameManagerSingleton.ts
/**
 * Pattern : Singleton
 * ------------------------------------------------------------------
 * Rôle :
 *  - Fournir UNE SEULE instance centralisant la "base" du jeu :
 *    registre des guerriers, accès, listage, orchestration globale.
 *
 * Important :
 *  - Le Singleton NE CRÉE PAS les guerriers → c’est la Factory.
 *  - Il enregistre, récupère, liste.
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
      console.log(`${warrior.name} already exists. Replacing...`);
    }
    this.warriors.set(warrior.name, warrior);
    console.log(`Registered warrior: ${warrior.summary()}`);
  }

  public getWarrior(name: string): Warrior | undefined {
    return this.warriors.get(name);
  }

  public listWarriors(): void {
    console.log("List of all warriors:");
    for (const w of this.warriors.values()) {
      console.log(" -", w.summary());
    }
  }
}
