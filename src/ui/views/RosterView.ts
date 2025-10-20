// Patterns: View (UI)

import type { Warrior } from "../../domain/Warrior";
import type { WarriorPreset } from "../../data/WarriorPreset";
import presetsJson from "../../data/warriors.json";
import { GameManager } from "../../app/GameManager";

type El<T extends HTMLElement> = T;
type PlayerSlot = "p1" | "p2";

export class RosterView {
  //#region Fields
  private gameManager = GameManager.getInstance();

  private section!: El<HTMLElement>;
  private buttonStart!: HTMLButtonElement;

  private pickP1!: HTMLElement;
  private pickP2!: HTMLElement;

  private buttonP1Previous!: HTMLButtonElement;
  private buttonP1Next!: HTMLButtonElement;
  private buttonP2Previous!: HTMLButtonElement;
  private buttonP2Next!: HTMLButtonElement;

  private p1Card!: HTMLDivElement;
  private p2Card!: HTMLDivElement;

  private warriors: Warrior[] = [];
  private p1Index = 0;
  private p2Index = 1;

  private animTimer: number | undefined;
  private framesPerSecond = 6;
  private p1Img?: HTMLImageElement;
  private p2Img?: HTMLImageElement;
  //#endregion

  constructor(private readonly cb: { onStartBattle: (p1Name: string, p2Name: string) => void }) {}

  //#region Lifecycle
  public mount(): void {
    this.section = document.getElementById("roster-section") as HTMLElement;
    this.buttonStart = document.getElementById("btn-start-battle") as HTMLButtonElement;

    this.pickP1 = document.getElementById("pick-p1") as HTMLElement;
    this.pickP2 = document.getElementById("pick-p2") as HTMLElement;

    this.buttonP1Previous = document.getElementById("btn-p1-prev") as HTMLButtonElement;
    this.buttonP1Next = document.getElementById("btn-p1-next") as HTMLButtonElement;
    this.buttonP2Previous = document.getElementById("btn-p2-prev") as HTMLButtonElement;
    this.buttonP2Next = document.getElementById("btn-p2-next") as HTMLButtonElement;

    this.p1Card = document.getElementById("p1-card") as HTMLDivElement;
    this.p2Card = document.getElementById("p2-card") as HTMLDivElement;

    this.buttonP1Previous.addEventListener("click", () => this.step("p1", -1));
    this.buttonP1Next.addEventListener("click", () => this.step("p1", +1));
    this.buttonP2Previous.addEventListener("click", () => this.step("p2", -1));
    this.buttonP2Next.addEventListener("click", () => this.step("p2", +1));

    this.buttonStart.addEventListener("click", () => this.handleStart());
  }

  public onShow(): void { this.startAnim(); }
  public onHide(): void { this.stopAnim(); }
  //#endregion

  //#region Public API
  public refreshRoster(): void {
    this.warriors = this.gameManager.getAllWarriors();
    if (this.warriors.length === 0) return;

    this.p1Index = 0;
    this.p2Index = this.warriors.length > 1 ? 1 : 0;
    if (this.p2Index === this.p1Index) this.p2Index = (this.p1Index + 1) % this.warriors.length;

    this.renderSide("p1");
    this.renderSide("p2");
    this.updateHeaderPicks();
    this.updateStartButton();

    this.stopAnim();
    this.startAnim();
  }
  //#endregion

  //#region Navigation
  private step(slot: PlayerSlot, dir: -1 | 1): void {
    const len = this.warriors.length;
    if (len === 0) return;

    const avoid = slot === "p1" ? this.p2Index : this.p1Index;
    const current = slot === "p1" ? this.p1Index : this.p2Index;

    let next = (current + dir + len) % len;
    if (next === avoid) next = (next + dir + len) % len; // évite même perso des 2 côtés

    if (slot === "p1") this.p1Index = next; else this.p2Index = next;

    this.renderSide(slot);
    this.updateHeaderPicks();
    this.updateStartButton();

    this.stopAnim();
    this.startAnim();
  }

  private handleStart(): void {
    const p1 = this.warriors[this.p1Index]?.name;
    const p2 = this.warriors[this.p2Index]?.name;
    if (!p1 || !p2 || p1 === p2) return;
    this.cb.onStartBattle(p1, p2);
  }
  //#endregion

  //#region Rendering
  private renderSide(slot: PlayerSlot): void {
    const warrior = slot === "p1" ? this.warriors[this.p1Index] : this.warriors[this.p2Index];
    const card = slot === "p1" ? this.p1Card : this.p2Card;

    const s = warrior.stats;
    const statsHtml = `
      <div class="char-stat"><span>Strength</span><strong>${s.strength}</strong></div>
      <div class="char-stat"><span>Speed</span><strong>${s.speed}</strong></div>
      <div class="char-stat"><span>Ki</span><strong>${s.ki}</strong></div>
      <div class="char-stat"><span>Vitality</span><strong>${s.vitality}</strong></div>
    `;

    card.innerHTML = `
      <div class="char-header">
        <div class="char-name">${warrior.name}</div>
        <div class="char-type">[${warrior.type}]</div>
      </div>
      <div class="char-stats">${statsHtml}</div>
      <div class="char-stage">
        <img class="char-sprite" alt="${warrior.name} sprite">
      </div>
    `;

    const img = card.querySelector(".char-sprite") as HTMLImageElement;
    const frames = this.getFramesForWarrior(warrior);
    (img as any)._frames = frames;
    (img as any)._index = 0;
    img.src = frames[0] ?? "";

    if (slot === "p2") img.classList.add("char-sprite--flip");
    else img.classList.remove("char-sprite--flip");

    if (slot === "p1") this.p1Img = img; else this.p2Img = img;
  }

  private updateHeaderPicks(): void {
    this.pickP1.textContent = this.warriors[this.p1Index]?.name ?? "—";
    this.pickP2.textContent = this.warriors[this.p2Index]?.name ?? "—";
  }

  private updateStartButton(): void {
    const n1 = this.warriors[this.p1Index]?.name;
    const n2 = this.warriors[this.p2Index]?.name;
    this.buttonStart.disabled = !n1 || !n2 || n1 === n2;
  }
  //#endregion

  //#region Animation
  private startAnim(): void {
    if (this.animTimer) return;
    const delay = Math.max(30, Math.floor(1000 / this.framesPerSecond));
    this.animTimer = window.setInterval(() => {
      const imgs = [this.p1Img, this.p2Img].filter(Boolean) as HTMLImageElement[];
      for (const img of imgs) {
        const frames: string[] = (img as any)._frames || [];
        if (!frames.length) continue;
        let index: number = (img as any)._index ?? 0;
        index = (index + 1) % frames.length;
        (img as any)._index = index;
        img.src = frames[index];
      }
    }, delay) as unknown as number;
  }

  private stopAnim(): void {
    if (!this.animTimer) return;
    clearInterval(this.animTimer);
    this.animTimer = undefined;
  }
  //#endregion

  //#region Helpers
  private getFramesForWarrior(warrior: Warrior): string[] {
    const presets = presetsJson as WarriorPreset[];
    const preset = presets.find(p => p.name === warrior.name && Array.isArray(p.spriteFrames) && p.spriteFrames.length > 0);
    const raw = preset?.spriteFrames ?? this.gameManager.getSpriteFramesForRace(warrior.type) ?? [];
    return raw.map(p => new URL(p, import.meta.url).toString());
  }
  //#endregion
}
