export class AudioManager {
  //#region Singleton
  private static instance: AudioManager;
  static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }
  //#endregion

  //#region Fields
  private backgroundMusic?: HTMLAudioElement;
  private currentSource?: string;
  private soundEffects = new Map<string, HTMLAudioElement>();
  private isGlobalClickBound = false;
  private lastClickTick = 0;

  private readonly audioUrls = {
    menu: new URL("../assets/audios/music.mp3", import.meta.url).toString(),
    battle: new URL("../assets/audios/secondMusic.mp3", import.meta.url).toString(),
    click: new URL("../assets/audios/clickSound.wav", import.meta.url).toString(),
  };
  //#endregion

  //#region Public API
  preload(): void {
    if (!this.soundEffects.has("click")) {
      const audio = new Audio(this.audioUrls.click);
      audio.preload = "auto";
      audio.volume = 0.6;
      this.soundEffects.set("click", audio);
    }
  }

  playMenu(): void {
    this.playBackgroundMusic(this.audioUrls.menu, 0.05);
  }

  playBattle(): void {
    this.playBackgroundMusic(this.audioUrls.battle, 0.1);
  }

  stopBgm(): void {
    if (!this.backgroundMusic) return;
    try { this.backgroundMusic.pause(); } catch {}
    this.backgroundMusic.currentTime = 0;
    this.backgroundMusic = undefined;
    this.currentSource = undefined;
  }

  playSfx(name: "click"): void {
    const base = this.soundEffects.get(name);
    if (!base) return;
    const node = base.cloneNode(true) as HTMLAudioElement;
    node.volume = base.volume;
    node.play().catch(() => {});
  }

  attachGlobalClickSfx(): void {
    if (this.isGlobalClickBound) return;
    this.isGlobalClickBound = true;
    this.preload();

    const handler = (ev: PointerEvent | MouseEvent) => {
      const now = performance.now();
      if (now - this.lastClickTick < 80) return;

      const target = ev.target as HTMLElement | null;
      if (target && target.closest("[data-click-sfx='off']")) return;

      if ("pointerType" in ev) {
        const pt = (ev as PointerEvent).pointerType;
        if (pt && pt !== "mouse") return;
      }

      this.lastClickTick = now;
      this.playSfx("click");
    };

    document.addEventListener("pointerdown", handler, { capture: true });
  }
  //#endregion

  //#region Internals
  private playBackgroundMusic(src: string, volume: number): void {
    if (this.backgroundMusic && this.currentSource === src) {
      this.backgroundMusic.volume = volume;
      if (this.backgroundMusic.paused) this.backgroundMusic.play().catch(() => {});
      return;
    }

    this.stopBgm();
    this.backgroundMusic = new Audio(src);
    this.currentSource = src;
    this.backgroundMusic.loop = true;
    this.backgroundMusic.preload = "auto";
    this.backgroundMusic.volume = volume;
    this.backgroundMusic.play().catch(() => {});
  }
  //#endregion
}
