// Patterns: Singleton (GameManager) + Builder (WarriorBuilder) + Factory (via WarriorFactory sous-jacent)

import type { Warrior, WarriorType } from "../../domain/Warrior";
import { WarriorBuilder, type SaiyanKiChoice, type NamekianKiChoice, type AndroidKiChoice } from "../../build/WarriorBuilder";
import { GameManager } from "../../app/GameManager";
import { KI_CHOICES_BY_RACE, DEFAULT_STATS_BY_RACE } from "../../domain/Balance";
import { assetUrlFromJsonPath } from "../../app/assetResolver";

//#region Types
type El<T extends HTMLElement> = T;
//#endregion

export class CreateView {
  private gameManager = GameManager.getInstance();

  private section!: El<HTMLElement>;
  private inputName!: El<HTMLInputElement>;
  private inputDesc!: El<HTMLInputElement>;
  private selectRace!: El<HTMLSelectElement>;
  private selectKi!: El<HTMLSelectElement>;
  private btnCreate!: El<HTMLButtonElement>;
  private createError!: El<HTMLDivElement>;

  private statLevel!: El<HTMLElement>;
  private statStr!: El<HTMLElement>;
  private statSpd!: El<HTMLElement>;
  private statKi!: El<HTMLElement>;
  private statVit!: El<HTMLElement>;

  private img!: HTMLImageElement;

  private frames: string[] = [];
  private frameIndex = 0;
  private animTimer: number | undefined;
  private readonly fps = 6;

  constructor(private readonly cb: { onCreated: (w: Warrior) => void }) {}

  //#region Mount / init
  public mount(): void {
    this.section = document.getElementById("create-section") as HTMLElement;

    this.inputName = document.getElementById("input-name") as HTMLInputElement;
    this.inputDesc = document.getElementById("input-description") as HTMLInputElement;
    this.selectRace = document.getElementById("select-race") as HTMLSelectElement;
    this.selectKi = document.getElementById("select-ki") as HTMLSelectElement;
    this.btnCreate = document.getElementById("btn-create") as HTMLButtonElement;
    this.createError = document.getElementById("create-error") as HTMLDivElement;

    this.statLevel = document.getElementById("stat-level") as HTMLElement;
    this.statStr = document.getElementById("stat-str") as HTMLElement;
    this.statSpd = document.getElementById("stat-spd") as HTMLElement;
    this.statKi = document.getElementById("stat-ki") as HTMLElement;
    this.statVit = document.getElementById("stat-vit") as HTMLElement;

    this.img = document.getElementById("sprite-img") as HTMLImageElement;

    this.selectRace.addEventListener("change", () => {
      const race = this.getSelectedRace();
      this.populateKiChoices(race);
      this.renderStats(race);
      this.setFramesFromJson(race);
    });

    this.btnCreate.addEventListener("click", () => this.handleCreate());

    const initialRace = this.getSelectedRace();
    this.populateKiChoices(initialRace);
    this.renderStats(initialRace);
    this.setFramesFromJson(initialRace);
  }
  //#endregion

  //#region Visibility hooks
  public onShow(): void { this.startAnim(); }
  public onHide(): void { this.stopAnim(); }
  //#endregion

  //#region UI helpers
  private getSelectedRace(): WarriorType {
    return (this.selectRace.value as WarriorType) || "Saiyan";
  }

  private populateKiChoices(race: WarriorType): void {
    const choices = KI_CHOICES_BY_RACE[race];
    this.selectKi.innerHTML = choices.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  private renderStats(race: WarriorType): void {
    const s = DEFAULT_STATS_BY_RACE[race];
    this.statLevel.textContent = "1";
    this.statStr.textContent = String(s.strength);
    this.statSpd.textContent = String(s.speed);
    this.statKi.textContent = String(s.ki);
    this.statVit.textContent = String(s.vitality);
  }

  private setFramesFromJson(race: WarriorType): void {
    const raw = this.gameManager.getSpriteFramesForRace(race) ?? [];
    this.frames = raw.map(p => assetUrlFromJsonPath(p, import.meta.url));
    this.frameIndex = 0;

    if (this.frames.length > 0) {
      this.img.src = this.frames[0];
      this.img.alt = `${race} preview`;
    }

    if (!this.section.hidden) {
      this.stopAnim();
      this.startAnim();
    }
  }
  //#endregion

  //#region Anim
  private startAnim(): void {
    if (this.animTimer || this.frames.length === 0) return;
    const delay = Math.max(30, Math.floor(1000 / this.fps));
    this.animTimer = window.setInterval(() => {
      if (this.frames.length === 0) return;
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.img.src = this.frames[this.frameIndex];
    }, delay) as unknown as number;
  }

  private stopAnim(): void {
    if (this.animTimer) {
      clearInterval(this.animTimer);
      this.animTimer = undefined;
    }
  }
  //#endregion

  //#region Create flow
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
      const builder = new WarriorBuilder().ofRace(race).named(name).describedAs(desc);
      if (race === "Saiyan") builder.withSaiyanKi(ki as SaiyanKiChoice);
      if (race === "Namekian") builder.withNamekianKi(ki as NamekianKiChoice);
      if (race === "Android") builder.withAndroidKi(ki as AndroidKiChoice);

      const warrior = builder.build();
      this.cb.onCreated(warrior);
    } catch (e: any) {
      this.createError.textContent = e?.message ?? "Creation failed.";
    }
  }
  //#endregion
}
