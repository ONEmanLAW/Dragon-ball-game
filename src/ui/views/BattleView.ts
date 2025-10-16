import { TurnManager } from "../../app/TurnManager";
import { GameManager } from "../../app/GameManager";
import type { Warrior } from "../../domain/Warrior";
import type { AttackKind } from "../../domain/Attacks";
import { hasUsedSpecialInCurrentBattle } from "../../domain/Attacks";
import {
  SPECIAL_UNLOCK_TURN,
  SPECIAL_REQUIRED_KI,
  SPECIAL_LOW_HEALTH_RATIO,
} from "../../domain/Balance";
import { eventBus } from "../../events/EventBus";
import type {
  GameEvent,
  AttackExecutedEvent,
  StateChangedEvent,
  TurnChangedEvent,
  BattleEndedEvent,
  EffectStartedEvent,
  EffectTickEvent,
  EffectEndedEvent,
} from "../../events/GameEvents";
import { CommandBus, CommandContext, AttackCommand, EndTurnCommand, logMiddleware } from "../../domain/commands";

type El<T extends HTMLElement> = T;

export class BattleView {
  private gm = GameManager.getInstance();

  private section!: El<HTMLElement>;
  private elTurn!: El<HTMLDivElement>;
  private elLog!: El<HTMLDivElement>;
  private elP1!: El<HTMLDivElement>;
  private elP2!: El<HTMLDivElement>;
  private btnBasic!: El<HTMLButtonElement>;
  private btnKi!: El<HTMLButtonElement>;
  private btnSpecial!: El<HTMLButtonElement>;

  private turn?: TurnManager;
  private battleOver = false;
  private subscribed = false;
  private onEnded?: (winnerName: string) => void;

  private cmdCtx = new CommandContext(GameManager.getInstance());
  private cmdBus = new CommandBus(this.cmdCtx, [logMiddleware]);

  constructor(private readonly cb: { onExit: () => void }) {}

  public mount(): void {
    this.section  = document.getElementById("battle-section") as HTMLElement;
    this.elTurn   = document.getElementById("turn") as HTMLDivElement;
    this.elLog    = document.getElementById("log") as HTMLDivElement;
    this.elP1     = document.getElementById("card-1") as HTMLDivElement;
    this.elP2     = document.getElementById("card-2") as HTMLDivElement;
    this.btnBasic = document.getElementById("btn-basic") as HTMLButtonElement;
    this.btnKi    = document.getElementById("btn-ki") as HTMLButtonElement;
    this.btnSpecial = document.getElementById("btn-special") as HTMLButtonElement;

    this.btnBasic.addEventListener("click", () => this.handleAttack("Normal"));
    this.btnKi.addEventListener("click", () => this.handleAttack("KiEnergy"));
    this.btnSpecial.addEventListener("click", () => this.handleAttack("Special"));
  }

  public startBattle(p1: Warrior, p2: Warrior, onEnded?: (winnerName: string) => void): void {
    this.elLog.innerHTML = "";
    this.battleOver = false;
    this.onEnded = onEnded;
    this.turn = new TurnManager(p1, p2);
    this.cmdCtx.setTurn(this.turn);
    this.ensureSubscribed();
    this.renderAll();
    this.log(`Battle started! ${this.turn.getActive().name} begins.`);
  }

  public stop(): void {
    this.battleOver = true;
    this.turn = undefined;
    this.cmdCtx.setTurn(undefined);
    this.ensureUnsubscribed();
    this.disableButtons();
  }

  private handleAttack(kind: AttackKind): void {
    if (this.battleOver || !this.turn) return;

    const attacker = this.turn.getActive();
    const defender = this.turn.getOpponent();

    const r1 = this.cmdBus.dispatch(new AttackCommand(kind, attacker, defender));
    if (!r1.ok) { this.log(`⛔ ${r1.error}`); return; }

    if (!this.battleOver) {
      const r2 = this.cmdBus.dispatch(new EndTurnCommand());
      if (!r2.ok) this.log(`⛔ ${r2.error}`);
    }
  }

  private ensureSubscribed(): void {
    if (this.subscribed) return;
    eventBus.subscribe(this.observer);
    this.subscribed = true;
  }
  private ensureUnsubscribed(): void {
    if (!this.subscribed) return;
    eventBus.unsubscribe(this.observer);
    this.subscribed = false;
  }

  private observer = { update: (event: GameEvent) => this.onGameEvent(event) };

