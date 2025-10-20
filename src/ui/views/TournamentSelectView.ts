// Patterns: View (UI)

import { GameManager } from "../../app/GameManager";
import type { Warrior, WarriorType } from "../../domain/Warrior";
import type { WarriorPreset } from "../../data/WarriorPreset";
import presetsJson from "../../data/warriors.json";

type El<T extends HTMLElement> = T;

export class TournamentSelectView {
  //#region Fields
  private gameManager = GameManager.getInstance();

  private section!: El<HTMLElement>;
  private buttonBack!: HTMLButtonElement;
  private buttonPrevious!: HTMLButtonElement;
  private buttonNext!: HTMLButtonElement;
  private buttonChoose!: HTMLButtonElement;

  private nameElement!: HTMLDivElement;
  private typeElement!: HTMLSpanElement;

  private statStrength!: HTMLDivElement;
  private statSpeed!: HTMLDivElement;
  private statKi!: HTMLDivElement;
  private statVitality!: HTMLDivElement;

  private imageElement!: HTMLImageElement;

  private list: Warrior[] = [];
  private index = 0;

  private animTimer: number | undefined;
  private framesPerSecond = 6;
  //#endregion

  constructor(private readonly cb: { onBack: () => void; onChosen: (fighterName: string) => void }) {}

  //#region Lifecycle
  public mount(): void {
    this.section = document.getElementById("tournament-select-section") as HTMLElement;

    this.buttonBack = document.getElementById("ts-back") as HTMLButtonElement;
    this.buttonPrevious = document.getElementById("ts-prev") as HTMLButtonElement;
    this.buttonNext = document.getElementById("ts-next") as HTMLButtonElement;
    this.buttonChoose = document.getElementById("ts-choose") as HTMLButtonElement;

    this.nameElement = document.getElementById("ts-name") as HTMLDivElement;
    this.typeElement = document.getElementById("ts-type") as HTMLSpanElement;

    this.statStrength = document.getElementById("ts-str") as HTMLDivElement;
    this.statSpeed = document.getElementById("ts-spd") as HTMLDivElement;
    this.statKi = document.getElementById("ts-ki") as HTMLDivElement;
    this.statVitality = document.getElementById("ts-vit") as HTMLDivElement;

    this.imageElement = document.getElementById("ts-sprite") as HTMLImageElement;

    this.buttonBack.addEventListener("click", () => this.handleBack());
    this.buttonPrevious.addEventListener("click", () => this.prev());
    this.buttonNext.addEventListener("click", () => this.next());
    this.buttonChoose.addEventListener("click", () => {
      const w = this.list[this.index];
      if (w) this.cb.onChosen(w.name);
    });
  }

  public onShow(): void {
    this.list = this.gameManager.getAllWarriors();
    if (!this.list.length) return;

    this.index = Math.max(0, Math.min(this.index, this.list.length - 1));
    this.render();
    this.startAnim();
  }

  public onHide(): void {
    this.stopAnim();
  }
  //#endregion

  //#region Handlers
  private handleBack(): void {
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
  //#endregion

  //#region Rendering
  private render(): void {
    const w = this.list[this.index];
    if (!w) return;

    this.nameElement.textContent = w.name;
    this.typeElement.textContent = `[${w.type}]`;

    this.statStrength.textContent = String(w.stats.strength);
    this.statSpeed.textContent = String(w.stats.speed);
    this.statKi.textContent = String(w.stats.ki);
    this.statVitality.textContent = String(w.stats.vitality);

    this.setFrames(this.imageElement, this.framesFor(w));
  }
  //#endregion

  //#region Animation
  private startAnim(): void {
    if (this.animTimer) return;
    const delay = Math.max(30, Math.floor(1000 / this.framesPerSecond));
    this.animTimer = window.setInterval(() => {
      const frames: string[] = (this.imageElement as any)._frames || [];
      if (!frames.length) return;
      let idx: number = (this.imageElement as any)._index ?? 0;
      idx = (idx + 1) % frames.length;
      (this.imageElement as any)._index = idx;
      this.imageElement.src = frames[idx];
    }, delay) as unknown as number;
  }

  private stopAnim(): void {
    if (!this.animTimer) return;
    clearInterval(this.animTimer);
    this.animTimer = undefined;
  }
  //#endregion

  //#region Helpers
  private framesFor(warrior: Warrior): string[] {
    const presets = presetsJson as (WarriorPreset & { spriteFrames?: string[] })[];
    const preset = presets.find(p => p.name === warrior.name && Array.isArray(p.spriteFrames) && p.spriteFrames.length > 0);
    const raw = preset?.spriteFrames ?? this.gameManager.getSpriteFramesForRace(warrior.type as WarriorType) ?? [];
    return raw.map(p => new URL(p, import.meta.url).toString());
  }

  private setFrames(img: HTMLImageElement, frames: string[]): void {
    (img as any)._frames = frames;
    (img as any)._index = 0;
    img.src = frames[0] ?? "";
  }
  //#endregion
}
