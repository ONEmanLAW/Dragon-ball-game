// GameUI : Create => Roster (P1/P2) → Battle
// Gère le flux UI, écoute les events et loggue tout (attaques/états/effets).

import { GameManager } from "../app/GameManager";
import { TurnManager } from "../app/TurnManager";

import { eventBus } from "../events/EventBus";
import type {
  GameEvent,
  AttackExecutedEvent,
  StateChangedEvent,
  TurnChangedEvent,
  BattleEndedEvent,
  EffectStartedEvent,
  EffectTickEvent,
  EffectEndedEvent,
} from "../events/GameEvents";

import type { Warrior, WarriorType } from "../domain/Warrior";
import type { WarriorPreset } from "../data/WarriorPreset";
import presetsJson from "../data/warriors.json";

import { WarriorBuilder } from "../build/WarriorBuilder";
import { hasUsedSpecialInCurrentBattle, type AttackKind } from "../domain/Attacks";
import { SPECIAL_UNLOCK_TURN, KI_CHOICES_BY_RACE } from "../domain/Balance";

//#region Types DOM
type El<T extends HTMLElement> = T;
type SimpleAttack = AttackKind;
//#endregion

//#region Choix KI (UI)
const KI_CHOICES: Record<WarriorType, string[]> = {
  Saiyan: ["Kamehameha", "Final Flash"],
  Namekian: ["Makankōsappō"],
  Android: ["Laser Shot"],
};
//#endregion

export class GameUI {
  private gameManager = GameManager.getInstance();
  private turn!: TurnManager;
  private battleOver = false;

  //#region Sections
  private sectionCreate!: El<HTMLElement>;
  private sectionRoster!: El<HTMLElement>;
  private sectionBattle!: El<HTMLElement>;
  //#endregion

  //#region Create form
  private inputName!: El<HTMLInputElement>;
  private inputDesc!: El<HTMLInputElement>;
  private selectRace!: El<HTMLSelectElement>;
  private selectKi!: El<HTMLSelectElement>;
  private btnCreate!: El<HTMLButtonElement>;
  private createError!: El<HTMLDivElement>;
  private createdCard!: El<HTMLDivElement>;
  //#endregion

  //#region Roster
  private selectP1!: El<HTMLSelectElement>;
  private selectP2!: El<HTMLSelectElement>;
  private btnStartBattle!: El<HTMLButtonElement>;
  //#endregion

  //#region Battle UI
  private elTurn!: El<HTMLDivElement>;
  private elLog!: El<HTMLDivElement>;
  private elP1!: El<HTMLDivElement>;
  private elP2!: El<HTMLDivElement>;
  private btnBasic!: El<HTMLButtonElement>;
  private btnKi!: El<HTMLButtonElement>;
  private btnSpecial!: El<HTMLButtonElement>;
  //#endregion

  //#region Boot
  public boot(): void {
    // presets => registre + instanciation
    this.gameManager.loadPresets(presetsJson as WarriorPreset[]);
    for (const p of presetsJson as WarriorPreset[]) this.gameManager.spawnPreset(p.id);

    this.cacheDom();
    this.bindCreateForm();
    this.bindRoster();
    this.bindBattleButtons();

    this.populateKiChoices(this.getSelectedRace());
    this.populateRosterSelects();
    this.showOnly("create");

    // Observer global
    eventBus.subscribe({ update: (e: GameEvent) => this.onGameEvent(e) });
  }
  //#endregion

  //#region DOM helpers
  private cacheDom(): void {
    this.sectionCreate = document.getElementById("create-section") as HTMLElement;
    this.sectionRoster = document.getElementById("roster-section") as HTMLElement;
    this.sectionBattle = document.getElementById("battle-section") as HTMLElement;

    this.inputName = document.getElementById("input-name") as HTMLInputElement;
    this.inputDesc = document.getElementById("input-description") as HTMLInputElement;
    this.selectRace = document.getElementById("select-race") as HTMLSelectElement;
    this.selectKi = document.getElementById("select-ki") as HTMLSelectElement;
    this.btnCreate = document.getElementById("btn-create") as HTMLButtonElement;
    this.createError = document.getElementById("create-error") as HTMLDivElement;
    this.createdCard = document.getElementById("created-card") as HTMLDivElement;

    this.selectP1 = document.getElementById("select-p1") as HTMLSelectElement;
    this.selectP2 = document.getElementById("select-p2") as HTMLSelectElement;
    this.btnStartBattle = document.getElementById("btn-start-battle") as HTMLButtonElement;

    this.elTurn = document.getElementById("turn") as HTMLDivElement;
    this.elLog = document.getElementById("log") as HTMLDivElement;
    this.elP1 = document.getElementById("card-1") as HTMLDivElement;
    this.elP2 = document.getElementById("card-2") as HTMLDivElement;

    this.btnBasic = document.getElementById("btn-basic") as HTMLButtonElement;
    this.btnKi = document.getElementById("btn-ki") as HTMLButtonElement;
    this.btnSpecial = document.getElementById("btn-special") as HTMLButtonElement;
  }

  private bindCreateForm(): void {
    this.selectRace.addEventListener("change", () => this.populateKiChoices(this.getSelectedRace()));
    this.btnCreate.addEventListener("click", () => this.handleCreate());
  }

  private bindRoster(): void {
    this.btnStartBattle.addEventListener("click", () => this.handleStartBattle());
  }

