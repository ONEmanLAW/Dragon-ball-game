// Patterns: Template Method + Observer + Result Object
// - Template Method: pipeline d’attaque (coût=>esquive=>dégâts=>events=>KO).
// - Observer: publie AttackExecuted/AttackDodged/BattleEnded.
// - Result Object: AttackResult encapsule la sortie.

import { eventBus } from "../events/EventBus";
import type {
  GameEvent,
  AttackExecutedEvent,
  AttackDodgedEvent,
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
import { SPECIAL_EFFECT_BY_RACE } from "./Effects";

//#region Combat state
let currentTurn = 1; // round partagé P1/P2
const specialUsedThisBattle = new Set<string>(); // noms des warriors ayant utilisé la spéciale

eventBus.subscribe({
  update: (e: GameEvent) => {
    if (e.kind === "TurnChanged") currentTurn = (e as TurnChangedEvent).turnNumber;
    else if (e.kind === "BattleStarted") specialUsedThisBattle.clear();
  },
});

// Helper UI
export function hasUsedSpecialInCurrentBattle(warriorName: string): boolean {
  return specialUsedThisBattle.has(warriorName);
}
//#endregion

//#region Public types
export type AttackKind = "Normal" | "KiEnergy" | "Special";
//#endregion

//#region Result object
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
  toLine(): string {
    return `${this.attackerName} → ${this.attackName} → ${this.defenderName} (Ki -${this.kiSpent}, Damage ${this.damageDealt}, Defender VIT ${this.defenderRemainingVitality})`;
  }
}
//#endregion

//#region Helpers (esquive)
function dodgeChanceFromSpeed(speed: number): number {
  // 0% à SPD ≤ 10 ; 70% à SPD ≥ 100 ; linéaire entre les deux
  const MIN_SPEED = 10;
  const MAX_SPEED = 100;
  const MAX_CHANCE = 0.70;
  const ratio = (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
  const chance = ratio * MAX_CHANCE;
  return Math.max(0, Math.min(MAX_CHANCE, chance));
}

function shouldDodge(defender: Warrior, kind: AttackKind): boolean {
  if (kind === "Special") return false; // les Specials ici ne font pas de dégâts directs
  const chance = dodgeChanceFromSpeed(defender.stats.speed);
  return Math.random() < chance;
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

  // Pipeline : coût KI => esquive éventuelle => dégâts => events => KO
  public execute(attacker: Warrior, defender: Warrior): AttackResult {
    if (!attacker.isAlive()) throw new Error(`${attacker.name} cannot act (down).`);
    if (!defender.isAlive()) throw new Error(`${defender.name} is already down.`);

    // 1) Coût KI (state-aware)
    const adjustedCost = attacker.adjustKiCost(this.kiCost);
    const kiBefore = attacker.getKi();
    attacker.spendKi(adjustedCost); // Android: no-op
    const kiAfter = attacker.getKi();
    const kiSpent = Math.max(0, kiBefore - kiAfter);

    const attackLabel = attacker.getAttackLabel?.(this.kind) ?? this.getNameFor(attacker.type);

    // 2) Esquive potentielle
    if (shouldDodge(defender, this.kind)) {
      const dodgeEvt: AttackDodgedEvent = {
        kind: "AttackDodged",
        timestamp: Date.now(),
        attacker: attacker.name,
        defender: defender.name,
        attackName: attackLabel,
      };
      eventBus.emit(dodgeEvt);

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

    // 3) Dégâts (STR × mult) modulés par l’état
    const baseDamage = Math.floor(attacker.stats.strength * this.getStrengthMultiplier());
    const finalDamage = attacker.adjustOutgoingDamage(baseDamage);

    // 4) Application
    defender.receiveDamage(finalDamage);

    // 5) Event
    const executedEvt: AttackExecutedEvent = {
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
    eventBus.emit(executedEvt);

    // 6) KO éventuel
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

//#region Concrete attacks
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

export class SpecialAttack extends Attack {
  constructor() { super("Special", SPECIAL_ATTACK_KI_COST); }

  public getNameFor(type: WarriorType): string {
    if (type === "Saiyan") return "Super Saiyan";
    if (type === "Namekian") return "Regeneration";
    return "Energy Leech";
  }

  protected getStrengthMultiplier(): number { return 0; }

  public override execute(attacker: Warrior, defender: Warrior): AttackResult {
    if (currentTurn < SPECIAL_UNLOCK_TURN) {
      throw new Error(`Special is available from turn ${SPECIAL_UNLOCK_TURN}.`);
    }
    if (!attacker.isAlive()) throw new Error(`${attacker.name} cannot act (down).`);
    if (!defender.isAlive()) throw new Error(`${defender.name} is already down.`);
    if (specialUsedThisBattle.has(attacker.name)) {
      throw new Error(`${attacker.name} has already used their Special this battle.`);
    }

    const adjustedCost = attacker.adjustKiCost(this.kiCost);
    const kiBefore = attacker.getKi();
    attacker.spendKi(adjustedCost);
    const kiAfter = attacker.getKi();
    const kiSpent = Math.max(0, kiBefore - kiAfter);

    const effectFactory = SPECIAL_EFFECT_BY_RACE[attacker.type];
    if (!effectFactory) throw new Error(`No special effect registered for race: ${attacker.type}`);
    const effect = effectFactory(attacker, defender);
    effect.apply();

    specialUsedThisBattle.add(attacker.name);

    const attackLabel = attacker.getAttackLabel?.(this.kind) ?? this.getNameFor(attacker.type);
    const executedEvt: AttackExecutedEvent = {
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
    eventBus.emit(executedEvt);

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
