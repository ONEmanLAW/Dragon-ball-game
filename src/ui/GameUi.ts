// ────────────────────────────────────────────────────────────
// GameUI : colle l’UI au système d’événements : (Observer)
// ────────────────────────────────────────────────────────────

import { GameManager } from "../core/GameManagerSingleton";
import { TurnManager } from "../core/TurnManager";
import { eventBus } from "../events/EventBus";
import type { GameEvent, AttackExecutedEvent, StateChangedEvent, TurnChangedEvent } from "../events/GameEvents";
import type { Warrior } from "../models/Warrior";
import type { WarriorPreset } from "../data/WarriorPreset";
import presetsJson from "../data/warriors.json" assert { type: "json" };

type El<T extends HTMLElement> = T;
type SimpleAttack = "Normal" | "KiEnergy";

export class GameUI {
  private gameManager = GameManager.getInstance();
  private turn: TurnManager | null = null;

  // - - Data -- //
  private presets: WarriorPreset[] = [];

  // - - DOM refs -- //
  private elTurn!: El<HTMLDivElement>;
  private elLog!: El<HTMLDivElement>;
  private elP1!: El<HTMLDivElement>;
  private elP2!: El<HTMLDivElement>;

  private btnBasic!: El<HTMLButtonElement>;
  private btnKi!: El<HTMLButtonElement>;
  private btnStart!: El<HTMLButtonElement>;

  private selP1!: El<HTMLSelectElement>;
  private selP2!: El<HTMLSelectElement>;

  //#region Boot
  public boot(): void {
    // Presets => GameManager + mémoire locale
    this.presets = presetsJson as WarriorPreset[];
    this.gameManager.loadPresets(this.presets);

    // DOM + UI init
    this.cacheDom();
    this.populateSelects();
    this.bindEvents();

    // Observer (une seule fois)
    eventBus.subscribe({ update: (event: GameEvent) => this.onGameEvent(event) });

    // UI initiale (pas de combat lancé)
    this.disableActions(true);
    this.renderPreBattle();
    this.log("Select fighters and press Start Battle.");
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
    this.btnStart = document.getElementById("btn-start") as HTMLButtonElement;

    this.selP1 = document.getElementById("select-p1") as HTMLSelectElement;
    this.selP2 = document.getElementById("select-p2") as HTMLSelectElement;
  }

  private populateSelects(): void {
    const toOption = (p: WarriorPreset) =>
      `<option value="${p.id}">${p.name} [${p.type}]</option>`;

    this.selP1.innerHTML = this.presets.map(toOption).join("");
    this.selP2.innerHTML = this.presets.map(toOption).join("");

    // -- Default -- //
    const has = (id: string) => this.presets.some(p => p.id === id);
    this.selP1.value = has("goku") ? "goku" : this.presets[0]?.id ?? "";
    this.selP2.value = has("piccolo") ? "piccolo" : this.presets[1]?.id ?? this.presets[0]?.id ?? "";
  }

  private bindEvents(): void {
    // Start battle
    this.btnStart.addEventListener("click", () => this.onStartBattle());

    // Attacks
    this.btnBasic.addEventListener("click", () => this.handleAttack("Normal"));
    this.btnKi.addEventListener("click", () => this.handleAttack("KiEnergy"));

    const fixMirror = () => {
      if (this.selP1.value && this.selP1.value === this.selP2.value) {
        const alt = this.presets.find(p => p.id !== this.selP1.value);
        if (alt) this.selP2.value = alt.id;
      }
    };
    this.selP1.addEventListener("change", fixMirror);
    this.selP2.addEventListener("change", fixMirror);
  }
  //#endregion

  //#region Start / Actions
  private onStartBattle(): void {
    const id1 = this.selP1.value;
    const id2 = this.selP2.value;

    if (!id1 || !id2) { this.log("⛔ Choose two fighters."); return; }
    if (id1 === id2)   { this.log("⛔ Fighters must be different."); return; }

    // Spawn via presets (Factory derrière)
    const w1 = this.gameManager.spawnPreset(id1);
    const w2 = this.gameManager.spawnPreset(id2);

    // Tour par tour
    this.turn = new TurnManager(w1, w2);

    // UI run
    this.disableActions(false);
    this.renderAll();
    this.log(`Battle started! ${this.turn.getActive().name} begins.`);
  }

  private handleAttack(kind: SimpleAttack): void {
    if (!this.turn) { this.log("⛔ Start a battle first."); return; }

    const attacker = this.turn.getActive();
    const defender = this.turn.getOpponent();
    const attack = this.gameManager.createAttack(kind);

    try {
      attack.execute(attacker, defender);

      if (!defender.isAlive()) {
        this.log(`🏁 ${defender.name} is down. ${attacker.name} wins!`);
        this.disableActions(true);
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
  private renderPreBattle(): void {
    this.elTurn.textContent = `Select fighters and press Start Battle`;
    this.renderPlaceholder(this.elP1, "P1");
    this.renderPlaceholder(this.elP2, "P2");
  }

  private renderAll(): void {
    if (!this.turn) { this.renderPreBattle(); return; }

    this.elTurn.textContent = `Turn ${this.turn.getTurnNumber()} — Active: ${this.turn.getActive().name}`;
    this.renderWarriorCard(this.elP1, this.turn.getActive(), true);
    this.renderWarriorCard(this.elP2, this.turn.getOpponent(), false);
  }

  private renderWarriorCard(root: HTMLDivElement, w: Warrior, active: boolean): void {
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

  private renderPlaceholder(root: HTMLDivElement, label: string): void {
    root.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="name">— ${label} —</span>
          <span class="type">[N/A]</span>
        </div>
        <div class="card-body">
          <div>State: <strong>—</strong></div>
          <div>KI: <strong>—</strong></div>
          <div>VIT: <strong>—</strong></div>
        </div>
      </div>
    `;
  }
  //#endregion

  //#region Utils
  private disableActions(disabled: boolean): void {
    this.btnBasic.disabled = disabled;
    this.btnKi.disabled = disabled;
  }

  private log(line: string): void {
    const p = document.createElement("p");
    p.textContent = line;
    this.elLog.appendChild(p);
    this.elLog.scrollTop = this.elLog.scrollHeight;
  }
  //#endregion
}

// Bootstrap explicite appelé par main.ts
export function bootGameUI(): void {
  new GameUI().boot();
}

