// Attacks — Template Method (state-aware) + Observer

import { eventBus } from "../events/EventBus";
import type {
  GameEvent,
  AttackExecutedEvent,
  BattleEndedEvent,
  TurnChangedEvent,
  BattleStartedEvent,
} from "../events/GameEvents";

import { Warrior, type WarriorType } from "./Warrior";

import {
  NORMAL_ATTACK_KI_COST,
  NORMAL_STRENGTH_MULTIPLIER,
  NORMAL_ATTACK_NAME,
  KI_ENERGY_ATTACK_KI_COST,
  KI_ENERGY_STRENGTH_MULTIPLIER,
  KI_ENERGY_ATTACK_NAME_BY_RACE,
  SPECIAL_ATTACK_KI_COST,
  SPECIAL_UNLOCK_TURN,
  EFFECT_DEFAULT_ROUNDS,
} from "./Balance";

import {
  SuperSaiyanEffect,
  RegenerationEffect,
  EnergyLeechEffect,
} from "./Effects";

//#region Combat state
let currentTurn = 1; // round partagé P1/P2
const specialUsedThisBattle = new Set<string>(); // noms des warriors l’ayant utilisée

eventBus.subscribe({
  update: (e: GameEvent) => {
    if (e.kind === "TurnChanged") currentTurn = (e as TurnChangedEvent).turnNumber;
    else if (e.kind === "BattleStarted") specialUsedThisBattle.clear();
  },
});

// Helper UI - a-t-il déjà utilisé sa Spéciale pendant ce combat ?
export function hasUsedSpecialInCurrentBattle(warriorName: string): boolean {
  return specialUsedThisBattle.has(warriorName);
}
//#endregion

//#region Types publics
export type AttackKind = "Normal" | "KiEnergy" | "Special";
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
    return `${this.attackerName} → ${this.attackName} → ${this.defenderName} (Ki -${this.kiSpent}, Damage ${this.damageDealt}, Defender VIT ${this.defenderRemainingVitality})`;
  }
}
//#endregion

//#region Base Template
export abstract class Attack {
  protected constructor(
    protected readonly kind: AttackKind,
    protected readonly kiCost: number
  ) {}

  // Nom d'affichage par type si pas d’override via labels.
  public abstract getNameFor(attackerType: WarriorType): string;

  // Multiplie la STR => dégâts de base (avant modulation par State)
  protected abstract getStrengthMultiplier(): number;

  // Pipeline standard (coût KI => dégâts => event => KO)
  public execute(attacker: Warrior, defender: Warrior): AttackResult {
    if (!attacker.isAlive()) throw new Error(`${attacker.name} cannot act (down).`);
    if (!defender.isAlive()) throw new Error(`${defender.name} is already down.`);

    // 1) Coût KI (state-aware)
    const adjustedCost = attacker.adjustKiCost(this.kiCost);
    const kiBefore = attacker.getKi();
    attacker.spendKi(adjustedCost); // Android: no-op
    const kiAfter = attacker.getKi();
    const kiSpent = Math.max(0, kiBefore - kiAfter);

    // 2) Dégâts (STR × mult) modulés par l’état
    const baseDamage = Math.floor(attacker.stats.strength * this.getStrengthMultiplier());
    const finalDamage = attacker.adjustOutgoingDamage(baseDamage);

    // 3) Application
    defender.receiveDamage(finalDamage);

    // 4) Event
    const attackLabel = attacker.getAttackLabel?.(this.kind) ?? this.getNameFor(attacker.type);
    const evt: AttackExecutedEvent = {
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
    eventBus.emit(evt);

    // 5) KO éventuel
    if (!defender.isAlive()) {
      const endEvt: BattleEndedEvent = {
        kind: "BattleEnded",
        timestamp: Date.now(),
        winner: attacker.name,
        loser: defender.name,
      };
      eventBus.emit(endEvt);
    }

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

//#region Attaques concrètes
export class NormalAttack extends Attack {
  constructor() { super("Normal", NORMAL_ATTACK_KI_COST); }
  public getNameFor(_type: WarriorType): string { return NORMAL_ATTACK_NAME; }
  protected getStrengthMultiplier(): number { return NORMAL_STRENGTH_MULTIPLIER; }
}

export class KiEnergyAttack extends Attack {
  constructor() { super("KiEnergy", KI_ENERGY_ATTACK_KI_COST); }
  public getNameFor(type: WarriorType): string {
    return (KI_ENERGY_ATTACK_NAME_BY_RACE as Record<WarriorType, string>)[type];
  }
  protected getStrengthMultiplier(): number { return KI_ENERGY_STRENGTH_MULTIPLIER; }
}

// Special : applique un Effect (Decorator). Dispo => SPECIAL_UNLOCK_TURN, 1×/combattant.
export class SpecialAttack extends Attack {
  constructor() { super("Special", SPECIAL_ATTACK_KI_COST); }

  public getNameFor(type: WarriorType): string {
    if (type === "Saiyan")
      return "Super Saiyan";
    if (type === "Namekian")
      return "Regeneration";
    return "Energy Leech";
  }

  protected getStrengthMultiplier(): number { return 0; } // pas de dégâts directs

  public override execute(attacker: Warrior, defender: Warrior): AttackResult {
    if (currentTurn < SPECIAL_UNLOCK_TURN) {
      throw new Error(`Special is available from turn ${SPECIAL_UNLOCK_TURN}.`);
    }
    if (!attacker.isAlive()) 
      throw new Error(`${attacker.name} cannot act (down).`);
    if (!defender.isAlive())
      throw new Error(`${defender.name} is already down.`);
    if (specialUsedThisBattle.has(attacker.name)) {
      throw new Error(`${attacker.name} has already used their Special this battle.`);
    }

    // Coût (garde le pipeline uniforme)
    const adjustedCost = attacker.adjustKiCost(this.kiCost);
    const kiBefore = attacker.getKi();
    attacker.spendKi(adjustedCost);
    const kiAfter = attacker.getKi();
    const kiSpent = Math.max(0, kiBefore - kiAfter);

    // Appliquer l’effet (durée standard configurable)
    const rounds = EFFECT_DEFAULT_ROUNDS;
    switch (attacker.type) {
      case "Saiyan":
        new SuperSaiyanEffect(attacker, rounds).apply(); // buff STR/SPD
        break;
      case "Namekian":
        new RegenerationEffect(attacker, rounds).apply(); // +KI/+VIT par action
        break;
      case "Android":
        new EnergyLeechEffect(attacker, defender, rounds).apply(); // −KI sur la cible
        break;
    }

    specialUsedThisBattle.add(attacker.name);

    const attackLabel = attacker.getAttackLabel?.(this.kind) ?? this.getNameFor(attacker.type);
    const evt: AttackExecutedEvent = {
      kind: "AttackExecuted",
      timestamp: Date.now(),
      attacker: attacker.name,
      defender: defender.name,
      attackName: attackLabel,
      kiSpent,
      damage: 0,
      defenderRemainingVitality: defender.getVitality(),
      attackerRemainingKi: attacker.getKi(),
    };
    eventBus.emit(evt);

    return new AttackResult(
      attacker.name,
      defender.name,
      attackLabel,
      kiSpent,
      0,
      defender.getVitality(),
      attacker.getKi()
    );
  }
}
//#endregion
