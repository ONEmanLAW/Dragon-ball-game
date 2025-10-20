// Patterns: View (UI) + Callbacks (Inversion of Control)

type El<T extends HTMLElement> = T;

export class ModeMenuView {
  //#region Fields
  private section!: El<HTMLElement>;
  private btnOneVsOne!: HTMLButtonElement;
  private btnTournament!: HTMLButtonElement;
  private btnComingSoon!: HTMLButtonElement;
  //#endregion

  constructor(private readonly cb: {
    onOneVsOne: () => void;
    onSecondOption: () => void;
    onThirdOption: () => void;
  }) {}

  //#region Lifecycle
  public mount(): void {
    this.section      = document.getElementById("mode-section") as HTMLElement;
    this.btnOneVsOne  = document.getElementById("btn-mode-1v1") as HTMLButtonElement;
    this.btnTournament = document.getElementById("btn-mode-2") as HTMLButtonElement;
    this.btnComingSoon = document.getElementById("btn-mode-3") as HTMLButtonElement;

    this.btnOneVsOne.addEventListener("click",  () => this.onOneVsOneClick());
    this.btnTournament.addEventListener("click", () => this.onTournamentClick());
    this.btnComingSoon.addEventListener("click", () => this.onComingSoonClick());
  }
  //#endregion

  //#region Events
  private onOneVsOneClick(): void {
    this.cb.onOneVsOne();
  }

  private onTournamentClick(): void {
    this.cb.onSecondOption();
  }

  private onComingSoonClick(): void {
    this.cb.onThirdOption();
  }
  //#endregion
}