  private onGameEvent(event: GameEvent): void {
    switch (event.kind) {
      case "AttackExecuted": {
        const e = event as AttackExecutedEvent;
        this.log(`• ${e.attacker} → ${e.attackName} → ${e.defender} (Ki -${e.kiSpent}, Dmg ${e.damage}, ${e.defender} VIT ${e.defenderRemainingVitality})`);
        this.renderAll();
        break;
      }
      case "StateChanged": {
        const e = event as StateChangedEvent;
        this.log(`⚡ ${e.warrior} state: ${e.from} → ${e.to}`);
        this.renderAll();
        break;
      }
      case "TurnChanged": {
        const e = event as TurnChangedEvent;
        this.log(`▶️ Turn ${e.turnNumber} — ${e.active}'s turn.`);
        this.renderAll();
        break;
      }
      case "EffectStarted": {
        const e = event as EffectStartedEvent;
        this.log(`✨ ${e.who} activates ${this.effectLabel(e.effect)} — ${e.totalRounds} round(s).`);
        this.renderAll();
        break;
      }
      case "EffectTick": {
        const e = event as EffectTickEvent;
        this.log(`⏳ ${e.who} ${this.effectLabel(e.effect)} — ${e.remainingRounds} round(s) left.`);
        this.renderAll();
        break;
      }
      case "EffectEnded": {
        const e = event as EffectEndedEvent;
        this.log(`🔚 ${e.who} ${this.effectLabel(e.effect)} ended.`);
        this.renderAll();
        break;
      }
      case "BattleEnded": {
        const e = event as BattleEndedEvent;
        this.battleOver = true;
        this.log(`🏁 ${e.loser} is down. ${e.winner} wins!`);
        this.disableButtons();
        this.renderAll();
        if (this.onEnded) {
          const cb = this.onEnded;
          this.onEnded = undefined;
          cb(e.winner);
        }
        break;
      }
    }
  }

  private effectLabel(kind: "SuperSaiyan" | "Regeneration" | "EnergyLeech"): string {
    if (kind === "SuperSaiyan") return "Super Saiyan";
    if (kind === "Regeneration") return "Regeneration";
    return "Energy Leech";
  }

  private renderAll(): void {
    if (!this.turn) return;
    const active   = this.turn.getActive();
    const opponent = this.turn.getOpponent();

    this.elTurn.textContent = `Turn ${this.turn.getTurnNumber()} — Active: ${active.name}`;
    this.renderWarriorCard(this.elP1, active, true);
    this.renderWarriorCard(this.elP2, opponent, false);

    const ongoing = !this.battleOver && active.isAlive() && opponent.isAlive();

    this.btnBasic.textContent   = active.getAttackLabel?.("Normal")   ?? "Basic Attack";
    this.btnKi.textContent      = active.getAttackLabel?.("KiEnergy") ?? "Ki Energy";
    this.btnSpecial.textContent = active.getAttackLabel?.("Special")  ?? "Special";

    const turnOK = this.turn.getTurnNumber() >= SPECIAL_UNLOCK_TURN;
    const used   = hasUsedSpecialInCurrentBattle(active.name);
    const gateOK = active.getKi() >= SPECIAL_REQUIRED_KI
      || (active.getVitality() / active.stats.vitality) <= SPECIAL_LOW_HEALTH_RATIO;

    this.btnBasic.disabled  = !ongoing;
    this.btnKi.disabled     = !ongoing;
    this.btnSpecial.disabled = !ongoing || !turnOK || used || !gateOK;

    this.btnSpecial.title = !ongoing ? "" :
      (!turnOK
        ? `Available from turn ${SPECIAL_UNLOCK_TURN}.`
        : used
          ? "Already used this battle."
          : (!gateOK
              ? `Requires ≥ ${SPECIAL_REQUIRED_KI} Ki or low HP.`
              : ""));
  }

  private renderWarriorCard(root: HTMLDivElement, w: Warrior, active: boolean): void {
    const s = w.stats;
    const effects = w.getStatusTags();
    const effectsHtml = effects.length
      ? `<div class="effects">${effects.map(t => `<span class="badge">${t}</span>`).join(" ")}</div>`
      : "";

    root.innerHTML = `
      <div class="card ${active ? "active" : ""}">
        <div class="card-header">
          <span class="name">${w.name}</span>
          <span class="type">[${w.type}]</span>
        </div>
        <div class="card-body">
          <div>Level: <strong>${w.getLevel()}</strong></div>
          <div>State: <strong>${w.getStateName()}</strong></div>
          ${effectsHtml}
          <div>STR: <strong>${s.strength}</strong></div>
          <div>SPD: <strong>${s.speed}</strong></div>
          <div>KI: <strong>${w.getKi()}</strong></div>
          <div>VIT: <strong>${w.getVitality()}</strong></div>
        </div>
      </div>`;
  }

  private log(line: string): void {
    const p = document.createElement("p");
    p.textContent = line;
    this.elLog.appendChild(p);
    this.elLog.scrollTop = this.elLog.scrollHeight;
  }

  private disableButtons(): void {
    this.btnBasic.disabled = true;
    this.btnKi.disabled = true;
    this.btnSpecial.disabled = true;
  }
}
