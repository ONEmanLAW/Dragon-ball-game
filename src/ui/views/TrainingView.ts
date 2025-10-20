// Patterns: View (UI)

import { GameManager } from "../../app/GameManager";
import type { Warrior } from "../../domain/Warrior";

type El<T extends HTMLElement> = T;

type Callbacks = {
  onCancel: () => void;
  onDone: () => void;
};

export class TrainingView {
  private gm = GameManager.getInstance();

  private section!: El<HTMLElement>;
  private btnBack!: HTMLButtonElement;
  private btnContinue!: HTMLButtonElement;

  private nameEl!: HTMLDivElement;
  private typeEl!: HTMLSpanElement;

  private statStr!: HTMLDivElement;
  private statSpd!: HTMLDivElement;
  private statKi!: HTMLDivElement;
  private statVit!: HTMLDivElement;
  private pointsEl!: HTMLDivElement;

  private btnStr!: HTMLButtonElement;
  private btnSpd!: HTMLButtonElement;
  private btnKiMax!: HTMLButtonElement;
  private btnVitMax!: HTMLButtonElement;
  private btnKiRec!: HTMLButtonElement;

  private current?: Warrior;
  private points = 0;

  constructor(private readonly cb: Callbacks) {}

  public mount(): void {
    this.section = document.getElementById("training-section") as HTMLElement;
    this.btnBack = document.getElementById("training-back") as HTMLButtonElement;
    this.btnContinue = document.getElementById("training-continue") as HTMLButtonElement;

    this.nameEl = document.getElementById("tr-name") as HTMLDivElement;
    this.typeEl = document.getElementById("tr-type") as HTMLSpanElement;

    this.statStr = document.getElementById("tr-str") as HTMLDivElement;
    this.statSpd = document.getElementById("tr-spd") as HTMLDivElement;
    this.statKi  = document.getElementById("tr-ki")  as HTMLDivElement;
    this.statVit = document.getElementById("tr-vit") as HTMLDivElement;

    this.pointsEl = document.getElementById("tr-points") as HTMLDivElement;

    this.btnStr   = document.getElementById("tr-btn-str")   as HTMLButtonElement;
    this.btnSpd   = document.getElementById("tr-btn-spd")   as HTMLButtonElement;
    this.btnKiMax = document.getElementById("tr-btn-kimax") as HTMLButtonElement;
    this.btnVitMax= document.getElementById("tr-btn-vitmax")as HTMLButtonElement;
    this.btnKiRec = document.getElementById("tr-btn-kirec") as HTMLButtonElement;

    this.btnBack.addEventListener("click", () => this.cb.onCancel());
    this.btnContinue.addEventListener("click", () => this.finish());

    this.btnStr.addEventListener("click", () => this.spend("STR"));
    this.btnSpd.addEventListener("click", () => this.spend("SPD"));
    this.btnKiMax.addEventListener("click", () => this.spend("KIMAX"));
    this.btnVitMax.addEventListener("click", () => this.spend("VITMAX"));
    this.btnKiRec.addEventListener("click", () => this.spend("KIREC"));
  }

  public startFor(playerName: string, points = 2): void {
    const w = this.gm.getWarrior(playerName);
    if (!w) return;
    this.current = w;
    this.points = points;
    // Règle campagne: entre combats
    // recup la vie mais pas le ki
    w.heal(w.stats.vitality * 2);
    this.render();
  }

  public onShow(): void { this.render(); }
  public onHide(): void {}

  private render(): void {
    const w = this.current;
    if (!w) return;
    this.nameEl.textContent = w.name;
    this.typeEl.textContent = `[${w.type}]`;

    this.statStr.textContent = String(w.stats.strength);
    this.statSpd.textContent = String(w.stats.speed);
    this.statKi.textContent  = `${w.getKi()}/${w.stats.ki}`;
    this.statVit.textContent = `${w.getVitality()}/${w.stats.vitality}`;

    this.pointsEl.textContent = `Points: ${this.points}`;
    const can = this.points > 0;
    this.btnStr.disabled   = !can;
    this.btnSpd.disabled   = !can;
    this.btnKiMax.disabled = !can;
    this.btnVitMax.disabled= !can;
    this.btnKiRec.disabled = !can;

    this.btnContinue.disabled = this.points > 0;
  }

  private spend(kind: "STR"|"SPD"|"KIMAX"|"VITMAX"|"KIREC"): void {
    if (this.points <= 0 || !this.current) return;
    const w = this.current;
    switch (kind) {
      case "STR":    w.stats.strength += 2; break;
      case "SPD":    w.stats.speed    += 2; break;
      case "KIMAX":  w.stats.ki       += 20; break;
      case "VITMAX": w.stats.vitality += 25; w.heal(99999); break;
      case "KIREC":  w.gainKi(70); break;
    }
    this.points -= 1;
    this.render();
  }

  private finish(): void {
    if (this.points > 0) return;
    this.cb.onDone();
  }
}
