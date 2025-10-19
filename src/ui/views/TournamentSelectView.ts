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
  private typeEl!: HTMLDivElement;

  private statStr!: HTMLDivElement;
  private statSpd!: HTMLDivElement;
  private statKi!: HTMLDivElement;
  private statVit!: HTMLDivElement;

  private img!: HTMLImageElement;

  private list: Warrior[] = [];
  private index = 0;

  // animation 3 frames
  private animTimer: number | undefined;
  private fps = 6;

  constructor(private readonly cb: {
    onBack: () => void;
    onChosen: (fighterName: string) => void;
  }) {}

  public mount(): void {
    this.section   = document.getElementById("tournament-select-section") as HTMLElement;
    this.btnBack   = document.getElementById("tselect-back") as HTMLButtonElement;
    this.btnPrev   = document.getElementById("tselect-prev") as HTMLButtonElement;
    this.btnNext   = document.getElementById("tselect-next") as HTMLButtonElement;
    this.btnChoose = document.getElementById("tselect-choose") as HTMLButtonElement;

    this.nameEl = document.getElementById("tselect-name") as HTMLDivElement;
    this.typeEl = document.getElementById("tselect-type") as HTMLDivElement;

    this.statStr = document.getElementById("tselect-str") as HTMLDivElement;
    this.statSpd = document.getElementById("tselect-spd") as HTMLDivElement;
    this.statKi  = document.getElementById("tselect-ki")  as HTMLDivElement;
    this.statVit = document.getElementById("tselect-vit") as HTMLDivElement;

    this.img = document.getElementById("tselect-sprite") as HTMLImageElement;

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
    // positionner sur le dernier custom si tu veux (facultatif). Ici on garde 0.
    if (!this.list.length) return;

    // clamp au cas où
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

  // sprites 3 frames (depuis presets.json si dispo)
  private framesFor(w: Warrior): string[] {
    const presets = presetsJson as WarriorPreset[];
    const preset = presets.find(p => p.name === w.name && Array.isArray(p.spriteFrames) && p.spriteFrames.length > 0);
    const raw = preset?.spriteFrames ?? this.gm.getSpriteFramesForRace?.(w.type as WarriorType) ?? [];
    return raw.map(p => new URL(p, import.meta.url).toString());
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
