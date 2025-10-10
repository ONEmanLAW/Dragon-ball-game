// src/combat/Attacks.ts
/**
 * Combat Attacks System
 * ------------------------------------------------------------------
 * Main pattern: TEMPLATE METHOD
 *  - Attack.execute(attacker, defender) is the invariant algorithm:
 *      1) attacker spends Ki (Android overrides to no-op)
 *      2) computeDamage(attacker.type)
 *      3) defender receives damage
 *      4) return structured AttackResult (no console.log here)
 *
 * Implemented attacks now:
 *  - NormalAttack   (Ki cost = 30)
 *  - KiEnergyAttack (Ki cost = 50)
 * SpecialAttack (cooldown 2 turns) will come next.
 */

import { Warrior } from "../models/Warrior";
import type { WarriorType } from "../models/Warrior";

export type AttackKind = "Normal" | "KiEnergy" | "Special";

export class AttackResult {
  constructor(
    public readonly attackerName: string,
    public readonly defenderName: string,
    public readonly attackName: string,
    public readonly kiSpent: number,
    public readonly damageDealt: number,
    public readonly defenderRemainingVitality: number,
    public readonly attackerRemainingKi: number
  ) {}

  public toLine(): string {
    return `${this.attackerName} → ${this.attackName} → ${this.defenderName} ` + `(Ki -${this.kiSpent}, Damage ${this.damageDealt}, ` + `Defender VIT ${this.defenderRemainingVitality})`;
  }
}

/** Abstract attack (Template Method) */
export abstract class Attack {
  protected readonly kiCost: number;

  protected constructor(protected readonly kind: AttackKind, kiCost: number) {
    this.kiCost = kiCost;
  }

  public abstract getNameFor(attackerType: WarriorType): string;
  protected abstract computeBaseDamage(attackerType: WarriorType): number;

  /** Template Method */
  public execute(attacker: Warrior, defender: Warrior): AttackResult {
    // 1) Ki spending
    const adjustedCost = attacker.adjustKiCost(this.kiCost);
    const kiBefore = attacker.getKi();
    attacker.spendKi(adjustedCost);     // Android: ne baissera pas
    const kiAfter = attacker.getKi();
    const kiSpent = Math.max(0, kiBefore - kiAfter);

    // 2) Compute damage based on attacker type
    const baseDamage = this.computeBaseDamage(attacker.type);
    const finalDamage = attacker.adjustOutgoingDamage(baseDamage);

    // 3) Apply to defender
    defender.receiveDamage(finalDamage);

    // 4) Return structured result (no console output here)
    return new AttackResult(
      attacker.name,
      defender.name,
      this.getNameFor(attacker.type),
      this.kiCost,
      finalDamage,
      defender.getVitality(),
      attacker.getKi() 
    );
  }
}

// normal
export class NormalAttack extends Attack {
  constructor() {
    super("Normal", 30);
  }

  public getNameFor(_type: WarriorType): string {
    return "Basic Attack";
  }

  protected computeBaseDamage(attackerType: WarriorType): number {
    switch (attackerType) {
      case "Saiyan":   return 20;
      case "Namekian": return 15;
      case "Android":  return 25;
    }
  }
}

// attaque ki
export class KiEnergyAttack extends Attack {
  constructor() {
    super("KiEnergy", 50);
  }

  public getNameFor(type: WarriorType): string {
    switch (type) {
      case "Saiyan":   return "Ki Energy (Kamehameha / Final Flash)";
      case "Namekian": return "Ki Energy (Makankōsappō)";
      case "Android":  return "Ki Energy (Laser Shot)";
    }
  }

  protected computeBaseDamage(attackerType: WarriorType): number {
    switch (attackerType) {
      case "Saiyan":   return 40;
      case "Namekian": return 50;
      case "Android":  return 35;
    }
  }
}

// on mettera plus tard les valeur
export class SpecialAttack extends Attack {
  constructor() {
    super("Special", 0);
  }
  public getNameFor(_type: WarriorType): string {
    return "Special (to be defined)";
  }
  protected computeBaseDamage(_attackerType: WarriorType): number {
    return 0;
  }
}
