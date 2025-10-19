import { GameManager } from "../../app/GameManager";
import type { Warrior, WarriorType } from "../../domain/Warrior";
import type { WarriorPreset } from "../../data/WarriorPreset";
import presetsJson from "../../data/warriors.json";

type El<T extends HTMLElement> = T;

export class TournamentSelectView {
  private gm = GameManager.getInstance();

  private section!: El<HTMLElement>;
  private btnBack!: HTMLButtonElement;
  private btnPrev!: HTMLButtonElement;
  private btnNext!: HTMLButtonElement;
  private btnChoose!: HTMLButtonElement;

  private nameEl!: HTMLDivElement;
  private typeEl!: HTMLSpanElement;

  private statStr!: HTMLDivElement;
  private statSpd!: HTMLDivElement;
  private statKi!: HTMLDivElement;
  private statVit!: HTMLDivElement;

  private img!: HTMLImageElement;

  private list: Warrior[] = [];
  private index = 0;

  private animTimer: number | undefined;
  private fps = 6;

  constructor(private readonly cb: {
    onBack: () => void;
    onChosen: (fighterName: string) => void;
  }) {}

  public mount(): void {
    this.section   = document.getElementById("tournament-select-section") as HTMLElement;

    this.btnBack   = document.getElementById("ts-back")   as HTMLButtonElement;
    this.btnPrev   = document.getElementById("ts-prev")   as HTMLButtonElement;
    this.btnNext   = document.getElementById("ts-next")   as HTMLButtonElement;
    this.btnChoose = document.getElementById("ts-choose") as HTMLButtonElement;

    this.nameEl = document.getElementById("ts-name") as HTMLDivElement;
    this.typeEl = document.getElementById("ts-type") as HTMLSpanElement;

    this.statStr = document.getElementById("ts-str") as HTMLDivElement;
    this.statSpd = document.getElementById("ts-spd") as HTMLDivElement;
    this.statKi  = document.getElementById("ts-ki")  as HTMLDivElement;
    this.statVit = document.getElementById("ts-vit") as HTMLDivElement;

    this.img = document.getElementById("ts-sprite") as HTMLImageElement;

    this.btnBack.addEventListener("click", () => this.onBack());
    this.btnPrev.addEventListener("click", () => this.prev());
    this.btnNext.addEventListener("click", () => this.next());
    this.btnChoose.addEventListener("click", () => {
      const w = this.list[this.index];
      if (w) this.cb.onChosen(w.name);
    });
  }

  public onShow(): void {
    this.list = this.gm.getAllWarriors();
    if (!this.list.length) return;

    this.index = Math.max(0, Math.min(this.index, this.list.length - 1));
    this.render();
    this.startAnim();
  }

  public onHide(): void {
    this.stopAnim();
  }

  private onBack(): void {
    this.cb.onBack();
  }

  private prev(): void {
    if (!this.list.length) return;
    this.index = (this.index - 1 + this.list.length) % this.list.length;
    this.render();
  }

  private next(): void {
    if (!this.list.length) return;
    this.index = (this.index + 1) % this.list.length;
    this.render();
  }

  private render(): void {
    const w = this.list[this.index];
    if (!w) return;

    this.nameEl.textContent = w.name;
    this.typeEl.textContent = `[${w.type}]`;

    this.statStr.textContent = String(w.stats.strength);
    this.statSpd.textContent = String(w.stats.speed);
    this.statKi.textContent  = String(w.stats.ki);
    this.statVit.textContent = String(w.stats.vitality);

    this.setFrames(this.img, this.framesFor(w));
  }

  private framesFor(w: Warrior): string[] {
    const presets = presetsJson as (WarriorPreset & { spriteFrames?: string[] })[];
    const preset = presets.find(p => p.name === w.name && Array.isArray(p.spriteFrames) && p.spriteFrames.length > 0);
    const raw = preset?.spriteFrames ?? this.framesByRace(w.type as WarriorType);
    return raw.map(p => new URL(p, import.meta.url).toString());
  }

  private framesByRace(type: WarriorType): string[] {
    const fallback: Record<WarriorType, string[]> = {
      Saiyan:   [],
      Namekian: [],
      Android:  [],
    };
    return fallback[type] ?? [];
  }

  private setFrames(img: HTMLImageElement, frames: string[]): void {
    (img as any)._frames = frames;
    (img as any)._index = 0;
    img.src = frames[0] ?? "";
  }

  private startAnim(): void {
    if (this.animTimer) return;
    const delay = Math.max(30, Math.floor(1000 / this.fps));
    this.animTimer = window.setInterval(() => {
      const frames: string[] = (this.img as any)._frames || [];
      if (!frames.length) return;
      let index: number = (this.img as any)._index ?? 0;
      index = (index + 1) % frames.length;
      (this.img as any)._index = index;
      this.img.src = frames[index];
    }, delay) as unknown as number;
  }

  private stopAnim(): void {
    if (this.animTimer) { clearInterval(this.animTimer); this.animTimer = undefined; }
  }
}
