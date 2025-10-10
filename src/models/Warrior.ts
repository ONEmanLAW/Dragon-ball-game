// src/models/Warrior.ts
/**
 * Domaine guerrier (POO)
 * ------------------------------------------------------------------
 * Choix : hiérarchie orientée classes.
 *  - Classe abstraite Warrior : contrat + logique commune minimale.
 *  - Trois sous-classes concrètes dans le même fichier.
 *
 * Patterns utilisés autour :
 *  - STATE (Normal / Injured / Exhausted) appliqué via WarriorState
 *    => les attaques appellent attacker.adjustKiCost(...) et
 *       attacker.adjustOutgoingDamage(...), puis Warrior met à jour
 *       son état après chaque dépense de Ki / dégâts reçus.
 */

import { WarriorState, NormalState, InjuredState, ExhaustedState } from "../state/WarriorState";

//#region Types & interfaces
export type WarriorType = "Saiyan" | "Namekian" | "Android";

// -- Stats -- //
export type WarriorStats = {
  strength: number;  // Force
  ki: number;        // Ki max
  speed: number;     // Vitesse
  vitality: number;  // PV max (vie)
};

//#endregion

//#region Base class
export abstract class Warrior {
  public readonly name: string;
  public readonly type: WarriorType;
  public readonly description: string;
  public readonly stats: WarriorStats;

  protected currentVitality: number;
  protected currentKi: number;

  // -- STATE -- //
  private state: WarriorState = new NormalState();

  protected constructor(name: string, type: WarriorType, description: string, stats: WarriorStats) {
    this.name = name;
    this.type = type;
    this.description = description;
    this.stats = stats;

    this.currentVitality = stats.vitality;
    this.currentKi = stats.ki;
  }

  // -- Accès combat -- //
  public getVitality(): number {
    return this.currentVitality;
  }

  public getKi(): number {
    return this.currentKi;
  }

  public isAlive(): boolean {
    return this.currentVitality > 0;
  }

  // -- STATE -- //
  public getStateName(): string {
    return this.state.name;
  }

  public adjustKiCost(baseCost: number): number {
    return this.state.adjustKiCost(baseCost);
  }

  public adjustOutgoingDamage(baseDamage: number): number {
    return this.state.adjustOutgoingDamage(baseDamage);
  }

  // -- Évolution pendant le combat -- //
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
    if (!this.canSpendKi(cost)) {
      throw new Error(`${this.name} does not have enough Ki.`);
    }
    this.currentKi = Math.max(0, this.currentKi - cost);
    this.recomputeState();
  }

  // -- Règles de transition de state -- //
  private recomputeState(): void {
    const vitalityRatio = this.currentVitality / this.stats.vitality;
    const kiRatio = this.currentKi / this.stats.ki;

    if (vitalityRatio <= 0.10) {
      this.state = new InjuredState();
    } else if (kiRatio <= 0.10) {
      this.state = new ExhaustedState();
    } else {
      this.state = new NormalState();
    }
  }

  // -- Résumé des stats max -- //
  public summary(): string {
    const s = this.stats;
    return (
      `[${this.type}] ${this.name} — ${this.description} | ` +
      `STR: ${s.strength} | KI: ${s.ki} | SPD: ${s.speed} | VIT: ${s.vitality}`
    );
  }
}

//#endregion

//#region Defaults
const DEFAULT_SAIYAN:   WarriorStats = { strength: 100, ki: 100,  speed: 100, vitality: 100 };
const DEFAULT_NAMEKIAN: WarriorStats = { strength: 100, ki: 100,  speed: 100, vitality: 100 };
const DEFAULT_ANDROID:  WarriorStats = { strength: 100, ki: 9999, speed: 100, vitality: 100 };

//#endregion

//#region Concrete warriors
export class SaiyanWarrior extends Warrior {
  constructor(name: string, description: string, statsOverride?: Partial<WarriorStats>) {
    super(name, "Saiyan", description, { ...DEFAULT_SAIYAN, ...statsOverride });
  }
}

export class NamekianWarrior extends Warrior {
  constructor(name: string, description: string, statsOverride?: Partial<WarriorStats>) {
    super(name, "Namekian", description, { ...DEFAULT_NAMEKIAN, ...statsOverride });
  }
}

export class AndroidWarrior extends Warrior {
  constructor(name: string, description: string, statsOverride?: Partial<WarriorStats>) {
    super(name, "Android", description, { ...DEFAULT_ANDROID, ...statsOverride });
  }

  // Android = Ki infini :
  public override canSpendKi(_cost: number): boolean {
    return true;
  }

  public override spendKi(_cost: number): void {
    // ne reduit pas le ki
  }
}

//#endregion
