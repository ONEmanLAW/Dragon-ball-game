// ────────────────────────────────────────────────────────────
// GameUI — Flow: Create => Roster (choose P1/P2) => Battle
// ────────────────────────────────────────────────────────────

import { GameManager } from "../core/GameManagerSingleton";
import { TurnManager } from "../core/TurnManager";
import { eventBus } from "../events/EventBus";
import type { GameEvent, AttackExecutedEvent, StateChangedEvent, TurnChangedEvent } from "../events/GameEvents";
import type { Warrior, WarriorType } from "../models/Warrior";
import type { WarriorPreset } from "../data/WarriorPreset";
import presetsJson from "../data/warriors.json";
import { WarriorBuilder } from "../builders/WarriorBuilder";

type El<T extends HTMLElement> = T;
type SimpleAttack = "Normal" | "KiEnergy";

// - - KI options par race (UI) -- //
const KI_CHOICES: Record<WarriorType, string[]> = {
  Saiyan:   ["Kamehameha", "Final Flash"],
  Namekian: ["Makankōsappō"],
  Android:  ["Laser Shot"],
};

export class GameUI {
  private gameManager = GameManager.getInstance();
  private turn!: TurnManager;

  // ── Sections
  private sectionCreate!: El<HTMLElement>;
  private sectionRoster!: El<HTMLElement>;
  private sectionBattle!: El<HTMLElement>;

  // ── Create form
  private inputName!: El<HTMLInputElement>;
  private inputDesc!: El<HTMLInputElement>;
  private selectRace!: El<HTMLSelectElement>;
  private selectKi!: El<HTMLSelectElement>;
  private btnCreate!: El<HTMLButtonElement>;
  private createError!: El<HTMLDivElement>;
  private createdCard!: El<HTMLDivElement>;

  // ── Roster selects
  private selectP1!: El<HTMLSelectElement>;
  private selectP2!: El<HTMLSelectElement>;
  private btnStartBattle!: El<HTMLButtonElement>;

  // ── Battle DOM
  private elTurn!: El<HTMLDivElement>;
  private elLog!: El<HTMLDivElement>;
  private elP1!: El<HTMLDivElement>;
  private elP2!: El<HTMLDivElement>;
  private btnBasic!: El<HTMLButtonElement>;
  private btnKi!: El<HTMLButtonElement>;

  //#region Boot
  public boot(): void {
    this.gameManager.loadPresets(presetsJson as WarriorPreset[]);
    for (const p of presetsJson as WarriorPreset[]) this.gameManager.spawnPreset(p.id);

    // DOM & events
    this.cacheDom();
    this.bindCreateForm();
    this.bindRoster();
    this.bindBattleButtons();

    // Init UI
    this.populateKiChoices(this.getSelectedRace());
    this.populateRosterSelects();
    this.showOnly("create");

    // Observer
    eventBus.subscribe({ update: (e: GameEvent) => this.onGameEvent(e) });
  }
  //#endregion

  //#region DOM helpers
  private cacheDom(): void {
    // Sections
    this.sectionCreate = document.getElementById("create-section") as HTMLElement;
    this.sectionRoster = document.getElementById("roster-section") as HTMLElement;
    this.sectionBattle = document.getElementById("battle-section") as HTMLElement;

    // Create
    this.inputName   = document.getElementById("input-name") as HTMLInputElement;
    this.inputDesc   = document.getElementById("input-description") as HTMLInputElement;
    this.selectRace  = document.getElementById("select-race") as HTMLSelectElement;
    this.selectKi    = document.getElementById("select-ki") as HTMLSelectElement;
    this.btnCreate   = document.getElementById("btn-create") as HTMLButtonElement;
    this.createError = document.getElementById("create-error") as HTMLDivElement;
    this.createdCard = document.getElementById("created-card") as HTMLDivElement;

    // Roster
    this.selectP1 = document.getElementById("select-p1") as HTMLSelectElement;
    this.selectP2 = document.getElementById("select-p2") as HTMLSelectElement;
    this.btnStartBattle = document.getElementById("btn-start-battle") as HTMLButtonElement;

    // Battle
    this.elTurn = document.getElementById("turn") as HTMLDivElement;
    this.elLog  = document.getElementById("log") as HTMLDivElement;
    this.elP1   = document.getElementById("card-1") as HTMLDivElement;
    this.elP2   = document.getElementById("card-2") as HTMLDivElement;
    this.btnBasic = document.getElementById("btn-basic") as HTMLButtonElement;
    this.btnKi    = document.getElementById("btn-ki") as HTMLButtonElement;
  }

  private bindCreateForm(): void {
    this.selectRace.addEventListener("change", () => {
      this.populateKiChoices(this.getSelectedRace());
    });
    this.btnCreate.addEventListener("click", () => this.handleCreate());
  }

  private bindRoster(): void {
    this.btnStartBattle.addEventListener("click", () => this.handleStartBattle());
  }

