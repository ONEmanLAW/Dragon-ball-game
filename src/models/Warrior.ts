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

  protected constructor(name: string, type: WarriorType, description: string, stats: WarriorStats) {
    this.name = name;
    this.type = type;
    this.description = description;
    this.stats = stats;
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
}
