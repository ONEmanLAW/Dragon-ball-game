import { GameManager } from "../../app/GameManager";
import type { Warrior } from "../../domain/Warrior";

type El<T extends HTMLElement> = T;

export class RosterView {
  private gm = GameManager.getInstance();

  private section!: El<HTMLElement>;
  private createdCard!: El<HTMLDivElement>;
  private selectP1!: El<HTMLSelectElement>;
  private selectP2!: El<HTMLSelectElement>;
  private btnStartBattle!: El<HTMLButtonElement>;

  private lastCreated?: Warrior;

  constructor(private readonly cb: { onStartBattle: (p1: Warrior, p2: Warrior) => void }) {}

  public mount(): void {
    this.section = document.getElementById("roster-section") as HTMLElement;
    this.createdCard = document.getElementById("created-card") as HTMLDivElement;
    this.selectP1 = document.getElementById("select-p1") as HTMLSelectElement;
    this.selectP2 = document.getElementById("select-p2") as HTMLSelectElement;
    this.btnStartBattle = document.getElementById("btn-start-battle") as HTMLButtonElement;

    this.btnStartBattle.addEventListener("click", () => this.handleStartBattle());
  }

  public setCreatedWarrior(w: Warrior): void {
    this.lastCreated = w;
    // la carte “created-card” est déjà rendue depuis CreateView, pas besoin ici
  }

  public refreshRoster(): void {
    const list = this.gm.getAllWarriors();
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

    const p1 = this.gm.getWarrior(p1Name);
    const p2 = this.gm.getWarrior(p2Name);
    if (!p1 || !p2) { alert("Invalid fighters."); return; }

    this.cb.onStartBattle(p1, p2);
  }
}
