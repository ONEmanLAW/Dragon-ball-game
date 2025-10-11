// src/ui/GameUI.ts
import { GameManager } from "../core/GameManagerSingleton";
import { WarriorFactory } from "../core/WarriorFactory";
import { TurnManager } from "../core/TurnManager";
import { eventBus } from "../events/EventBus";
import type { GameEvent, AttackExecutedEvent, StateChangedEvent, TurnChangedEvent } from "../events/GameEvents";

type El<T extends HTMLElement> = T;
type SimpleAttack = "Normal" | "KiEnergy";

export class GameUI {
  private gameManager = GameManager.getInstance();
  private turn!: TurnManager;

  // DOM refs
  private elTurn!: El<HTMLDivElement>;
  private elLog!: El<HTMLDivElement>;
  private elP1!: El<HTMLDivElement>;
  private elP2!: El<HTMLDivElement>;
  private btnBasic!: El<HTMLButtonElement>;
  private btnKi!: El<HTMLButtonElement>;

  //#region Boot
  public boot(): void {
    // 1) Créer deux guerriers via Factory
    const c17 = WarriorFactory.create("Android",   "C17", "Android des");

    const piccolo = WarriorFactory.create("Namekian", "Piccolo", "Wise Namekian strategist");

    // 2) (singleton)
    // this.gameManager.registerWarrior(goku);
    // this.gameManager.registerWarrior(piccolo);

    // 3) Tour par tour
    this.turn = new TurnManager(c17, piccolo);

    // 4) DOM
    this.cacheDom();
    this.bindEvents();

    // 5) Observer 
    eventBus.subscribe({ update: (event: GameEvent) => this.onGameEvent(event) });

    // 6) Premier rendu
    this.renderAll();
    this.log(`Battle started! ${this.turn.getActive().name} begins.`);
  }
  //#endregion

  //#region DOM helpers
  private cacheDom(): void {
    this.elTurn = document.getElementById("turn") as HTMLDivElement;
    this.elLog  = document.getElementById("log") as HTMLDivElement;

    this.elP1 = document.getElementById("card-1") as HTMLDivElement;
    this.elP2 = document.getElementById("card-2") as HTMLDivElement;

    this.btnBasic = document.getElementById("btn-basic") as HTMLButtonElement;
    this.btnKi    = document.getElementById("btn-ki") as HTMLButtonElement;
  }

  private bindEvents(): void {
    this.btnBasic.addEventListener("click", () => this.handleAttack("Normal"));
    this.btnKi.addEventListener("click", () => this.handleAttack("KiEnergy"));
  }
  //#endregion

  //#region Actions
  private handleAttack(kind: SimpleAttack): void {
    const attacker = this.turn.getActive();
    const defender = this.turn.getOpponent();
    const attack = this.gameManager.createAttack(kind);

    try {
      // (Observer)
      attack.execute(attacker, defender);

      if (!defender.isAlive()) {
        this.log(`🏁 ${defender.name} is down. ${attacker.name} wins!`);
        this.disableButtons();
        return;
      }

      this.turn.nextTurn();
    } catch (e: any) {
      this.log(`⛔ ${e?.message ?? "Action not allowed."}`);
    }
  }
  //#endregion

  //#region Observer handler
  private onGameEvent(event: GameEvent): void {
    switch (event.kind) {
      case "AttackExecuted": {
        const e = event as AttackExecutedEvent;
        this.log(
          `• ${e.attacker} → ${e.attackName} → ${e.defender} ` +
          `(Ki -${e.kiSpent}, Dmg ${e.damage}, ${e.defender} VIT ${e.defenderRemainingVitality})`
        );
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
    }
  }
  //#endregion

  //#region Render
  private renderAll(): void {
    this.elTurn.textContent = `Turn ${this.turn.getTurnNumber()} — Active: ${this.turn.getActive().name}`;
    this.renderWarriorCard(this.elP1, this.turn.getActive(), true);
    this.renderWarriorCard(this.elP2, this.turn.getOpponent(), false);

    const ongoing = this.turn.getActive().isAlive() && this.turn.getOpponent().isAlive();
    this.btnBasic.disabled = !ongoing;
    this.btnKi.disabled    = !ongoing;
  }

  private renderWarriorCard(root: HTMLDivElement, w: any, active: boolean): void {
    root.innerHTML = `
      <div class="card ${active ? "active" : ""}">
        <div class="card-header">
          <span class="name">${w.name}</span>
          <span class="type">[${w.type}]</span>
        </div>
        <div class="card-body">
          <div>State: <strong>${w.getStateName()}</strong></div>
          <div>KI: <strong>${w.getKi()}</strong></div>
          <div>VIT: <strong>${w.getVitality()}</strong></div>
        </div>
      </div>
    `;
  }
  //#endregion

  //#region Log & utils
  private log(line: string): void {
    const p = document.createElement("p");
    p.textContent = line;
    this.elLog.appendChild(p);
    this.elLog.scrollTop = this.elLog.scrollHeight;
  }

  private disableButtons(): void {
    this.btnBasic.disabled = true;
    this.btnKi.disabled = true;
  }
  //#endregion
}

// Bootstrap explicite appelé par main.ts
export function bootGameUI(): void {
  new GameUI().boot();
}
