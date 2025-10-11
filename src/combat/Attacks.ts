// src/combat/Attacks.ts
// TEMPLATE METHOD + STATE-AWARE
// ----------------------------------------------------

import { Warrior } from "../models/Warrior";
import type { WarriorType } from "../models/Warrior";
import { eventBus } from "../events/EventBus";
import type { AttackExecutedEvent } from "../events/GameEvents";

export type AttackKind = "Normal" | "KiEnergy" | "Special";

//#region Attack Constants
/*
  =========================
  === Attack Variables ===
  =========================
  But: centraliser tous les chiffres (coûts, dégâts, noms) pour
       faciliter la maintenance sans toucher aux classes.
*/

// -- Normal Attack -- // 
const NORMAL_ATTACK_KI_COST = 30 as const;
const NORMAL_ATTACK_DAMAGE_BY_TYPE: Record<WarriorType, number> = {
  Saiyan: 20,
  Namekian: 15,
  Android: 25,
};
const NORMAL_ATTACK_NAME = "Basic Attack" as const;

// -- Ki / Energy Attack -- //
const KI_ENERGY_ATTACK_KI_COST = 50 as const;
const KI_ENERGY_ATTACK_DAMAGE_BY_TYPE: Record<WarriorType, number> = {
  Saiyan: 40,
  Namekian: 50,
  Android: 35,
};
const KI_ENERGY_ATTACK_NAME_BY_TYPE: Record<WarriorType, string> = {
  Saiyan:   "KI Energy (KAMEHAMEHA / FINAL FLASH)",
  Namekian: "KI Energy (MAKANKOSAPPO)",
  Android:  "KI Energy (LASER SHOT)",
};

// -- Special (on définit plus tard) -- //
const SPECIAL_ATTACK_KI_COST = 0 as const;

//#endregion

//#region Result Object
/*
  =========================
  ===== Result Object =====
  =========================
*/
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
/*
  =========================
  ===== Base Template =====
  =========================
  TEMPLATE METHOD:
    1) Ajuste et dépense le Ki (state du Warrior pris en compte)
    2) Calcule les damage de base par type puis applique l'état
    3) Inflige les damage au défenseur
    4) Retourne un AttackResult
*/
export abstract class Attack {
  protected readonly kiCost: number;

  protected constructor(protected readonly kind: AttackKind, kiCost: number) {
    this.kiCost = kiCost;
  }

  public abstract getNameFor(attackerType: WarriorType): string;

  protected abstract computeBaseDamage(attackerType: WarriorType): number;

  /** TEMPLATE METHOD */
  public execute(attacker: Warrior, defender: Warrior): AttackResult {
    // 1) Ki spending (STATE-aware)
    const adjustedCost = attacker.adjustKiCost(this.kiCost);
    const kiBefore = attacker.getKi();
    attacker.spendKi(adjustedCost); // Android : ne perds pas son ki
    const kiAfter = attacker.getKi();
    const kiSpent = Math.max(0, kiBefore - kiAfter);

    // 2) Damage compute (type) + adjust (STATE-aware)
    const baseDamage = this.computeBaseDamage(attacker.type);
    const finalDamage = attacker.adjustOutgoingDamage(baseDamage);

    // 3) Apply to defender
    defender.receiveDamage(finalDamage);

    // 4) Return structured result
    const event: AttackExecutedEvent = {
      kind: "AttackExecuted",
      timestamp: Date.now(),
      attacker: attacker.name,
      defender: defender.name,
      attackName: this.getNameFor(attacker.type),
      kiSpent,
      damage: finalDamage,
      defenderRemainingVitality: defender.getVitality(),
      attackerRemainingKi: attacker.getKi(),
    };

    eventBus.emit(event);
     return new AttackResult(
      attacker.name,
      defender.name,
      this.getNameFor(attacker.type),
      kiSpent,
      finalDamage,
      defender.getVitality(),
      attacker.getKi()
    );
  } 
}

//#endregion

//#region Concrete Attacks
/*
  =========================
  ====== Concrete atk =====
  =========================
  Ces classes ne font que lire dans les constantes + fournir le nom.
*/

// -- Normal Attack -- //
export class NormalAttack extends Attack {
  constructor() {
    super("Normal", NORMAL_ATTACK_KI_COST);
  }

  public getNameFor(_type: WarriorType): string {
    return NORMAL_ATTACK_NAME;
  }

  protected computeBaseDamage(attackerType: WarriorType): number {
    return NORMAL_ATTACK_DAMAGE_BY_TYPE[attackerType];
  }
}

// -- Ki / Energy Attack -- //
export class KiEnergyAttack extends Attack {
  constructor() {
    super("KiEnergy", KI_ENERGY_ATTACK_KI_COST);
  }

  public getNameFor(type: WarriorType): string {
    return KI_ENERGY_ATTACK_NAME_BY_TYPE[type];
  }

  protected computeBaseDamage(attackerType: WarriorType): number {
    return KI_ENERGY_ATTACK_DAMAGE_BY_TYPE[attackerType];
  }
}

// -- Special (on définit plus tard) -- //
export class SpecialAttack extends Attack {
  constructor() {
    super("Special", SPECIAL_ATTACK_KI_COST);
  }
  public getNameFor(_type: WarriorType): string {
    return "Special (to be defined)";
  }
  protected computeBaseDamage(_attackerType: WarriorType): number {
    return 0; // sera défini avec le TurnManager + cooldown
  }
}

//#endregion
