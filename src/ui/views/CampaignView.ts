// ui/views/CampaignView.ts
import { GameManager } from "../../app/GameManager";
import type { Warrior } from "../../domain/Warrior";

type El<T extends HTMLElement> = T;

type Callbacks = {
  onBack: () => void;
  onStartStage: (stageIndex: number) => void;
};

export class CampaignView {
  private gm = GameManager.getInstance();

  private section!: El<HTMLElement>;
  private status!: El<HTMLDivElement>;
  private grid!: El<HTMLDivElement>;
  private btnBack!: HTMLButtonElement;

  private playerName: string | null = null;
  private unlockedIndex = 0;

  // Ordre demandé: 5 combats
  private readonly stages: string[][] = [
    ["Android 16"],
    ["Trunks"],
    ["Android 18", "Android 17"],
    ["Piccolo", "Gohan"],
    ["Goku", "Vegeta"],
  ];

  constructor(private readonly cb: Callbacks) {}

  public mount(): void {
    this.section = document.getElementById("campaign-section") as HTMLElement;
    this.status  = document.getElementById("campaign-status") as HTMLDivElement;
    this.grid    = document.getElementById("campaign-grid") as HTMLDivElement;
    this.btnBack = document.getElementById("campaign-back") as HTMLButtonElement;

    this.btnBack.addEventListener("click", () => this.cb.onBack());
    this.render();
  }

  public onShow(): void { this.render(); }
  public onHide(): void {}

  public setPlayer(name: string): void {
    this.playerName = name;
  }

  // Donne la/les étiquettes adversaires pour un stage
  public getOpponentsForStage(index: number): string[] {
    return this.stages[index] ?? [];
  }

  // AppUI nous notifie quand un stage est gagné
  public markStageWon(stageIndex: number): void {
    if (stageIndex === this.unlockedIndex) {
      this.unlockedIndex = Math.min(this.unlockedIndex + 1, this.stages.length - 1);
    }
    this.render();
  }

  private render(): void {
    const cards = this.stages.map((opps, idx) => {
      const unlocked = idx <= this.unlockedIndex;
      const canPlay = unlocked;
      const title = `Fight ${idx + 1}`;
      const foes = opps.join(" & ");
      const lockText = unlocked ? "" : `<div class="c-card-lock">Locked</div>`;
      const playBtn = canPlay ? `<button class="c-card-btn" data-play="${idx}">Play</button>` : "";
      return `
        <div class="c-card ${unlocked ? "is-unlocked" : "is-locked"}">
          <div class="c-card-title">${title}</div>
          <div class="c-card-foes">${foes}</div>
          ${lockText}
          <div class="c-card-actions">${playBtn}</div>
        </div>
      `;
    }).join("");

    this.grid.innerHTML = cards;

    this.grid.querySelectorAll<HTMLButtonElement>('[data-play]').forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-play") || "0");
        // Lancement délégué à AppUI
        this.cb.onStartStage(i);
      });
    });

    this.status.textContent = `Select a fight. ${this.unlockedIndex + 1}/${this.stages.length} unlocked.`;
  }
}
