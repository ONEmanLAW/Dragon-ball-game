// ────────────────────────────────────────────────────────────
// Pattern : Singleton = GameManager
// Rôle : Registre central (guerriers + attaques) + chargement presets
// Note : Ne crée pas directement les guerriers : passe par la Factory
// ────────────────────────────────────────────────────────────

import { Warrior } from "../models/Warrior";
import { Attack, AttackKind, NormalAttack, KiEnergyAttack } from "../combat/Attacks";
import { WarriorFactory } from "./WarriorFactory";
import type { WarriorPreset } from "../data/WarriorPreset";

//#region Types
type AttackConstructor = new () => Attack;
//#endregion

//#region Singleton
export class GameManager {
  private static instance: GameManager;

  private warriors: Map<string, Warrior> = new Map();
  private attackConstructors: Map<AttackKind, AttackConstructor> = new Map();
  private presetsById: Map<string, WarriorPreset> = new Map();

  private constructor() {
    // - - Attaques -- //
    this.registerAttack("Normal",   NormalAttack);
    this.registerAttack("KiEnergy", KiEnergyAttack);
    // this.registerAttack("Special", SpecialAttack); // plus tard
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) GameManager.instance = new GameManager();
    return GameManager.instance;
  }
  //#endregion

  //#region Presets
  public loadPresets(presets: WarriorPreset[]): void {
    this.presetsById.clear();
    for (const preset of presets) this.presetsById.set(preset.id, preset);
  }

  public spawnPreset(id: string): Warrior {
    const preset = this.presetsById.get(id);
    if (!preset)
      throw new Error(`Coco pas preset: ${id}`);

    const warrior = WarriorFactory.create(
      preset.type,
      preset.name,
      preset.description,
      preset.statsOverride
    );

    warrior.setAttackLabels(preset.attackLabels);
    this.registerWarrior(warrior);
    return warrior;
  }
  //#endregion

  //#region Warriors
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
  //#endregion

  //#region Attacks
  public registerAttack(kind: AttackKind, ctor: AttackConstructor): void {
    this.attackConstructors.set(kind, ctor);
  }

  public createAttack(kind: AttackKind): Attack {
    const Ctor = this.attackConstructors.get(kind);
    if (!Ctor) throw new Error(`Attack kind not registered: ${kind}`);
      return new Ctor();
  }

  public listAvailableAttacks(): AttackKind[] {
    return Array.from(this.attackConstructors.keys());
  }
  //#endregion
}
