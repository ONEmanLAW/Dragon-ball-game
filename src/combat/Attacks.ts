// ────────────────────────────────────────────────────────────
//  TEMPLATE METHOD + State-aware
//  execute():
//   1) ajuste/dépense Ki (état pris en compte)
//   2) calcule dégâts de base par type, puis ajuste selon l’état
//   3) applique les dégâts au défenseur
//   4) émet l’événement + retourne un AttackResult
// ────────────────────────────────────────────────────────────

import { Warrior } from "../models/Warrior";
import type { WarriorType } from "../models/Warrior";
import { eventBus } from "../events/EventBus";
import type { AttackExecutedEvent } from "../events/GameEvents";

//#region Types
export type AttackKind = "Normal" | "KiEnergy" | "Special";
//#endregion

//#region Attack constants
// - - Normal -- //
const NORMAL_ATTACK_KI_COST = 30 as const;
const NORMAL_ATTACK_NAME = "Basic Attack" as const;
const NORMAL_STRENGTH_MULTIPLIER = 1.0 as const;

// - - Ki/Energy -- //
const KI_ENERGY_ATTACK_KI_COST = 50 as const;
const KI_ENERGY_ATTACK_NAME_BY_TYPE: Record<WarriorType, string> = {
  Saiyan:   "KI Energy (KAMEHAMEHA / FINAL FLASH)",
  Namekian: "KI Energy (MAKANKOSAPPO)",
  Android:  "KI Energy (LASER SHOT)",
};
const KI_ENERGY_STRENGTH_MULTIPLIER = 1.5 as const;

// - - Special (placeholder) -- //
const SPECIAL_ATTACK_KI_COST = 0 as const;
//#endregion

//#region Result Object
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
    return (
      `${this.attackerName} → ${this.attackName} → ${this.defenderName} ` +
      `(Ki -${this.kiSpent}, Damage ${this.damageDealt}, ` +
      `Defender VIT ${this.defenderRemainingVitality})`
    );
  }
}
//#endregion

//#region Base Template
export abstract class Attack {
  protected constructor(
    protected readonly kind: AttackKind,
    protected readonly kiCost: number
  ) {}

  public abstract getNameFor(attackerType: WarriorType): string;
  protected abstract getStrengthMultiplier(): number;

  /** TEMPLATE METHOD */
  public execute(attacker: Warrior, defender: Warrior): AttackResult {
    // 1) Ki spending (STATE-aware)
    const adjustedCost = attacker.adjustKiCost(this.kiCost);
    const kiBefore = attacker.getKi();
    attacker.spendKi(adjustedCost); // Android : no-op
    const kiAfter = attacker.getKi();
    const kiSpent = Math.max(0, kiBefore - kiAfter);

    // 2) Damage compute (type) + adjust (STATE-aware)
    const strength = attacker.stats.strength;
    const baseDamage = Math.floor(strength * this.getStrengthMultiplier());
    const finalDamage = attacker.adjustOutgoingDamage(baseDamage);

    // 3) Apply to defender
    defender.receiveDamage(finalDamage);

    const attackLabel =
      attacker.getAttackLabel?.(this.kind) ?? this.getNameFor(attacker.type);

    // 4) Event + structured result
    const event: AttackExecutedEvent = {
      kind: "AttackExecuted",
      timestamp: Date.now(),
      attacker: attacker.name,
      defender: defender.name,
      attackName: attackLabel,
      kiSpent,
      damage: finalDamage,
      defenderRemainingVitality: defender.getVitality(),
      attackerRemainingKi: attacker.getKi(),
    };
    eventBus.emit(event);

    return new AttackResult(
      attacker.name,
      defender.name,
      attackLabel,
      kiSpent,
      finalDamage,
      defender.getVitality(),
      attacker.getKi()
    );
  }
}
//#endregion

//#region Concrete Attacks
export class NormalAttack extends Attack {
  constructor() { 
    super("Normal", NORMAL_ATTACK_KI_COST);
  }

  public getNameFor(_type: WarriorType): string { 
    return NORMAL_ATTACK_NAME; 
  }

  protected getStrengthMultiplier(): number {
    return NORMAL_STRENGTH_MULTIPLIER; 
  }
}

export class KiEnergyAttack extends Attack {
  constructor() { 
    super("KiEnergy", KI_ENERGY_ATTACK_KI_COST); 
  }

  public getNameFor(type: WarriorType): string { 
    return KI_ENERGY_ATTACK_NAME_BY_TYPE[type]; 
  }

  protected getStrengthMultiplier(): number { 
    return KI_ENERGY_STRENGTH_MULTIPLIER; 
  }
}

export class SpecialAttack extends Attack {
  constructor() { 
    super("Special", SPECIAL_ATTACK_KI_COST); 
  }
  
  public getNameFor(_type: WarriorType): string { 
    return "Special (to be defined)"; 
  }

  protected getStrengthMultiplier(): number { 
    return 0; 
  }
}
//#endregion
