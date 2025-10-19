// src/ui/views/TournamentView.ts
import { GameManager } from "../../app/GameManager";
import { CommandBus, CommandContext, SeedTournamentCommand, SimulateAIMatchCommand, PlayPlayerMatchCommand, logMiddleware } from "../../domain/commands";
import type { Warrior } from "../../domain/Warrior";

type El<T extends HTMLElement> = T;

export class TournamentView {
  private gm = GameManager.getInstance();
  private cmdCtx = new CommandContext(this.gm);
  private cmdBus = new CommandBus(this.cmdCtx, [logMiddleware]);

  private section!: El<HTMLElement>;
  private selectFighter!: HTMLSelectElement;
  private btnSeed!: HTMLButtonElement;
  private btnPlay!: HTMLButtonElement;
  private bracket!: HTMLDivElement;
  private status!: HTMLDivElement;

  constructor(private readonly cb: {
    onPlayMatch: (p1: Warrior, p2: Warrior, onEnded: (winner: string) => void) => void
  }) {}

  public mount(): void {
    this.section = document.getElementById("tournament-section") as HTMLElement;
    this.selectFighter = document.getElementById("tournament-select") as HTMLSelectElement;
    this.btnSeed = document.getElementById("tournament-seed") as HTMLButtonElement;
    this.btnPlay = document.getElementById("tournament-play") as HTMLButtonElement;
    this.bracket = document.getElementById("tournament-bracket") as HTMLDivElement;
    this.status = document.getElementById("tournament-status") as HTMLDivElement;

    this.btnSeed.addEventListener("click", () => this.seed());
    this.btnPlay.addEventListener("click", () => this.playStep());

    // état initial
    this.btnPlay.disabled = true;
    this.status.textContent = "Seed a bracket to start.";
  }

  public refreshRoster(): void {
    const list = this.gm.getAllWarriors();
    this.selectFighter.innerHTML = list
      .map(w => `<option value="${w.name}">${w.name} [${w.type}]</option>`)
      .join("");
  }

  public reset(): void {
    this.cmdCtx.tour = undefined;       
    this.bracket.innerHTML = "";
    this.status.textContent = "Tournament cancelled.";
    this.btnPlay.disabled = true;
  }

  private seed(): void {
    const all = this.gm.getAllWarriors().map(w => w.name);
    if (all.length < 8) {
      this.status.textContent = "Need at least 8 warriors.";
      return;
    }
    const player = this.selectFighter.value || all[0];

    const res = this.cmdBus.dispatch(new SeedTournamentCommand(player, all));
    if (!res.ok) {
      this.status.textContent = res.error;
      return;
    }

    this.renderBracket();
    this.status.textContent = "Seeded. Click Play.";
    this.btnPlay.disabled = false;
  }

  private playStep(): void {
    if (!this.cmdCtx.tour) {
      this.status.textContent = "Seed first.";
      return;
    }

    for (const { r, i, m } of this.cmdCtx.tour.pendingNonPlayer()) {
      const a = this.gm.getWarrior(m.a)!;
      const b = this.gm.getWarrior(m.b)!;
      this.cmdBus.dispatch(new SimulateAIMatchCommand(r, i, a, b));
    }

    const res = this.cmdBus.dispatch(new PlayPlayerMatchCommand((a, b, done) => {
      this.cb.onPlayMatch(a, b, (winner) => {
        done(winner);
        this.renderBracket();
        if (this.cmdCtx.tour!.isFinished()) {
          this.status.textContent = `🏆 ${this.cmdCtx.tour!.getWinner()} wins!`;
          this.btnPlay.disabled = true;
        } else {
          this.status.textContent = "Round updated. Click Play to continue.";
        }
      });
    }));

    if (!res.ok) {
      this.renderBracket();
      if (this.cmdCtx.tour!.isFinished()) {
        this.status.textContent = `🏆 ${this.cmdCtx.tour!.getWinner()} wins!`;
        this.btnPlay.disabled = true;
      }
    }
  }

  private renderBracket(): void {
    if (!this.cmdCtx.tour) {
      this.bracket.innerHTML = "";
      return;
    }

    const col = (title: string, ms: any[]) => `
      <div class="t-col">
        <h3>${title}</h3>
        <div class="t-list">
          ${ms.map((m: any) => `
            <div class="t-match ${m.done ? "done" : "pending"}">
              <div class="t-slot ${m.winner===m.a ? "win":""}">${m.a}</div>
              <div class="t-slot ${m.winner===m.b ? "win":""}">${m.b}</div>
            </div>
          `).join("")}
        </div>
      </div>`;

    const [qf, sf, fi] = this.cmdCtx.tour.rounds;
    this.bracket.innerHTML = `${col("Quarterfinals", qf)}${col("Semifinals", sf)}${col("Final", fi)}`;
  }
}