  private bindBattleButtons(): void {
    this.btnBasic.addEventListener("click", () => this.handleAttack("Normal"));
    this.btnKi.addEventListener("click", () => this.handleAttack("KiEnergy"));
  }

  private showOnly(which: "create" | "roster" | "battle"): void {
    this.sectionCreate.hidden = which !== "create";
    this.sectionRoster.hidden = which !== "roster";
    this.sectionBattle.hidden = which !== "battle";
  }
  //#endregion

  //#region Create flow
  private getSelectedRace(): WarriorType {
    return (this.selectRace.value as WarriorType) || "Saiyan";
    }

  private populateKiChoices(race: WarriorType): void {
    const choices = KI_CHOICES[race];
    this.selectKi.innerHTML = choices.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  private handleCreate(): void {
    this.createError.textContent = "";

    const name = this.inputName.value.trim();
    const desc = this.inputDesc.value.trim() || "Custom warrior";
    const race = this.getSelectedRace();
    const ki   = this.selectKi.value;

    if (!name) {
      this.createError.textContent = "Please enter a name.";
      return;
    }
    if (this.gameManager.getWarrior(name)) {
      this.createError.textContent = "A warrior with this name already exists.";
      return;
    }

    try {
      const b = new WarriorBuilder().ofRace(race).named(name).describedAs(desc);

      if (race === "Saiyan") b.withSaiyanKi(ki as any);
      if (race === "Namekian") b.withNamekianKi(ki as any);
      if (race === "Android") b.withAndroidKi(ki as any);

      const warrior = b.build();
      this.gameManager.registerWarrior(warrior);

      this.renderCreatedCard(warrior);
      this.populateRosterSelects();
      this.showOnly("roster");
    } catch (e: any) {
      this.createError.textContent = e?.message ?? "Creation failed.";
    }
  }

  private renderCreatedCard(w: Warrior): void {
    const s = w.stats;
    this.createdCard.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="name">${w.name}</span>
          <span class="type">[${w.type}]</span>
        </div>
        <div class="card-body">
          <div>Level: <strong>${w.getLevel?.() ?? 1}</strong></div>
          <div>State: <strong>${w.getStateName()}</strong></div>

          <!-- - - stats clés -- -->
          <div>STR: <strong>${s.strength}</strong></div>
          <div>SPD: <strong>${s.speed}</strong></div>

          <!-- - - ressources actuelles -- -->
          <div>KI: <strong>${w.getKi()}</strong></div>
          <div>VIT: <strong>${w.getVitality()}</strong></div>

          <div>Desc: <strong>${(w as any).description}</strong></div>
        </div>
      </div>
    `;
  }

  //#endregion

  //#region Roster flow
  private populateRosterSelects(): void {
    const list = this.gameManager.getAllWarriors();
    const options = list.map(w => `<option value="${w.name}">${w.name} [${w.type}]</option>`).join("");
    this.selectP1.innerHTML = options;
    this.selectP2.innerHTML = options;

    // Par défaut : P1 = perso créé si présent
    const last = list[list.length - 1];
    if (last) this.selectP1.value = last.name;
    // Évite P1=P2 par défaut
    if (this.selectP2.value === this.selectP1.value && list.length > 1) {
      this.selectP2.value = list[0].name === last.name ? list[1].name : list[0].name;
    }
  }

  private handleStartBattle(): void {
    const p1Name = this.selectP1.value;
    const p2Name = this.selectP2.value;

    if (p1Name === p2Name) {
      alert("Choose two different fighters.");
      return;
    }

    const p1 = this.gameManager.getWarrior(p1Name);
    const p2 = this.gameManager.getWarrior(p2Name);
    if (!p1 || !p2) {
      alert("Invalid fighters.");
      return;
    }

    this.turn = new TurnManager(p1, p2);
    this.showOnly("battle");

    this.renderAll();
    this.log(`Battle started! ${this.turn.getActive().name} begins.`);
  }
  //#endregion

  //#region Battle actions
  private handleAttack(kind: SimpleAttack): void {
    const attacker = this.turn.getActive();
    const defender = this.turn.getOpponent();
    const attack = this.gameManager.createAttack(kind);

    try {
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

  private renderWarriorCard(root: HTMLDivElement, w: Warrior, active: boolean): void {
    const s = w.stats;
    root.innerHTML = `
      <div class="card ${active ? "active" : ""}">
        <div class="card-header">
          <span class="name">${w.name}</span>
          <span class="type">[${w.type}]</span>
        </div>
        <div class="card-body">
          <div>Level: <strong>${w.getLevel?.() ?? 1}</strong></div>
          <div>State: <strong>${w.getStateName()}</strong></div>

          <!-- - - stats clés -- -->
          <div>STR: <strong>${s.strength}</strong></div>
          <div>SPD: <strong>${s.speed}</strong></div>

          <!-- - - ressources actuelles -- -->
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

// Bootstrap appelé par main.ts
export function bootGameUI(): void { new GameUI().boot(); }