  private bindBattleButtons(): void {
    this.btnBasic.addEventListener("click", () => this.handleAttack("Normal"));
    this.btnKi.addEventListener("click", () => this.handleAttack("KiEnergy"));
    this.btnSpecial.addEventListener("click", () => this.handleAttack("Special"));
  }

  private showOnly(which: "create" | "roster" | "battle"): void {
    this.sectionCreate.hidden = which !== "create";
    this.sectionRoster.hidden = which !== "roster";
    this.sectionBattle.hidden = which !== "battle";
    if (which === "battle") this.battleOver = false;
  }
  //#endregion

  //#region Create flow
  private getSelectedRace(): WarriorType {
    return (this.selectRace.value as WarriorType) || "Saiyan";
  }

  private populateKiChoices(race: WarriorType): void {
    const choices = KI_CHOICES_BY_RACE[race];
    this.selectKi.innerHTML = choices.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  private handleCreate(): void {
    this.createError.textContent = "";

    const name = this.inputName.value.trim();
    const desc = this.inputDesc.value.trim() || "Custom warrior";
    const race = this.getSelectedRace();
    const ki = this.selectKi.value;

    if (!name) { this.createError.textContent = "Please enter a name."; return; }
    if (this.gameManager.getWarrior(name)) {
      this.createError.textContent = "A warrior with this name already exists.";
      return;
    }

    try {
      const b = new WarriorBuilder().ofRace(race).named(name).describedAs(desc);
      if (race === "Saiyan")   b.withSaiyanKi(ki as any);
      if (race === "Namekian") b.withNamekianKi(ki as any);
      if (race === "Android")  b.withAndroidKi(ki as any);

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
    const effects = w.getStatusTags();
    const effectsHtml = effects.length
      ? `<div class="effects">${effects.map(t => `<span class="badge">${t}</span>`).join(" ")}</div>`
      : "";

    this.createdCard.innerHTML = `
      <div class="card">
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
          <div>Desc: <strong>${(w as any).description}</strong></div>
        </div>
      </div>`;
  }
  //#endregion

  //#region Roster flow
  private populateRosterSelects(): void {
    const list = this.gameManager.getAllWarriors();
    const options = list.map(w => `<option value="${w.name}">${w.name} [${w.type}]</option>`).join("");
    this.selectP1.innerHTML = options;
    this.selectP2.innerHTML = options;

    const last = list[list.length - 1];
    if (last) this.selectP1.value = last.name;
    if (this.selectP2.value === this.selectP1.value && list.length > 1) {
      this.selectP2.value = list[0].name === last.name ? list[1].name : list[0].name;
    }
  }

  private handleStartBattle(): void {
    const p1Name = this.selectP1.value;
    const p2Name = this.selectP2.value;
    if (p1Name === p2Name) { alert("Choose two different fighters."); return; }

    const p1 = this.gameManager.getWarrior(p1Name);
    const p2 = this.gameManager.getWarrior(p2Name);
    if (!p1 || !p2) { alert("Invalid fighters."); return; }

    this.turn = new TurnManager(p1, p2);
    this.showOnly("battle");
    this.renderAll();
    this.log(`Battle started! ${this.turn.getActive().name} begins.`);
  }
  //#endregion

  //#region Battle actions
  private handleAttack(kind: SimpleAttack): void {
    if (this.battleOver) return;

    const attacker = this.turn.getActive();
    const defender = this.turn.getOpponent();
    const attack = this.gameManager.createAttack(kind);

    try {
      attack.execute(attacker, defender);
      if (!this.battleOver) this.turn.nextTurn();
    } catch (e: any) {
      this.log(`⛔ ${e?.message ?? "Action not allowed."}`);
    }
  }
  //#endregion

  //#region Observer : logs + render
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
        break;
      }
    }
  }

  private effectLabel(kind: "SuperSaiyan" | "Regeneration" | "EnergyLeech"): string {
    if (kind === "SuperSaiyan")
      return "Super Saiyan";
    if (kind === "Regeneration")
      return "Regeneration";
    return "Energy Leech";
  }
  //#endregion

  //#region Render
  private renderAll(): void {
    const active = this.turn.getActive();
    const opponent = this.turn.getOpponent();

    this.elTurn.textContent = `Turn ${this.turn.getTurnNumber()} — Active: ${active.name}`;
    this.renderWarriorCard(this.elP1, active, true);
    this.renderWarriorCard(this.elP2, opponent, false);

    const ongoing = !this.battleOver && active.isAlive() && opponent.isAlive();

    // labels dynamiques (issus des presets/builder)
    this.btnBasic.textContent = active.getAttackLabel?.("Normal")   ?? "Basic Attack";
    this.btnKi.textContent = active.getAttackLabel?.("KiEnergy") ?? "Ki Energy";
    this.btnSpecial.textContent = active.getAttackLabel?.("Special")  ?? "Special";

    // enable/disable
    this.btnBasic.disabled = !ongoing;
    this.btnKi.disabled = !ongoing;

    const turnOK = this.turn.getTurnNumber() >= SPECIAL_UNLOCK_TURN;
    const used = hasUsedSpecialInCurrentBattle(active.name);
    this.btnSpecial.disabled = !ongoing || !turnOK || used;
    this.btnSpecial.title = !ongoing
      ? ""
      : !turnOK
        ? `Available from turn ${SPECIAL_UNLOCK_TURN}.`
        : used
          ? "Already used this battle."
          : "";
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
    this.btnSpecial.disabled = true;
  }
  //#endregion
}

// Bootstrap explicite
export function bootGameUI(): void { new GameUI().boot(); }
