// Patterns: View (UI) + Command (GoF) via CommandBus/CommandContext

import { GameManager } from "../../app/GameManager";
import {
  CommandBus,
  CommandContext,
  SeedTournamentCommand,
  SimulateAIMatchCommand,
  PlayPlayerMatchCommand,
  logMiddleware
} from "../../domain/commands";
import type { Warrior } from "../../domain/Warrior";
import type { Match } from "../../domain/tournament/Tournament";

type El<T extends HTMLElement> = T;

export class TournamentView {
  //#region Infra
  private gameManager = GameManager.getInstance();
  private commandContext = new CommandContext(this.gameManager);
  private commandBus = new CommandBus(this.commandContext, [logMiddleware]);
  //#endregion

  //#region DOM refs
  private section!: El<HTMLElement>;
  private buttonPlay!: HTMLButtonElement;
  private buttonCancel!: HTMLButtonElement;
  private bracketElement!: HTMLDivElement;
  private statusElement!: HTMLDivElement;

  private modal!: HTMLElement;
  private modalYes!: HTMLButtonElement;
  private modalNo!: HTMLButtonElement;
  private modalBackdrop!: HTMLDivElement;
  //#endregion

  //#region Local state
  private playerName: string | null = null;
  //#endregion

  constructor(private readonly cb: {
    onPlayMatch: (p1: Warrior, p2: Warrior, onEnded: (winner: string) => void) => void,
    onCancel: () => void
  }) {}

  //#region Lifecycle
  public mount(): void {
    this.section = document.getElementById("tournament-section") as HTMLElement;
    this.buttonPlay = document.getElementById("tournament-play") as HTMLButtonElement;
    this.buttonCancel = document.getElementById("tournament-cancel") as HTMLButtonElement;
    this.bracketElement = document.getElementById("tournament-bracket") as HTMLDivElement;
    this.statusElement = document.getElementById("tournament-status") as HTMLDivElement;

    this.modal = document.getElementById("tournament-modal") as HTMLElement;
    this.modalYes = document.getElementById("tmodal-yes") as HTMLButtonElement;
    this.modalNo = document.getElementById("tmodal-no") as HTMLButtonElement;
    this.modalBackdrop = this.modal.querySelector(".t-modal-backdrop") as HTMLDivElement;

    this.buttonPlay.addEventListener("click", () => this.playStep());
    this.buttonCancel.addEventListener("click", () => this.openModal());

    this.modalYes.addEventListener("click", () => this.confirmCancel());
    this.modalNo.addEventListener("click", () => this.closeModal());
    this.modalBackdrop.addEventListener("click", () => this.closeModal());
    window.addEventListener("keydown", (e) => {
      if (this.section.hidden) return;
      if (e.key === "Escape" && !this.modal.hidden) this.closeModal();
    });

    this.statusElement.textContent = "Play to start the tournament.";
    this.buttonCancel.hidden = true;
    this.hideModal();
  }

  public setPlayer(name: string): void {
    this.playerName = name;
  }

  public onShow(): void {
    if (this.commandContext.tour) {
      this.renderBracket();
      this.statusElement.textContent = this.commandContext.tour.isFinished()
        ? `🏆 ${this.commandContext.tour.getWinner()} wins!`
        : "Bracket ready. Play to advance.";
      this.buttonCancel.hidden = false;
    } else {
      this.bracketElement.innerHTML = "";
      this.statusElement.textContent = "Play to start the tournament.";
      this.buttonCancel.hidden = true;
      this.hideModal();
    }
  }
  //#endregion

  //#region Public API
  public reset(): void {
    this.commandContext.tour = undefined;
    this.bracketElement.innerHTML = "";
    this.statusElement.textContent = "Tournament cancelled.";
    this.buttonCancel.hidden = true;
    this.hideModal();
  }

  public startWithPlayer(name: string): void {
    this.playerName = name;
    this.commandContext.tour = undefined;

    if (!this.seedWithCurrentPlayer()) return;

    this.renderBracket();
    this.statusElement.textContent = "Bracket ready. Play to advance.";
    this.buttonCancel.hidden = false;
  }
  //#endregion

  //#region Internals
  private ensureSeed(): boolean {
    return this.commandContext.tour ? true : this.seedWithCurrentPlayer();
  }

  private seedWithCurrentPlayer(): boolean {
    const all = this.gameManager.getAllWarriors().map(w => w.name);
    if (all.length < 8) {
      this.statusElement.textContent = "Need at least 8 warriors.";
      return false;
    }
    const player = this.playerName || all[0];
    const res = this.commandBus.dispatch(new SeedTournamentCommand(player, all));
    if (!res.ok) {
      this.statusElement.textContent = res.error;
      return false;
    }
    this.buttonCancel.hidden = false;
    return true;
  }

  private playStep(): void {
    if (!this.ensureSeed()) return;

    // Simule tous les matches IA (non-joueur) en attente
    for (const { r, i, m } of this.commandContext.tour!.pendingNonPlayer()) {
      const a = this.gameManager.getWarrior(m.a)!;
      const b = this.gameManager.getWarrior(m.b)!;
      this.commandBus.dispatch(new SimulateAIMatchCommand(r, i, a, b));
    }

    // Demande à l'UI de jouer le match du joueur (callback fourni par AppUI)
    const res = this.commandBus.dispatch(new PlayPlayerMatchCommand((a, b, done) => {
      this.cb.onPlayMatch(a, b, (winner) => {
        done(winner);
        this.renderBracket();
        if (this.commandContext.tour!.isFinished()) {
          this.statusElement.textContent = `🏆 ${this.commandContext.tour!.getWinner()} wins!`;
        } else {
          this.statusElement.textContent = "Round updated. Play to continue.";
        }
      });
    }));

    if (!res.ok) {
      this.renderBracket();
      if (this.commandContext.tour!.isFinished()) {
        this.statusElement.textContent = `🏆 ${this.commandContext.tour!.getWinner()} wins!`;
      }
    }
  }

  private renderBracket(): void {
    if (!this.commandContext.tour) {
      this.bracketElement.innerHTML = "";
      return;
    }

    const player = this.playerName;

    const column = (title: string, matches: Match[]) => `
      <div class="t-col">
        <h3>${title}</h3>
        <div class="t-list">
          ${matches.map((m) => `
            <div class="t-match ${m.done ? "done" : "pending"}">
              <div class="t-slot ${m.winner===m.a ? "win":""} ${player===m.a ? "player":""}">${m.a}</div>
              <div class="t-slot ${m.winner===m.b ? "win":""} ${player===m.b ? "player":""}">${m.b}</div>
            </div>
          `).join("")}
        </div>
      </div>`;

    const [quarterfinals, semifinals, final] = this.commandContext.tour.rounds;
    this.bracketElement.innerHTML =
      `${column("Quarterfinals", quarterfinals)}${column("Semifinals", semifinals)}${column("Final", final)}`;
  }
  //#endregion

  //#region Modal
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
  //#endregion
}
