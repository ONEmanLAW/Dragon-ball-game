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
import { Attack, AttackKind, NormalAttack, KiEnergyAttack } from "../combat/Attacks";

type AttackConstructor = new () => Attack;

export class GameManager {
  private static instance: GameManager;
  private warriors: Map<string, Warrior> = new Map();
  private attackConstructors: Map<AttackKind, AttackConstructor> = new Map();

  private constructor() {
    // Attacks
    this.registerAttack("Normal", NormalAttack);
    this.registerAttack("KiEnergy", KiEnergyAttack);
    // Special viendra plus tard, quand définie
    // this.registerAttack("Special", SpecialAttack);
  }

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
    for (const warrior of this.warriors.values()) {
      console.log(" -", warrior.summary());
    }
  }



  public registerAttack(kind: AttackKind, ctor: AttackConstructor): void {
    this.attackConstructors.set(kind, ctor);
  }

  public createAttack(kind: AttackKind): Attack {
    const Ctor = this.attackConstructors.get(kind);
    if (!Ctor) {
      throw new Error(`Attack kind not registered: ${kind}`);
    }
    return new Ctor();
  }

  public listAvailableAttacks(): AttackKind[] {
    return Array.from(this.attackConstructors.keys());
  }
}
