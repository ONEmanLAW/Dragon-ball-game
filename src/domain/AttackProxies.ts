// AttackProxies — Proxy Pattern pour contrôler l’accès aux transformations

import { Attack, SpecialAttack, AttackResult } from "./Attacks";
import type { Warrior, WarriorType } from "./Warrior";
import {
  SPECIAL_REQUIRED_KI,
  SPECIAL_LOW_HEALTH_RATIO,
  SPECIAL_ATTACK_KI_COST,
} from "./Balance";

// Proxy : applique des règles d’accès supplémentaires AVANT de déléguer à SpecialAttack
export class SpecialAttackProxy extends Attack {
  private readonly inner = new SpecialAttack();

  constructor() {
    super("Special", SPECIAL_ATTACK_KI_COST);
  }

  public getNameFor(type: WarriorType): string {
    return this.inner.getNameFor(type);
  }

  protected getStrengthMultiplier(): number {
    return 0;
  }

  public override execute(attacker: Warrior, defender: Warrior): AttackResult {
    // Conditions de gating "hors pipeline" :
    const kiOK   = attacker.getKi() >= SPECIAL_REQUIRED_KI;
    const lowHP  = attacker.getVitality() / attacker.stats.vitality <= SPECIAL_LOW_HEALTH_RATIO;

    if (!kiOK && !lowHP) {
      const pct = Math.round(SPECIAL_LOW_HEALTH_RATIO * 100);
      throw new Error(
        `Special requires ≥ ${SPECIAL_REQUIRED_KI} Ki or health ≤ ${pct}%.`
      );
    }

    // Délégation à la vraie SpecialAttack (qui gère tour ≥ N, 1×/combat, events, etc.)
    return this.inner.execute(attacker, defender);
  }
}
