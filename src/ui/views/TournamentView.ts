import { GameManager } from "../../app/GameManager";
import {
  CommandBus, CommandContext,
  SeedTournamentCommand, SimulateAIMatchCommand, PlayPlayerMatchCommand, logMiddleware
} from "../../domain/commands";
import type { Warrior } from "../../domain/Warrior";

type El<T extends HTMLElement> = T;

export class TournamentView {
  private gm = GameManager.getInstance();
  private cmdCtx = new CommandContext(this.gm);
  private cmdBus = new CommandBus(this.cmdCtx, [logMiddleware]);

  private section!: El<HTMLElement>;
  private btnPlay!: HTMLButtonElement;
  private btnCancel!: HTMLButtonElement;
  private bracket!: HTMLDivElement;
  private status!: HTMLDivElement;

  private modal!: HTMLElement;
  private modalYes!: HTMLButtonElement;
  private modalNo!: HTMLButtonElement;
  private modalBackdrop!: HTMLDivElement;

  private playerName: string | null = null;

  constructor(private readonly cb: {
    onPlayMatch: (p1: Warrior, p2: Warrior, onEnded: (winner: string) => void) => void,
    onCancel: () => void
  }) {}

  public mount(): void {
    this.section   = document.getElementById("tournament-section") as HTMLElement;
    this.btnPlay   = document.getElementById("tournament-play")   as HTMLButtonElement;
    this.btnCancel = document.getElementById("tournament-cancel") as HTMLButtonElement;
    this.bracket   = document.getElementById("tournament-bracket") as HTMLDivElement;
    this.status    = document.getElementById("tournament-status")  as HTMLDivElement;

    this.modal         = document.getElementById("tournament-modal") as HTMLElement;
    this.modalYes      = document.getElementById("tmodal-yes") as HTMLButtonElement;
    this.modalNo       = document.getElementById("tmodal-no")  as HTMLButtonElement;
    this.modalBackdrop = this.modal.querySelector(".t-modal-backdrop") as HTMLDivElement;

    this.btnPlay.addEventListener("click",  () => this.playStep());
    this.btnCancel.addEventListener("click",() => this.openModal());

    this.modalYes.addEventListener("click", () => this.confirmCancel());
    this.modalNo.addEventListener("click",  () => this.closeModal());
    this.modalBackdrop.addEventListener("click", () => this.closeModal());
    window.addEventListener("keydown", (e) => {
      if (this.section.hidden) return;
      if (e.key === "Escape" && !this.modal.hidden) this.closeModal();
    });

    this.status.textContent = "Play to start the tournament.";
    this.btnCancel.hidden = true;
    this.hideModal();
  }

  public setPlayer(name: string): void {
    this.playerName = name;
  }

  public onShow(): void {
    if (this.cmdCtx.tour) {
      this.renderBracket();
      this.status.textContent = this.cmdCtx.tour.isFinished()
        ? `🏆 ${this.cmdCtx.tour.getWinner()} wins!`
        : "Bracket ready. Play to advance.";
      this.btnCancel.hidden = false;
    } else {
      this.bracket.innerHTML = "";
      this.status.textContent = "Play to start the tournament.";
      this.btnCancel.hidden = true;
      this.hideModal();
    }
  }

  public reset(): void {
    this.cmdCtx.tour = undefined;
    this.bracket.innerHTML = "";
    this.status.textContent = "Tournament cancelled.";
    this.btnCancel.hidden = true;
    this.hideModal();
  }

  public startWithPlayer(name: string): void {
    this.playerName = name;
    this.cmdCtx.tour = undefined;

    const ok = this.seedWithCurrentPlayer();
    if (!ok) return;

    this.renderBracket();
    this.status.textContent = "Bracket ready. Play to advance.";
    this.btnCancel.hidden = false;
  }

  private ensureSeed(): boolean {
    if (this.cmdCtx.tour) return true;
    return this.seedWithCurrentPlayer();
  }

  private seedWithCurrentPlayer(): boolean {
    const all = this.gm.getAllWarriors().map(w => w.name);
    if (all.length < 8) {
      this.status.textContent = "Need at least 8 warriors.";
      return false;
    }
    const player = this.playerName || all[0];
    const res = this.cmdBus.dispatch(new SeedTournamentCommand(player, all));
    if (!res.ok) {
      this.status.textContent = res.error;
      return false;
    }
    this.btnCancel.hidden = false;
    return true;
  }

  private playStep(): void {
    if (!this.ensureSeed()) return;

    for (const { r, i, m } of this.cmdCtx.tour!.pendingNonPlayer()) {
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
        } else {
          this.status.textContent = "Round updated. Play to continue.";
        }
      });
    }));

    if (!res.ok) {
      this.renderBracket();
      if (this.cmdCtx.tour!.isFinished()) {
        this.status.textContent = `🏆 ${this.cmdCtx.tour!.getWinner()} wins!`;
      }
    }
  }

  private renderBracket(): void {
    if (!this.cmdCtx.tour) { this.bracket.innerHTML = ""; return; }

    const you = this.playerName;

    const col = (title: string, ms: any[]) => `
      <div class="t-col">
        <h3>${title}</h3>
        <div class="t-list">
          ${ms.map((m: any) => `
            <div class="t-match ${m.done ? "done" : "pending"}">
              <div class="t-slot ${m.winner===m.a ? "win":""} ${you===m.a ? "player":""}">${m.a}</div>
              <div class="t-slot ${m.winner===m.b ? "win":""} ${you===m.b ? "player":""}">${m.b}</div>
            </div>
          `).join("")}
        </div>
      </div>`;

    const [qf, sf, fi] = this.cmdCtx.tour.rounds;
    this.bracket.innerHTML = `${col("Quarterfinals", qf)}${col("Semifinals", sf)}${col("Final", fi)}`;
  }

  private openModal(): void {
    this.modal.hidden = false;
  }
  private closeModal(): void {
    this.hideModal();
  }
  private hideModal(): void {
    this.modal.hidden = true;
  }
  private confirmCancel(): void {
    this.reset();
    this.cb.onCancel();
  }
}
