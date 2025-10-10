// src/models/Warrior.ts
/**
 * Domaine guerrier
 * ------------------------------------------------------------------
 * Choix : une seule hiérarchie orientée classes.
 * - Classe abstraite Warrior : contrat + logique commune minimale.
 * - Trois sous-classes concrètes dans le même fichier.
 * Stats : strength, ki, speed, vitality
 */

export type WarriorType = "Saiyan" | "Namekian" | "Android";



export abstract class Warrior {
  public readonly name: string;
  public readonly type: WarriorType;
  public readonly description: string;
  public readonly stats: WarriorStats;

  // Valeurs évolutives dans le combats;
  protected currentVitality: number;
  protected currentKi: number;

  protected constructor(name: string, type: WarriorType, description: string, stats: WarriorStats) {
    this.name = name;
    this.type = type;
    this.description = description;
    this.stats = stats;

    this.currentVitality = stats.vitality;
    this.currentKi = stats.ki
  }

  // Pour le combats
  public getVitality(): number {
    return this.currentVitality
  }

  public getKi(): number {
    return this.currentKi
  }

  public isAlive(): boolean {
    return this.currentVitality > 0;
  }


  // Ki + Degats
  public receiveDamage(amount: number): void {
    const damage = Math.max(0, Math.floor(amount));
    this.currentVitality = Math.max(0, this.currentVitality - damage);
  }

  public canSpendKi(cost: number): boolean {
    return this.currentKi >= cost
  }

  public spendKi(cost: number): void {
    if (cost <= 0)
      return
    if (!this.canSpendKi(cost)) {
      throw new Error (`${this.name} does not have enough Ki.`)
    }

    this.currentKi = Math.max(0, this.currentKi - cost);
  }

  public summary(): string {
    const s = this.stats;
    return `[${this.type}] ${this.name} — ${this.description} | ` + `STR: ${s.strength} | KI: ${s.ki} | SPD: ${s.speed} | VIT: ${s.vitality}`;
  }
}

export type WarriorStats = {
  strength: number;
  ki: number;    
  speed: number;  
  vitality: number; // vie
};






const DEFAULT_SAIYAN: WarriorStats   = { strength: 120, ki: 110, speed: 110, vitality: 100 };
const DEFAULT_NAMEKIAN: WarriorStats = { strength: 100, ki: 95,  speed: 100, vitality: 120 };
const DEFAULT_ANDROID: WarriorStats  = { strength: 105, ki: 9999, speed: 105, vitality: 110 };


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

  // Android Ki infini
  public override canSpendKi(cost: number): boolean {
    return true;
  }

  public override spendKi(cost: number): void {
    // ne reduit pas le Ki vu que c infini
  }
}
