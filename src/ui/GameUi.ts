import { GameManager } from "../core/GameManagerSingleton";
import { WarriorFactory } from "../core/WarriorFactory";
import { AttackResult } from "../combat/Attacks";
import { TurnManager } from "../core/TurnManager";

type El<T extends HTMLElement> = T;

export class GameUI {
  private gameManager = GameManager.getInstance();
  private turn!: TurnManager;

  // Elements du Dom
  private elTurn!: El<HTMLDivElement>;
  private elLog!: El<HTMLDivElement>;
  private elP1!: El<HTMLDivElement>;
  private elP2!: El<HTMLDivElement>;
  private btnBasic!: El<HTMLButtonElement>;
  private btnKi!: El<HTMLButtonElement>;

  
  public boot(): void {
    // Creer Warrior
    const c17 = WarriorFactory.create("Android", "C-17", "Android");

    const piccolo = WarriorFactory.create("Namekian", "Piccolo", "Wise Namekian strategist");


    // Register
    // this.gameManager.registerWarrior(c17);
    // this.gameManager.registerWarrior(piccolo);

    // Turn Managers
    this.turn = new TurnManager(c17, piccolo);

    // Hook Dom
    this.cacheDom();
    this.bindEvents();

    // premiere peinture
    this.renderAll();
    this.log(`Battle started ${this.turn.getActive().name} begins`);
  }

   private cacheDom(): void {
    this.elTurn = document.getElementById("turn") as HTMLDivElement;
    this.elLog = document.getElementById("log") as HTMLDivElement;

    this.elP1 = document.getElementById("card-1") as HTMLDivElement;
    this.elP2 = document.getElementById("card-2") as HTMLDivElement;

    this.btnBasic = document.getElementById("btn-basic") as HTMLButtonElement;
    this.btnKi = document.getElementById("btn-ki") as HTMLButtonElement;
  }

  private bindEvents(): void {
    this.btnBasic.addEventListener("click", () => this.handleAttack("Normal"));

    this.btnKi.addEventListener("click", () => this.handleAttack("KiEnergy"));
  }

  //#region Actions
  private handleAttack(kind: "Normal" | "KiEnergy"): void {
    const attacker = this.turn.getActive();
    const defender = this.turn.getOpponent();

    const attack = this.gameManager.createAttack(kind);

    try {
      const result: AttackResult = attack.execute(attacker, defender);
      this.log(this.formatResultLine(result));
      this.renderAll();

      // Victoire ?
      if (!defender.isAlive()) {
        this.log(`🏁 ${defender.name} is down. ${attacker.name} wins!`);
        this.disableButtons();
        return;
      }

      // Tour suivant
      this.turn.nextTurn();
      this.renderAll();
      this.log(`▶️ ${this.turn.getActive().name}'s turn.`);
    } catch (error: any) {

      // sauf Android
      this.log(`⛔ ${error?.message ?? "Action not allowed."}`);
    }
  }

  //#endregion

  //#region Render
  private renderAll(): void {
    // Bandeau de tour
    this.elTurn.textContent = `Turn ${this.turn.getTurnNumber()} — Active: ${this.turn.getActive().name}`;

    this.renderWarriorCard(this.elP1, this.turn.getActive(), true);
    this.renderWarriorCard(this.elP2, this.turn.getOpponent(), false);


    const ongoing = this.turn.getActive().isAlive() && this.turn.getOpponent().isAlive();
    this.btnBasic.disabled = !ongoing;
    this.btnKi.disabled = !ongoing;
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

  private formatResultLine(r: AttackResult): string {
    return `• ${r.attackerName} → ${r.attackName} → ${r.defenderName} ` + `(Ki -${r.kiSpent}, Dmg ${r.damageDealt}, ${r.defenderName} VIT ${r.defenderRemainingVitality})`;
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
  }

  //#endregion
}

// -- go to main.ts -- //
export function bootGameUI(): void {
  const ui = new GameUI();
  ui.boot();
}
