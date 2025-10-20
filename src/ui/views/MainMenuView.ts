// Patterns: Singleton (AudioSystem)

import { AudioSystem } from "../../app/AudioSystem";

//#region Types
type El<T extends HTMLElement> = T;
//#endregion

export class MainMenuView {
  //#region Fields
  private section!: El<HTMLElement>;
  private btnPlay!: HTMLButtonElement;
  private audioSystem = AudioSystem.getInstance();
  //#endregion

  constructor(private readonly cb: { onPlay: () => void }) {}

  //#region Lifecycle
  public mount(): void {
    this.section = document.getElementById("menu-section") as HTMLElement;
    this.btnPlay = document.getElementById("btn-play") as HTMLButtonElement;

    this.btnPlay.addEventListener("click", () => this.onPlayClick());
  }
  //#endregion

  //#region Events
  private onPlayClick(): void {
    // Débloqué par geste utilisateur → on peut lancer la BGM
    this.audioSystem.enterMenu();
    this.cb.onPlay();
  }
  //#endregion
}
