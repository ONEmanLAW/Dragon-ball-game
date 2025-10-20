import type { Warrior, WarriorType } from "../domain/Warrior";
import { Attack, type AttackKind, NormalAttack, KiEnergyAttack } from "../domain/Attacks";
import { SpecialAttackProxy } from "../domain/AttackProxies";
import { WarriorFactory } from "./WarriorFactory";
import type { WarriorPreset } from "../data/WarriorPreset";

type AttackConstructor = new () => Attack;

export class GameManager {
  //#region Singleton
  private static instance: GameManager;
  static getInstance(): GameManager {
    if (!GameManager.instance) GameManager.instance = new GameManager();
    return GameManager.instance;
  }
  private constructor() {
    this.registerAttack("Normal", NormalAttack);
    this.registerAttack("KiEnergy", KiEnergyAttack);
    this.registerAttack("Special", SpecialAttackProxy);
  }
  //#endregion

  //#region Stores
  private readonly warriors = new Map<string, Warrior>();
  private readonly attackConstructorsByKind = new Map<AttackKind, AttackConstructor>();
  private readonly presetsById = new Map<string, WarriorPreset>();
  //#endregion

  //#region Presets
  loadPresets(presets: WarriorPreset[]): void {
    this.presetsById.clear();
    for (const preset of presets) this.presetsById.set(preset.id, preset);
  }

  spawnPreset(id: string): Warrior {
    const preset = this.presetsById.get(id);
    if (!preset) throw new Error(`Preset not found: ${id}`);

    const warrior = WarriorFactory.create(preset.type, preset.name, preset.description, preset.statsOverride);
    if (preset.attackLabels) warrior.setAttackLabels(preset.attackLabels);

    this.registerWarrior(warrior);
    return warrior;
  }

  getSpriteFramesForRace(race: WarriorType): string[] | undefined {
    for (const preset of this.presetsById.values()) {
      if (preset.type === race && preset.spriteFrames && preset.spriteFrames.length > 0) {
        return preset.spriteFrames;
      }
    }
    return undefined;
  }
  //#endregion

  //#region Warriors
  registerWarrior(warrior: Warrior): void {
    if (this.warriors.has(warrior.name)) {
      console.log(`[GameManager] ${warrior.name} already exists. Replacing...`);
    }
    this.warriors.set(warrior.name, warrior);
    console.log(`[GameManager] Registered: ${warrior.summary()}`);
  }

  getWarrior(name: string): Warrior | undefined {
    return this.warriors.get(name);
  }

  getAllWarriors(): Warrior[] {
    return Array.from(this.warriors.values());
  }

  listWarriors(): void {
    console.log("List of all warriors:");
    for (const warrior of this.warriors.values()) console.log(" -", warrior.summary());
  }
  //#endregion

  //#region Attacks
  registerAttack(kind: AttackKind, Constructor: AttackConstructor): void {
    this.attackConstructorsByKind.set(kind, Constructor);
  }

  createAttack(kind: AttackKind): Attack {
    const Constructor = this.attackConstructorsByKind.get(kind);
    if (!Constructor) throw new Error(`Attack kind not registered: ${kind}`);
    return new Constructor();
  }

  listAvailableAttacks(): AttackKind[] {
    return Array.from(this.attackConstructorsByKind.keys());
  }
  //#endregion
}
