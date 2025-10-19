import type { Warrior } from "../../domain/Warrior";
import type { WarriorPreset } from "../../data/WarriorPreset";
import presetsJson from "../../data/warriors.json";
import { GameManager } from "../../app/GameManager";

type El<T extends HTMLElement> = T;
type Slot = "p1" | "p2";

export class RosterView {
  private gm = GameManager.getInstance();

  private section!: El<HTMLElement>;
  private btnStart!: HTMLButtonElement;

  private pickP1!: HTMLElement;
  private pickP2!: HTMLElement;

  private btnP1Prev!: HTMLButtonElement;
  private btnP1Next!: HTMLButtonElement;
  private btnP2Prev!: HTMLButtonElement;
  private btnP2Next!: HTMLButtonElement;

  private p1Card!: HTMLDivElement;
  private p2Card!: HTMLDivElement;

  private list: Warrior[] = [];
  private p1Index = 0;
  private p2Index = 1;

  private animTimer: number | undefined;
  private fps = 6;
  private p1Img?: HTMLImageElement;
  private p2Img?: HTMLImageElement;

  constructor(private readonly cb: { onStartBattle: (p1Name: string, p2Name: string) => void }) {}

  public mount(): void {
    this.section   = document.getElementById("roster-section") as HTMLElement;
    this.btnStart  = document.getElementById("btn-start-battle") as HTMLButtonElement;

    this.pickP1    = document.getElementById("pick-p1") as HTMLElement;
    this.pickP2    = document.getElementById("pick-p2") as HTMLElement;

    this.btnP1Prev = document.getElementById("btn-p1-prev") as HTMLButtonElement;
    this.btnP1Next = document.getElementById("btn-p1-next") as HTMLButtonElement;
    this.btnP2Prev = document.getElementById("btn-p2-prev") as HTMLButtonElement;
    this.btnP2Next = document.getElementById("btn-p2-next") as HTMLButtonElement;

    this.p1Card    = document.getElementById("p1-card") as HTMLDivElement;
    this.p2Card    = document.getElementById("p2-card") as HTMLDivElement;

    this.btnP1Prev.addEventListener("click", () => this.step("p1", -1));
    this.btnP1Next.addEventListener("click", () => this.step("p1", +1));
    this.btnP2Prev.addEventListener("click", () => this.step("p2", -1));
    this.btnP2Next.addEventListener("click", () => this.step("p2", +1));

    this.btnStart.addEventListener("click", () => {
      const p1 = this.list[this.p1Index]?.name;
      const p2 = this.list[this.p2Index]?.name;
      if (!p1 || !p2 || p1 === p2) return;
      this.cb.onStartBattle(p1, p2);
    });
  }

  public onShow(): void { this.startAnim(); }
  public onHide(): void { this.stopAnim(); }

  public refreshRoster(): void {
    this.list = this.gm.getAllWarriors();
    if (this.list.length === 0) return;

    this.p1Index = 0;
    this.p2Index = this.list.length > 1 ? 1 : 0;
    if (this.p2Index === this.p1Index) this.p2Index = (this.p1Index + 1) % this.list.length;

    this.renderSide("p1");
    this.renderSide("p2");
    this.updateHeaderPicks();
    this.updateStartButton();

    this.stopAnim();
    this.startAnim();
  }

  private step(slot: Slot, dir: -1 | 1): void {
    const len = this.list.length;
    if (len === 0) return;

    const avoid = slot === "p1" ? this.p2Index : this.p1Index;
    const cur   = slot === "p1" ? this.p1Index : this.p2Index;

    let next = (cur + dir + len) % len;
    if (next === avoid) next = (next + dir + len) % len; // évite même perso des 2 côtés

    if (slot === "p1") this.p1Index = next; else this.p2Index = next;

    this.renderSide(slot);
    this.updateHeaderPicks();
    this.updateStartButton();

    this.stopAnim();
    this.startAnim();
  }

  private renderSide(slot: Slot): void {
    const w = slot === "p1" ? this.list[this.p1Index] : this.list[this.p2Index];
    const card = slot === "p1" ? this.p1Card : this.p2Card;

    const s = w.stats;
    const statsHtml = `
      <div class="char-stat"><span>Strength</span><strong>${s.strength}</strong></div>
      <div class="char-stat"><span>Speed</span><strong>${s.speed}</strong></div>
      <div class="char-stat"><span>Ki</span><strong>${s.ki}</strong></div>
      <div class="char-stat"><span>Vitality</span><strong>${s.vitality}</strong></div>
    `;

    card.innerHTML = `
      <div class="char-header">
        <div class="char-name">${w.name}</div>
        <div class="char-type">[${w.type}]</div>
      </div>

      <div class="char-stats">${statsHtml}</div>

      <div class="char-stage">
        <img class="char-sprite" alt="${w.name} sprite">
      </div>
    `;

    const img = card.querySelector(".char-sprite") as HTMLImageElement;
    const frames = this.getFramesForWarrior(w);
    (img as any)._frames = frames;
    (img as any)._index  = 0;
    img.src = frames[0] ?? "";

    if (slot === "p2") img.classList.add("char-sprite--flip");
    else               img.classList.remove("char-sprite--flip");

    if (slot === "p1") this.p1Img = img; else this.p2Img = img;
  }

  private updateHeaderPicks(): void {
    this.pickP1.textContent = this.list[this.p1Index]?.name ?? "—";
    this.pickP2.textContent = this.list[this.p2Index]?.name ?? "—";
  }

  private updateStartButton(): void {
    const n1 = this.list[this.p1Index]?.name;
    const n2 = this.list[this.p2Index]?.name;
    this.btnStart.disabled = !n1 || !n2 || n1 === n2;
  }

  private startAnim(): void {
    if (this.animTimer) return;
    const delay = Math.max(30, Math.floor(1000 / this.fps));
    this.animTimer = window.setInterval(() => {
      const imgs = [this.p1Img, this.p2Img].filter(Boolean) as HTMLImageElement[];
      for (const img of imgs) {
        const frames: string[] = (img as any)._frames || [];
        if (frames.length === 0) continue;
        let index: number = (img as any)._index ?? 0;
        index = (index + 1) % frames.length;
        (img as any)._index = index;
        img.src = frames[index];
      }
    }, delay) as unknown as number;
  }

  private stopAnim(): void {
    if (this.animTimer) {
      clearInterval(this.animTimer);
      this.animTimer = undefined;
    }
  }

  private getFramesForWarrior(w: Warrior): string[] {
    const presets = presetsJson as WarriorPreset[];
    const preset = presets.find(p => p.name === w.name && Array.isArray(p.spriteFrames) && p.spriteFrames.length > 0);
    const raw = preset?.spriteFrames ?? this.gm.getSpriteFramesForRace(w.type) ?? [];
    return raw.map(p => new URL(p, import.meta.url).toString());
  }
}
