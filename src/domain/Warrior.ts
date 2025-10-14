// Warrior — base + sous-classes (par race)
// State principal : Normal / Injured / Exhausted / Dead
// Badges d’effets pour l’UI (ex: "Super Saiyan (2r)")

import { eventBus } from "../events/EventBus";
import type { StateChangedEvent } from "../events/GameEvents";
import {
  WarriorState,
  NormalState,
  InjuredState,
  ExhaustedState,
  DeadState,
} from "./WarriorState";
import type { AttackKind } from "./Attacks";
import { DEFAULT_STATS_BY_RACE } from "./Balance";

//#region Types
export type WarriorType = "Saiyan" | "Namekian" | "Android";

export type WarriorStats = {
  strength: number; // Force
  ki: number; // Ki max
  speed: number; // Vitesse
  vitality: number; // PV max
};
//#endregion

export abstract class Warrior {
  public readonly name: string;
  public readonly type: WarriorType;
  public readonly description: string;
  public readonly stats: WarriorStats;

  protected currentVitality: number;
  protected currentKi: number;

  private state: WarriorState = new NormalState(); // state principal unique
  private attackLabels?: Partial<Record<AttackKind | string, string>>; // UI only
  private level = 1;

  // UI badges : tag => remainingRounds (<=0 => sans compteur)
  private effectRounds: Map<string, number> = new Map();

  protected constructor(name: string, type: WarriorType, description: string, stats: WarriorStats) {
    this.name = name;
    this.type = type;
    this.description = description;
    this.stats = stats;
    this.currentVitality = stats.vitality;
    this.currentKi = stats.ki;
  }

  //#region Attack labels (UI)
  public setAttackLabels(labels?: Partial<Record<AttackKind | string, string>>): void {
    if (!labels) return;
    this.attackLabels = { ...(this.attackLabels ?? {}), ...labels };
  }

  public getAttackLabel(kind: AttackKind | string): string | undefined {
    return this.attackLabels?.[kind];
  }
  //#endregion

  //#region Level
  public getLevel(): number { 
    return this.level; 
  }

  public setLevel(level: number): void {
    this.level = Math.max(1, Math.floor(level || 1));
  }
  //#endregion

  //#region Combat accessors
  public getVitality(): number { 
    return this.currentVitality; 
  }

  public getKi(): number { 
    return this.currentKi; 
  }

  public isAlive(): boolean { 
    return this.currentVitality > 0; 
  }
  //#endregion

  //#region State API
  public getStateName(): string { 
    return this.state.name; 
  }

  public adjustKiCost(baseCost: number): number { 
    return this.state.adjustKiCost(baseCost); 
  }

  public adjustOutgoingDamage(baseDamage: number): number { 
    return this.state.adjustOutgoingDamage(baseDamage); 
  }
  //#endregion

  //#region Mutations (PV/KI)
  public receiveDamage(amount: number): void {
    const damage = Math.max(0, Math.floor(amount));
    this.currentVitality = Math.max(0, this.currentVitality - damage);
    this.recomputeState();
  }

  public canSpendKi(cost: number): boolean {
    return this.currentKi >= cost;
  }

  public spendKi(cost: number): void {
    if (cost <= 0) return;
    if (!this.canSpendKi(cost)) throw new Error(`${this.name} does not have enough Ki.`);
    this.currentKi = Math.max(0, this.currentKi - Math.floor(cost));
    this.recomputeState();
  }

  // helpers pour les effets
  public heal(amount: number): void {
    if (amount <= 0) return;
    this.currentVitality = Math.min(this.stats.vitality, this.currentVitality + Math.floor(amount));
    this.recomputeState();
  }

  public gainKi(amount: number): void {
    if (amount <= 0) return;
    this.currentKi = Math.min(this.stats.ki, this.currentKi + Math.floor(amount));
    this.recomputeState();
  }

  public loseKi(amount: number): void {
    if (amount <= 0) return;
    this.currentKi = Math.max(0, this.currentKi - Math.floor(amount));
    this.recomputeState();
  }
  //#endregion

  //#region UI badges (effets)
  public addStatusTag(tag: string, remainingRounds?: number): void {
    if (!tag) 
      return;
    this.effectRounds.set(tag, remainingRounds ?? 0);
  }

  public updateStatusTag(tag: string, remainingRounds: number): void {
    if (!this.effectRounds.has(tag)) 
      return;
    this.effectRounds.set(tag, remainingRounds);
  }

  public removeStatusTag(tag: string): void {
    this.effectRounds.delete(tag);
  }

  public getStatusTags(): string[] {
    const out: string[] = [];
    for (const [tag, rounds] of this.effectRounds.entries()) {
      out.push(rounds > 0 ? `${tag} (${rounds}r)` : tag);
    }
    return out;
  }
  //#endregion

  //#region State transitions
  private recomputeState(): void {
    const prev = this.state.name;

    if (this.currentVitality <= 0) {
      this.state = new DeadState();
    } else {
      const vitalityRatio = this.currentVitality / this.stats.vitality;
      const kiRatio = this.currentKi / this.stats.ki;

      if (vitalityRatio <= 0.10) this.state = new InjuredState();
      else if (kiRatio <= 0.10)  this.state = new ExhaustedState();
      else this.state = new NormalState();
    }

    const next = this.state.name;
    if (prev !== next) {
      const event: StateChangedEvent = {
        kind: "StateChanged",
        timestamp: Date.now(),
        warrior: this.name,
        from: prev,
        to: next,
      };
      eventBus.emit(event);
    }
  }
  //#endregion

  //#region Summary
  public summary(): string {
    const s = this.stats;
    return `[${this.type}] ${this.name} — ${this.description} | LVL: ${this.level} | STR: ${s.strength} | KI: ${s.ki} | SPD: ${s.speed} | VIT: ${s.vitality}`;
  }
  //#endregion
}

//#region Concrete races
export class SaiyanWarrior extends Warrior {
  constructor(name: string, description: string, statsOverride?: Partial<WarriorStats>) {
    super(name, "Saiyan", description, { ...DEFAULT_STATS_BY_RACE.Saiyan, ...statsOverride });
  }
}

export class NamekianWarrior extends Warrior {
  constructor(name: string, description: string, statsOverride?: Partial<WarriorStats>) {
    super(name, "Namekian", description, { ...DEFAULT_STATS_BY_RACE.Namekian, ...statsOverride });
  }
}

export class AndroidWarrior extends Warrior {
  constructor(name: string, description: string, statsOverride?: Partial<WarriorStats>) {
    super(name, "Android", description, { ...DEFAULT_STATS_BY_RACE.Android, ...statsOverride });
  }

  // Android : peut toujours payer et ne consomme pas de Ki.
  public override canSpendKi(_cost: number): boolean { 
    return true; 
  }
  
  public override spendKi(_cost: number): void {}
}
//#endregion
