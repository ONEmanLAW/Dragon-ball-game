// Pattern: Proxy : gating d’accès à la Special avant délégation.
import { Attack, SpecialAttack, AttackResult } from "./Attacks";
import type { Warrior, WarriorType } from "./Warrior";
import {
  SPECIAL_REQUIRED_KI,
  SPECIAL_LOW_HEALTH_RATIO,
  SPECIAL_ATTACK_KI_COST,
} from "./Balance";

// Proxy : applique des règles d’accès AVANT de déléguer à SpecialAttack
export class SpecialAttackProxy extends Attack {
  //#region Fields
  private readonly innerAttack = new SpecialAttack();
  //#endregion

  //#region Ctor
  constructor() {
    super("Special", SPECIAL_ATTACK_KI_COST);
  }
  //#endregion

  //#region Overrides
  public getNameFor(type: WarriorType): string {
    return this.innerAttack.getNameFor(type);
  }

  protected getStrengthMultiplier(): number {
    return 0;
  }

  public override execute(attacker: Warrior, defender: Warrior): AttackResult {
    const hasRequiredKi = attacker.getKi() >= SPECIAL_REQUIRED_KI;
    const isLowHealth = attacker.getVitality() / attacker.stats.vitality <= SPECIAL_LOW_HEALTH_RATIO;

    if (!hasRequiredKi && !isLowHealth) {
      const percent = Math.round(SPECIAL_LOW_HEALTH_RATIO * 100);
      throw new Error(`Special requires ≥ ${SPECIAL_REQUIRED_KI} Ki or health ≤ ${percent}%.`);
    }

    // Délègue à la vraie SpecialAttack (tour ≥ N, 1×/combat, events, etc.)
    return this.innerAttack.execute(attacker, defender);
  }
  //#endregion
}
