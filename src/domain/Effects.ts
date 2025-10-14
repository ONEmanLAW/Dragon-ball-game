// Effects: Decorators temporaires appliqués à un Warrior
// Durée en actions du lanceur. Émet : EffectStarted / EffectTick / EffectEnded.

import { eventBus } from "../events/EventBus";
import type {
  GameEvent,
  AttackExecutedEvent,
  EffectStartedEvent,
  EffectTickEvent,
  EffectEndedEvent,
  EffectKind,
} from "../events/GameEvents";
import type { Warrior } from "./Warrior";

import {
  EFFECT_DEFAULT_ROUNDS,
  SSJ_STR_SPD_MULTIPLIER,
  REGEN_KI_PER_TICK,
  REGEN_VIT_PER_TICK,
  LEECH_KI_PER_TICK,
} from "./Balance";

//#region Utils
function labelFor(k: EffectKind): string {
  return k === "SuperSaiyan" ? "Super Saiyan" : k === "Regeneration" ? "Regeneration" : "Energy Leech";
}
//#endregion

//#region Base class
abstract class WarriorEffect {
  protected remainingRounds: number;
  private ignoreNextOwnerAction: boolean;
  private readonly tagLabel: string;

  constructor(
    protected readonly owner: Warrior,
    rounds: number = EFFECT_DEFAULT_ROUNDS,
    // true = compte l'activation ; false = commence au prochain tour du lanceur
    private readonly countOnApply: boolean,
    private readonly kind: EffectKind
  ) {
    this.remainingRounds = Math.max(0, Math.floor(rounds));
    this.ignoreNextOwnerAction = !countOnApply;
    this.tagLabel = labelFor(kind);
  }

  // Active l'effet : badge + event + hook + subscribe
  public apply(): void {
    this.owner.addStatusTag(this.tagLabel, this.remainingRounds);

    const start: EffectStartedEvent = {
      kind: "EffectStarted",
      timestamp: Date.now(),
      who: this.owner.name,
      effect: this.kind,
      totalRounds: this.remainingRounds,
    };
    eventBus.emit(start);

    this.onApplyNow();
    eventBus.subscribe(this.observer);
  }

  protected finish(): void {
    this.owner.removeStatusTag(this.tagLabel);

    const end: EffectEndedEvent = {
      kind: "EffectEnded",
      timestamp: Date.now(),
      who: this.owner.name,
      effect: this.kind,
    };
    eventBus.emit(end);

    this.onCleanup();
    eventBus.unsubscribe(this.observer);
  }

  // Hooks spécifiques aux effets
  protected onApplyNow(): void {} // appelé immédiatement à l'activation
  protected onCleanup(): void {} // appelé à la fin (rollback)
  protected onOwnerActsTick(): void {} // appelé à chaque action du lanceur

  // Écoute AttackExecuted(attacker == owner) => 1 round consommé
  private observer = {
    update: (e: GameEvent) => {
      if (e.kind !== "AttackExecuted") return;
      const evt = e as AttackExecutedEvent;
      if (evt.attacker !== this.owner.name) return;

      if (this.ignoreNextOwnerAction) {
        this.ignoreNextOwnerAction = false;
        return; // ne compte pas l'action d'activation si demandé
      }

      this.onOwnerActsTick();

      this.remainingRounds -= 1;
      if (this.remainingRounds > 0) {
        this.owner.updateStatusTag(this.tagLabel, this.remainingRounds);
        const tick: EffectTickEvent = {
          kind: "EffectTick",
          timestamp: Date.now(),
          who: this.owner.name,
          effect: this.kind,
          remainingRounds: this.remainingRounds,
        };
        eventBus.emit(tick);
      } else {
        this.finish();
      }
    },
  };
}
//#endregion

//#region Concrete effects
// Super Saiyan : +20% STR & SPD pendant N actions (sans compter l'activation).
export class SuperSaiyanEffect extends WarriorEffect {
  private baseStr!: number;
  private baseSpd!: number;

  constructor(owner: Warrior, rounds = EFFECT_DEFAULT_ROUNDS) {
    super(owner, rounds, /*countOnApply*/ false, "SuperSaiyan");
  }

  protected onApplyNow(): void {
    const s = this.owner.stats;
    this.baseStr = s.strength;
    this.baseSpd = s.speed;
    s.strength = Math.floor(s.strength * SSJ_STR_SPD_MULTIPLIER);
    s.speed = Math.floor(s.speed * SSJ_STR_SPD_MULTIPLIER);
  }

  protected onCleanup(): void {
    const s = this.owner.stats;
    s.strength = this.baseStr;
    s.speed = this.baseSpd;
  }
}

// Regeneration : à chaque action du lanceur => +KI/+VIT (clampés).
export class RegenerationEffect extends WarriorEffect {
  constructor(owner: Warrior, rounds = EFFECT_DEFAULT_ROUNDS) {
    super(owner, rounds, /*countOnApply*/ false, "Regeneration");
  }
  protected onOwnerActsTick(): void {
    this.owner.gainKi(REGEN_KI_PER_TICK);
    this.owner.heal(REGEN_VIT_PER_TICK);
  }
}

// Energy Leech : à chaque action du lanceur Android => −KI à la cible.
export class EnergyLeechEffect extends WarriorEffect {
  constructor(
    owner: Warrior,
    private readonly target: Warrior,
    rounds = EFFECT_DEFAULT_ROUNDS
  ) {
    super(owner, rounds, /*countOnApply*/ false, "EnergyLeech");
  }
  protected onOwnerActsTick(): void {
    if (!this.target.isAlive()) return;
    this.target.loseKi(LEECH_KI_PER_TICK);
  }
}
//#endregion

// Aliases de compat si l'ancien nom Decorator est encore importé
export { SuperSaiyanEffect as SuperSaiyanDecorator };
export { RegenerationEffect as RegenerationDecorator };
export { EnergyLeechEffect as EnergyLeechDecorator };

// Export base si besoin de typer
export { WarriorEffect };
