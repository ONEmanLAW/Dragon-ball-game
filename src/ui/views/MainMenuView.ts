// MainMenuView.ts — Vue du menu principal (image-bouton PLAY)
// - Indépendante (montage/démontage DOM minimal)
// - Communication via callbacks (pas d'EventBus ici, juste du UI flow)

type El<T extends HTMLElement> = T;

export class MainMenuView {
  private section!: El<HTMLElement>;
  private playBtn!: El<HTMLImageElement>;

  constructor(private readonly cb: { onPlay: () => void }) {}

  public mount(): void {
    this.section = document.getElementById("menu-section") as HTMLElement;
    this.playBtn = document.getElementById("btn-play") as HTMLImageElement;

    // Sécurité si l’HTML n’est pas en place
    if (!this.section || !this.playBtn) {
      console.warn("[MainMenuView] DOM elements not found.");
      return;
    }

    // Accessibilité : Enter/Space déclenchent le "click"
    this.playBtn.addEventListener("click", () => this.cb.onPlay());
    this.playBtn.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.cb.onPlay();
      }
    });
  }
}
