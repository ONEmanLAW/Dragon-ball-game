import { AudioManager } from "../../app/AudioManager";
type El<T extends HTMLElement> = T;

export class MainMenuView {
  private section!: El<HTMLElement>;
  private btnPlay!: HTMLButtonElement;
  private audio = AudioManager.getInstance();

  constructor(private readonly cb: { onPlay: () => void }) {}

  public mount(): void {
    this.section = document.getElementById("menu-section") as HTMLElement;
    this.btnPlay = document.getElementById("btn-play") as HTMLButtonElement;

    this.audio.attachGlobalClickSfx();

    this.btnPlay.addEventListener("click", () => {
      this.audio.playMainTheme();
      this.cb.onPlay();
    });
  }
}
