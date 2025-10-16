// src/app/AudioManager.ts
export class AudioManager {
  private static instance: AudioManager;
  static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  private bgm?: HTMLAudioElement;
  private currentSrc?: string;
  private sfx = new Map<string, HTMLAudioElement>();
  private globalBound = false;
  private lastTick = 0;

  private readonly URLS = {
    menu:   new URL("../assets/audios/music.mp3",      import.meta.url).toString(),
    battle: new URL("../assets/audios/music.mp3",      import.meta.url).toString(),
    click:  new URL("../assets/audios/clickSound.wav", import.meta.url).toString(),
  };

  preload(): void {
    if (!this.sfx.has("click")) {
      const a = new Audio(this.URLS.click);
      a.preload = "auto";
      a.volume = 0.6;
      this.sfx.set("click", a);
    }
  }

  playMenu(): void  { this.playBgm(this.URLS.menu,   0.05); }
  playBattle(): void{ this.playBgm(this.URLS.battle, 0.5); }

  private playBgm(src: string, volume: number): void {
    if (this.bgm && this.currentSrc === src) {
      this.bgm.volume = volume;
      if (this.bgm.paused) this.bgm.play().catch(() => {});
      return;
    }
    this.stopBgm();
    this.bgm = new Audio(src);
    this.currentSrc = src;
    this.bgm.loop = true;
    this.bgm.preload = "auto";
    this.bgm.volume = volume;
    this.bgm.play().catch(() => {});
  }

  stopBgm(): void {
    if (!this.bgm) return;
    try { this.bgm.pause(); } catch {}
    this.bgm.currentTime = 0;
    this.bgm = undefined;
    this.currentSrc = undefined;
  }

  playSfx(name: "click"): void {
    const base = this.sfx.get(name);
    if (!base) return;
    const node = base.cloneNode(true) as HTMLAudioElement;
    node.volume = base.volume;
    node.play().catch(() => {});
  }

  attachGlobalClickSfx(): void {
    if (this.globalBound) return;
    this.globalBound = true;
    this.preload();

    const handler = (ev: PointerEvent | MouseEvent) => {
      const now = performance.now();
      if (now - this.lastTick < 80) return;
      const t = ev.target as HTMLElement | null;
      if (t && t.closest("[data-click-sfx='off']")) return;
      if ("pointerType" in ev && (ev as PointerEvent).pointerType && (ev as PointerEvent).pointerType !== "mouse") return;
      this.lastTick = now;
      this.playSfx("click");
    };

    document.addEventListener("pointerdown", handler, { capture: true });
  }
}
