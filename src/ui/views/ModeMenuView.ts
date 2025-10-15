// ModeMenuView.ts — menu des modes de jeu

type El<T extends HTMLElement> = T;

export class ModeMenuView {
  private section!: El<HTMLElement>;
  private btn1v1!: HTMLButtonElement;
  private btnMode2!: HTMLButtonElement;
  private btnMode3!: HTMLButtonElement;

  constructor(private readonly cb: {
    onOneVsOne: () => void;
    onSecondOption: () => void;
    onThirdOption: () => void;
  }) {}

  public mount(): void {
    this.section   = document.getElementById("mode-section") as HTMLElement;
    this.btn1v1    = document.getElementById("btn-mode-1v1") as HTMLButtonElement;
    this.btnMode2  = document.getElementById("btn-mode-2") as HTMLButtonElement;
    this.btnMode3  = document.getElementById("btn-mode-3") as HTMLButtonElement;

    this.btn1v1.addEventListener("click", () => this.cb.onOneVsOne());
    this.btnMode2.addEventListener("click", () => this.cb.onSecondOption());
    this.btnMode3.addEventListener("click", () => this.cb.onThirdOption());
  }
}
