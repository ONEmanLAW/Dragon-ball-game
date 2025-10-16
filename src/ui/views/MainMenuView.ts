// src/ui/views/MainMenuView.ts
import { AudioSystem } from "../../app/AudioSystem";

type El<T extends HTMLElement> = T;

export class MainMenuView {
  private section!: El<HTMLElement>;
  private btnPlay!: HTMLButtonElement;

  constructor(private readonly cb: { onPlay: () => void }) {}

  public mount(): void {
    this.section = document.getElementById("menu-section") as HTMLElement;
    this.btnPlay = document.getElementById("btn-play") as HTMLButtonElement;

    this.btnPlay.addEventListener("click", () => {
      // geste utilisateur → on peut lancer la BGM
      AudioSystem.getInstance().enterMenu();
      this.cb.onPlay();
    });
  }
}
