import type { Warrior, WarriorType } from "../../domain/Warrior";
import { WarriorBuilder } from "../../build/WarriorBuilder";
import { GameManager } from "../../app/GameManager";
import { KI_CHOICES_BY_RACE, DEFAULT_STATS_BY_RACE } from "../../domain/Balance";

type El<T extends HTMLElement> = T;

const SPRITE_FRAMES: Record<WarriorType, string[]> = {
  Saiyan: [
    new URL("../../assets/characters/goku_idle_01.png", import.meta.url).toString(),
    new URL("../../assets/characters/goku_idle_02.png", import.meta.url).toString(),
    new URL("../../assets/characters/goku_idle_03.png", import.meta.url).toString(),
  ],
  Namekian: [
    new URL("../../assets/characters/picolo_idle_01.png", import.meta.url).toString(),
    new URL("../../assets/characters/picolo_idle_02.png", import.meta.url).toString(),
    new URL("../../assets/characters/picolo_idle_03.png", import.meta.url).toString(),
  ],
  Android: [
    new URL("../../assets/characters/android17_idle_01.png", import.meta.url).toString(),
    new URL("../../assets/characters/android17_idle_02.png", import.meta.url).toString(),
    new URL("../../assets/characters/android17_idle_03.png", import.meta.url).toString(),
  ],
};

export class CreateView {
  private gm = GameManager.getInstance();

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
  private readonly fps = 5;

  constructor(private readonly cb: { onCreated: (w: Warrior) => void }) {}

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
      this.setFrames(race);
    });

    this.btnCreate.addEventListener("click", () => this.handleCreate());

    const initialRace = this.getSelectedRace();
    this.populateKiChoices(initialRace);
    this.renderStats(initialRace);
    this.setFrames(initialRace);
  }

  // Appelés par AppUI lors du changement d’écran
  public onShow(): void {
    this.startAnim();
  }
  public onHide(): void {
    this.stopAnim();
  }

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

  private setFrames(race: WarriorType): void {
    this.frames = SPRITE_FRAMES[race] ?? [];
    this.frameIndex = 0;
    if (this.frames.length > 0) {
      this.img.src = this.frames[0];
      this.img.alt = `${race} preview`;
    }
    // relance proprement si on est visible
    if (!this.section.hidden) {
      this.stopAnim();
      this.startAnim();
    }
  }

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
      this.cb.onCreated(warrior);
    } catch (e: any) {
      this.createError.textContent = e?.message ?? "Creation failed.";
    }
  }
}
