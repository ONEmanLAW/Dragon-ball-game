// app/GameManager.ts
// GameManager - Singleton

import type { Warrior, WarriorType } from "../domain/Warrior";
import { Attack, type AttackKind, NormalAttack, KiEnergyAttack } from "../domain/Attacks";
import { SpecialAttackProxy } from "../domain/AttackProxies"; // ⬅️ utilise le Proxy ici
import { WarriorFactory } from "./WarriorFactory";
import type { WarriorPreset } from "../data/WarriorPreset";

type AttackConstructor = new () => Attack;

export class GameManager {
  private static instance: GameManager;

  //#region Store
  private readonly warriors = new Map<string, Warrior>();
  private readonly attackConstructors = new Map<AttackKind, AttackConstructor>();
  private readonly presetsById = new Map<string, WarriorPreset>();
  //#endregion

  //#region Singleton
  private constructor() {
    this.registerAttack("Normal",   NormalAttack);
    this.registerAttack("KiEnergy", KiEnergyAttack);
    this.registerAttack("Special",  SpecialAttackProxy); // ⬅️ enregistre le Proxy, pas la vraie Special
  }
  public static getInstance(): GameManager {
    if (!GameManager.instance) GameManager.instance = new GameManager();
    return GameManager.instance;
  }
  //#endregion

  //#region Presets
  public loadPresets(presets: WarriorPreset[]): void {
    this.presetsById.clear();
    for (const p of presets) this.presetsById.set(p.id, p);
  }

  public spawnPreset(id: string): Warrior {
    const preset = this.presetsById.get(id);
    if (!preset) throw new Error(`Preset not found: ${id}`);

    const w = WarriorFactory.create(preset.type, preset.name, preset.description, preset.statsOverride);
    if (preset.attackLabels) w.setAttackLabels(preset.attackLabels);

    this.registerWarrior(w);
    return w;
  }

  public getSpriteFramesForRace(race: WarriorType): string[] | undefined {
    for (const p of this.presetsById.values()) {
      if (p.type === race && p.spriteFrames && p.spriteFrames.length > 0) {
        return p.spriteFrames;
      }
    }
    return undefined;
  }
  //#endregion

  //#region Warriors
  public registerWarrior(warrior: Warrior): void {
    if (this.warriors.has(warrior.name)) {
      console.log(`[GameManager] ${warrior.name} already exists. Replacing...`);
    }
    this.warriors.set(warrior.name, warrior);
    console.log(`[GameManager] Registered: ${warrior.summary()}`);
  }

  public getWarrior(name: string): Warrior | undefined {
    return this.warriors.get(name);
  }

  public getAllWarriors(): Warrior[] {
    return Array.from(this.warriors.values());
  }

  public listWarriors(): void {
    console.log("List of all warriors:");
    for (const w of this.warriors.values()) console.log(" -", w.summary());
  }
  //#endregion

  //#region Attacks
  public registerAttack(kind: AttackKind, Ctor: AttackConstructor): void {
    this.attackConstructors.set(kind, Ctor);
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
