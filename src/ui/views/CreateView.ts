import type { Warrior, WarriorType } from "../../domain/Warrior";
import { WarriorBuilder } from "../../build/WarriorBuilder";
import { GameManager } from "../../app/GameManager";
import { KI_CHOICES_BY_RACE } from "../../domain/Balance";

type El<T extends HTMLElement> = T;

export class CreateView {
  private gm = GameManager.getInstance();

  // DOM
  private section!: El<HTMLElement>;
  private inputName!: El<HTMLInputElement>;
  private inputDesc!: El<HTMLInputElement>;
  private selectRace!: El<HTMLSelectElement>;
  private selectKi!: El<HTMLSelectElement>;
  private btnCreate!: El<HTMLButtonElement>;
  private createError!: El<HTMLDivElement>;
  private createdCard!: El<HTMLDivElement>;

  constructor(private readonly cb: { onCreated: (w: Warrior) => void }) {}

  public mount(): void {
    this.section = document.getElementById("create-section") as HTMLElement;
    this.inputName = document.getElementById("input-name") as HTMLInputElement;
    this.inputDesc = document.getElementById("input-description") as HTMLInputElement;
    this.selectRace = document.getElementById("select-race") as HTMLSelectElement;
    this.selectKi = document.getElementById("select-ki") as HTMLSelectElement;
    this.btnCreate = document.getElementById("btn-create") as HTMLButtonElement;
    this.createError = document.getElementById("create-error") as HTMLDivElement;
    this.createdCard = document.getElementById("created-card") as HTMLDivElement;

    this.selectRace.addEventListener("change", () => this.populateKiChoices(this.getSelectedRace()));
    this.btnCreate.addEventListener("click", () => this.handleCreate());

    // init
    this.populateKiChoices(this.getSelectedRace());
  }

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
    if (this.gm.getWarrior(name)) {
      this.createError.textContent = "A warrior with this name already exists.";
      return;
    }

    try {
      const b = new WarriorBuilder().ofRace(race).named(name).describedAs(desc);
      if (race === "Saiyan")   b.withSaiyanKi(ki as any);
      if (race === "Namekian") b.withNamekianKi(ki as any);
      if (race === "Android")  b.withAndroidKi(ki as any);

      const warrior = b.build();
      // carte “créé récemment”
      this.renderCreatedCard(warrior);

      // remonte à l’orchestrateur
      this.cb.onCreated(warrior);
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
}
